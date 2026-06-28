// Repository / imperative shell for Armored Focus (SPEC §6, §8, §11).
//
// All D1 access lives here. Pure row<->domain conversion lives in mappers.ts.
// Writes that touch multiple statements use db.batch([...]) so they apply
// atomically. All SQL is parameterized via .bind(); no value interpolation.
//
// v1 is single-user: every query is scoped to a `user_id` that defaults to
// 'default'. Adding auth later means resolving the real user id per request and
// passing it in — no schema or query reshape.

import type { D1Database } from '@cloudflare/workers-types';
import type { Card, LogEntry, Rules, UserStats } from '$lib/core/types';
import { initialRules, DEFAULT_USER_NAME } from '$lib/core/rules';
import {
	cardNoteRows,
	cardQuestNoteRows,
	cardQuestRows,
	cardToRow,
	rowToCard,
	type CardNoteRow,
	type CardRow,
	type LogRow,
	type QuestNoteRow,
	type QuestRow,
	type Side
} from './mappers';

export const DEFAULT_USER_ID = 'default';

export interface AppState {
	userStats: UserStats;
	cards: Card[];
	rules: Rules;
	dailyLog: LogEntry[];
	bonusProgress: Record<string, number>;
}

interface UserRow {
	id: string;
	name: string;
	exp: number;
	level: number;
}

// ---- Seeding ---------------------------------------------------------------

/**
 * Idempotently seed the single default user: user row (name DEFAULT_USER_NAME,
 * exp 0, level 1), the editable rules blob (initialRules), and bonus_progress
 * 'b1' -> 2 (SPEC §8). Existing data is left untouched (INSERT OR IGNORE).
 */
export async function ensureSeed(db: D1Database, userId: string = DEFAULT_USER_ID): Promise<void> {
	await db.batch([
		db
			.prepare('INSERT OR IGNORE INTO users (id, name, exp, level) VALUES (?, ?, ?, ?)')
			.bind(userId, DEFAULT_USER_NAME, 0, 1),
		db
			.prepare('INSERT OR IGNORE INTO rules (user_id, data) VALUES (?, ?)')
			.bind(userId, JSON.stringify(initialRules)),
		db
			.prepare('INSERT OR IGNORE INTO bonus_progress (user_id, bonus_id, current) VALUES (?, ?, ?)')
			.bind(userId, 'b1', 2)
	]);
}

// ---- Load ------------------------------------------------------------------

/**
 * Load the full application state for a user: stats, all cards (assembled with
 * their quests/notes/logs), the rules blob, the global dailyLog, and bonus
 * progress. side.logs on each card are the activity_log rows for that card+side;
 * dailyLog is the full activity_log for the user.
 */
export async function loadState(
	db: D1Database,
	userId: string = DEFAULT_USER_ID
): Promise<AppState> {
	const [userRes, rulesRes, cardsRes, questsRes, questNotesRes, cardNotesRes, logsRes, bonusRes] =
		await db.batch([
			db.prepare('SELECT id, name, exp, level FROM users WHERE id = ?').bind(userId),
			db.prepare('SELECT data FROM rules WHERE user_id = ?').bind(userId),
			db.prepare('SELECT * FROM cards WHERE user_id = ?').bind(userId),
			db
				.prepare(
					'SELECT q.* FROM quests q JOIN cards c ON c.id = q.card_id WHERE c.user_id = ?'
				)
				.bind(userId),
			db
				.prepare(
					'SELECT qn.* FROM quest_notes qn JOIN quests q ON q.id = qn.quest_id JOIN cards c ON c.id = q.card_id WHERE c.user_id = ?'
				)
				.bind(userId),
			db
				.prepare(
					'SELECT cn.* FROM card_notes cn JOIN cards c ON c.id = cn.card_id WHERE c.user_id = ?'
				)
				.bind(userId),
			db
				.prepare('SELECT * FROM activity_log WHERE user_id = ? ORDER BY date DESC')
				.bind(userId),
			db.prepare('SELECT bonus_id, current FROM bonus_progress WHERE user_id = ?').bind(userId)
		]);

	const userRow = (userRes.results as UserRow[])[0];
	const userStats: UserStats = userRow
		? { name: userRow.name, exp: userRow.exp, level: userRow.level }
		: { name: DEFAULT_USER_NAME, exp: 0, level: 1 };

	const rulesRow = (rulesRes.results as { data: string }[])[0];
	const rules: Rules = rulesRow ? (JSON.parse(rulesRow.data) as Rules) : initialRules;

	const cardRows = cardsRes.results as unknown as CardRow[];
	const questRows = questsRes.results as unknown as QuestRow[];
	const questNoteRows = questNotesRes.results as unknown as QuestNoteRow[];
	const cardNoteRowsAll = cardNotesRes.results as unknown as CardNoteRow[];
	const logRows = logsRes.results as unknown as LogRow[];

	const cards = cardRows.map((cardRow) =>
		rowToCard(cardRow, questRows, questNoteRows, cardNoteRowsAll, logRows)
	);

	const dailyLog = logRows.map((l) => ({
		id: l.id,
		clientName: l.client_name,
		questType: l.quest_type,
		exp: l.exp,
		date: l.date,
		...(l.commission !== null && l.commission !== undefined ? { commission: l.commission } : {}),
		...(l.note !== null && l.note !== undefined ? { note: l.note } : {})
	})) as LogEntry[];

	const bonusProgress: Record<string, number> = {};
	for (const b of bonusRes.results as { bonus_id: string; current: number }[]) {
		bonusProgress[b.bonus_id] = b.current;
	}

	return { userStats, cards, rules, dailyLog, bonusProgress };
}

// ---- Card writes -----------------------------------------------------------

/**
 * Upsert a card and fully replace its quests, quest_notes and card_notes
 * (delete-then-insert) in a single atomic batch. Activity log entries are NOT
 * touched here (they are append-only via appendLog).
 */
export async function saveCard(db: D1Database, userId: string, card: Card): Promise<void> {
	const c = cardToRow(userId, card);
	const quests = cardQuestRows(card);
	const questNotes = cardQuestNoteRows(card);
	const notes = cardNoteRows(card);

	const statements = [
		db
			.prepare(
				`INSERT INTO cards (
					id, user_id, primary_side, name, address, mailing_address, phone, email, dob,
					license, residence_type, user_rating, relationship_score, is_coi, is_bni,
					is_standalone, connections, client_meta, business_meta
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
				ON CONFLICT(id) DO UPDATE SET
					user_id = excluded.user_id,
					primary_side = excluded.primary_side,
					name = excluded.name,
					address = excluded.address,
					mailing_address = excluded.mailing_address,
					phone = excluded.phone,
					email = excluded.email,
					dob = excluded.dob,
					license = excluded.license,
					residence_type = excluded.residence_type,
					user_rating = excluded.user_rating,
					relationship_score = excluded.relationship_score,
					is_coi = excluded.is_coi,
					is_bni = excluded.is_bni,
					is_standalone = excluded.is_standalone,
					connections = excluded.connections,
					client_meta = excluded.client_meta,
					business_meta = excluded.business_meta`
			)
			.bind(
				c.id,
				c.user_id,
				c.primary_side,
				c.name,
				c.address,
				c.mailing_address,
				c.phone,
				c.email,
				c.dob,
				c.license,
				c.residence_type,
				c.user_rating,
				c.relationship_score,
				c.is_coi,
				c.is_bni,
				c.is_standalone,
				c.connections,
				c.client_meta,
				c.business_meta
			),
		// Replace child collections (quest_notes cascade from quests delete).
		db.prepare('DELETE FROM quests WHERE card_id = ?').bind(card.id),
		db.prepare('DELETE FROM card_notes WHERE card_id = ?').bind(card.id)
	];

	for (const q of quests) {
		statements.push(
			db
				.prepare(
					`INSERT INTO quests (id, card_id, side, type, base_exp, due_date, status, tracked, completed_date, completion_type)
					VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
				)
				.bind(
					q.id,
					q.card_id,
					q.side,
					q.type,
					q.base_exp,
					q.due_date,
					q.status,
					q.tracked,
					q.completed_date,
					q.completion_type
				)
		);
	}
	for (const n of questNotes) {
		statements.push(
			db
				.prepare('INSERT INTO quest_notes (id, quest_id, text, date) VALUES (?, ?, ?, ?)')
				.bind(n.id, n.quest_id, n.text, n.date)
		);
	}
	for (const n of notes) {
		statements.push(
			db
				.prepare('INSERT INTO card_notes (id, card_id, side, text, date) VALUES (?, ?, ?, ?, ?)')
				.bind(n.id, n.card_id, n.side, n.text, n.date)
		);
	}

	await db.batch(statements);
}

/**
 * Delete a card and everything it owns. quests, quest_notes, card_notes and
 * activity_log rows cascade via FK ON DELETE CASCADE; the explicit deletes here
 * keep it correct even if foreign_keys enforcement is off.
 */
export async function deleteCard(db: D1Database, cardId: string): Promise<void> {
	await db.batch([
		db
			.prepare('DELETE FROM quest_notes WHERE quest_id IN (SELECT id FROM quests WHERE card_id = ?)')
			.bind(cardId),
		db.prepare('DELETE FROM quests WHERE card_id = ?').bind(cardId),
		db.prepare('DELETE FROM card_notes WHERE card_id = ?').bind(cardId),
		db.prepare('DELETE FROM activity_log WHERE card_id = ?').bind(cardId),
		db.prepare('DELETE FROM cards WHERE id = ?').bind(cardId)
	]);
}

// ---- Stats / log / rules / bonuses ----------------------------------------

export async function saveUserStats(
	db: D1Database,
	userId: string,
	stats: UserStats
): Promise<void> {
	await db
		.prepare(
			`INSERT INTO users (id, name, exp, level) VALUES (?, ?, ?, ?)
			ON CONFLICT(id) DO UPDATE SET name = excluded.name, exp = excluded.exp, level = excluded.level`
		)
		.bind(userId, stats.name, stats.exp, stats.level)
		.run();
}

/** Append one activity_log entry (optionally tied to a card + side). */
export async function appendLog(
	db: D1Database,
	userId: string,
	entry: LogEntry,
	cardId: string | null = null,
	side: Side | null = null
): Promise<void> {
	await db
		.prepare(
			`INSERT INTO activity_log (id, user_id, card_id, side, client_name, quest_type, exp, commission, date, note)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(
			entry.id,
			userId,
			cardId,
			side,
			entry.clientName,
			entry.questType,
			entry.exp,
			entry.commission ?? null,
			entry.date,
			entry.note ?? null
		)
		.run();
}

/** Replace the entire rules blob for a user (Rules screen saves wholesale). */
export async function saveRules(db: D1Database, userId: string, rules: Rules): Promise<void> {
	await db
		.prepare(
			`INSERT INTO rules (user_id, data) VALUES (?, ?)
			ON CONFLICT(user_id) DO UPDATE SET data = excluded.data`
		)
		.bind(userId, JSON.stringify(rules))
		.run();
}

export async function setBonusProgress(
	db: D1Database,
	userId: string,
	bonusId: string,
	current: number
): Promise<void> {
	await db
		.prepare(
			`INSERT INTO bonus_progress (user_id, bonus_id, current) VALUES (?, ?, ?)
			ON CONFLICT(user_id, bonus_id) DO UPDATE SET current = excluded.current`
		)
		.bind(userId, bonusId, current)
		.run();
}
