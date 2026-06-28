// Pure row <-> domain mappers for the D1 persistence layer (SPEC §5, §11).
//
// These functions have NO D1/runtime dependency: they only convert between the
// plain row shapes used by SQL and the domain objects from $lib/core/types, so
// they are fully unit-testable in pure Node. All I/O lives in db.ts.
//
// Conventions:
//  * Booleans are stored as INTEGER 0/1.
//  * JSON arrays/objects (lob, carriers, connections, business scalars) are
//    stored as TEXT and parsed/stringified here.
//  * `side` is the string 'client' | 'business'.

import type {
	Card,
	CardSide,
	Connections,
	LogEntry,
	Note,
	Occupancy,
	PrimarySide,
	Quest,
	QuestStatus,
	ResidenceType
} from '$lib/core/types';

// ---- Side constant ---------------------------------------------------------

export type Side = 'client' | 'business';
export const SIDE_CLIENT: Side = 'client';
export const SIDE_BUSINESS: Side = 'business';

// ---- Row shapes (what SQL gives us / expects) ------------------------------

export interface CardRow {
	id: string;
	user_id: string;
	primary_side: string;
	name: string;
	address: string;
	mailing_address: string;
	phone: string;
	email: string;
	dob: string;
	license: string;
	residence_type: string;
	user_rating: number;
	relationship_score: number;
	is_coi: number;
	is_bni: number;
	is_standalone: number;
	connections: string; // JSON
	client_meta: string; // JSON: { lob[], carriers[] }
	business_meta: string; // JSON: { businessName, phone, ein, established, occupancy, lob[], carriers[] }
}

export interface QuestRow {
	id: string;
	card_id: string;
	side: string;
	type: string;
	base_exp: number;
	due_date: string | null;
	status: string;
	tracked: number;
	completed_date: string | null;
	completion_type: string | null;
}

export interface QuestNoteRow {
	id: string;
	quest_id: string;
	text: string;
	date: string;
}

export interface CardNoteRow {
	id: string;
	card_id: string;
	side: string;
	text: string;
	date: string;
}

export interface LogRow {
	id: string;
	user_id: string;
	card_id: string | null;
	side: string | null;
	client_name: string;
	quest_type: string;
	exp: number;
	commission: number | null;
	date: string;
	note: string | null;
}

interface SideMeta {
	businessName?: string;
	phone?: string;
	ein?: string;
	established?: string;
	occupancy?: Occupancy;
	lob: string[];
	carriers: string[];
}

// ---- Small helpers ---------------------------------------------------------

const toBool = (n: number | null | undefined): boolean => n === 1;
const fromBool = (b: boolean | undefined): number => (b ? 1 : 0);

function parseJson<T>(text: string | null | undefined, fallback: T): T {
	if (!text) return fallback;
	try {
		return JSON.parse(text) as T;
	} catch {
		return fallback;
	}
}

// ---- Note <-> row ----------------------------------------------------------

export function rowToNote(row: QuestNoteRow | CardNoteRow): Note {
	return { id: row.id, text: row.text, date: row.date };
}

export function noteToQuestNoteRow(questId: string, note: Note): QuestNoteRow {
	return { id: note.id, quest_id: questId, text: note.text, date: note.date };
}

export function noteToCardNoteRow(cardId: string, side: Side, note: Note): CardNoteRow {
	return { id: note.id, card_id: cardId, side, text: note.text, date: note.date };
}

// ---- Log <-> row -----------------------------------------------------------

export function rowToLog(row: LogRow): LogEntry {
	const entry: LogEntry = {
		id: row.id,
		clientName: row.client_name,
		questType: row.quest_type,
		exp: row.exp,
		date: row.date
	};
	if (row.commission !== null && row.commission !== undefined) entry.commission = row.commission;
	if (row.note !== null && row.note !== undefined) entry.note = row.note;
	return entry;
}

export function logToRow(
	userId: string,
	entry: LogEntry,
	cardId: string | null = null,
	side: Side | null = null
): LogRow {
	return {
		id: entry.id,
		user_id: userId,
		card_id: cardId,
		side,
		client_name: entry.clientName,
		quest_type: entry.questType,
		exp: entry.exp,
		commission: entry.commission ?? null,
		date: entry.date,
		note: entry.note ?? null
	};
}

// ---- Quest <-> row ---------------------------------------------------------

export function rowToQuest(row: QuestRow, notes: QuestNoteRow[] = []): Quest {
	const quest: Quest = {
		id: row.id,
		type: row.type,
		baseExp: row.base_exp,
		dueDate: row.due_date,
		status: row.status as QuestStatus,
		tracked: toBool(row.tracked),
		notes: notes.filter((n) => n.quest_id === row.id).map(rowToNote)
	};
	if (row.completed_date !== null && row.completed_date !== undefined)
		quest.completedDate = row.completed_date;
	if (row.completion_type !== null && row.completion_type !== undefined)
		quest.completionType = row.completion_type;
	return quest;
}

export function questToRow(cardId: string, side: Side, quest: Quest): QuestRow {
	return {
		id: quest.id,
		card_id: cardId,
		side,
		type: quest.type,
		base_exp: quest.baseExp,
		due_date: quest.dueDate,
		status: quest.status,
		tracked: fromBool(quest.tracked),
		completed_date: quest.completedDate ?? null,
		completion_type: quest.completionType ?? null
	};
}

// ---- CardSide meta (lob/carriers + business scalars) -----------------------

function buildSide(
	meta: SideMeta,
	notes: Note[],
	logs: LogEntry[],
	quests: Quest[],
	includeBusinessFields: boolean
): CardSide {
	const side: CardSide = {
		notes,
		logs,
		quests,
		lob: meta.lob ?? [],
		carriers: meta.carriers ?? []
	};
	if (includeBusinessFields) {
		side.businessName = meta.businessName ?? '';
		side.phone = meta.phone ?? '';
		side.ein = meta.ein ?? '';
		side.established = meta.established ?? '';
		side.occupancy = (meta.occupancy as Occupancy) ?? 'Own';
	}
	return side;
}

function sideToMeta(side: CardSide, includeBusinessFields: boolean): SideMeta {
	const meta: SideMeta = {
		lob: side.lob ?? [],
		carriers: side.carriers ?? []
	};
	if (includeBusinessFields) {
		meta.businessName = side.businessName ?? '';
		meta.phone = side.phone ?? '';
		meta.ein = side.ein ?? '';
		meta.established = side.established ?? '';
		meta.occupancy = (side.occupancy as Occupancy) ?? 'Own';
	}
	return meta;
}

// ---- Card <-> row ----------------------------------------------------------

/**
 * Assemble a domain Card from its card row plus the related rows. Callers pass
 * the *card-scoped* slices (already filtered to this card_id is fine; this also
 * defensively filters by side / quest_id).
 *
 * side.logs are reconstructed from activity_log rows filtered by side. The
 * global dailyLog (assembled separately in db.ts) is the full set of rows.
 */
export function rowToCard(
	cardRow: CardRow,
	quests: QuestRow[],
	questNotes: QuestNoteRow[],
	cardNotes: CardNoteRow[],
	logs: LogRow[]
): Card {
	const clientMeta = parseJson<SideMeta>(cardRow.client_meta, { lob: [], carriers: [] });
	const businessMeta = parseJson<SideMeta>(cardRow.business_meta, { lob: [], carriers: [] });
	const connections = parseJson<Connections>(cardRow.connections, {
		referredBy: [],
		referrals: [],
		household: []
	});

	const questsForSide = (side: Side): Quest[] =>
		quests.filter((q) => q.card_id === cardRow.id && q.side === side).map((q) => rowToQuest(q, questNotes));
	const notesForSide = (side: Side): Note[] =>
		cardNotes.filter((n) => n.card_id === cardRow.id && n.side === side).map(rowToNote);
	const logsForSide = (side: Side): LogEntry[] =>
		logs.filter((l) => l.card_id === cardRow.id && l.side === side).map(rowToLog);

	const clientSide = buildSide(
		clientMeta,
		notesForSide(SIDE_CLIENT),
		logsForSide(SIDE_CLIENT),
		questsForSide(SIDE_CLIENT),
		false
	);
	const businessSide = buildSide(
		businessMeta,
		notesForSide(SIDE_BUSINESS),
		logsForSide(SIDE_BUSINESS),
		questsForSide(SIDE_BUSINESS),
		true
	);

	return {
		id: cardRow.id,
		primarySide: cardRow.primary_side as PrimarySide,
		name: cardRow.name,
		address: cardRow.address,
		mailingAddress: cardRow.mailing_address,
		phone: cardRow.phone,
		email: cardRow.email,
		dob: cardRow.dob,
		license: cardRow.license,
		residenceType: cardRow.residence_type as ResidenceType,
		userRating: cardRow.user_rating,
		relationshipScore: cardRow.relationship_score,
		isCOI: toBool(cardRow.is_coi),
		isBNI: toBool(cardRow.is_bni),
		isStandalone: toBool(cardRow.is_standalone),
		clientSide,
		businessSide,
		connections
	};
}

/** Convert a Card to its `cards` table row (scalar columns + JSON blobs). */
export function cardToRow(userId: string, card: Card): CardRow {
	return {
		id: card.id,
		user_id: userId,
		primary_side: card.primarySide,
		name: card.name,
		address: card.address,
		mailing_address: card.mailingAddress,
		phone: card.phone,
		email: card.email,
		dob: card.dob,
		license: card.license,
		residence_type: card.residenceType,
		user_rating: card.userRating,
		relationship_score: card.relationshipScore,
		is_coi: fromBool(card.isCOI),
		is_bni: fromBool(card.isBNI),
		is_standalone: fromBool(card.isStandalone),
		connections: JSON.stringify(card.connections),
		client_meta: JSON.stringify(sideToMeta(card.clientSide, false)),
		business_meta: JSON.stringify(sideToMeta(card.businessSide, true))
	};
}

/** Flatten a Card's quests across both sides into quest rows. */
export function cardQuestRows(card: Card): QuestRow[] {
	return [
		...card.clientSide.quests.map((q) => questToRow(card.id, SIDE_CLIENT, q)),
		...card.businessSide.quests.map((q) => questToRow(card.id, SIDE_BUSINESS, q))
	];
}

/** Flatten a Card's quest notes across both sides into quest_note rows. */
export function cardQuestNoteRows(card: Card): QuestNoteRow[] {
	const rows: QuestNoteRow[] = [];
	for (const q of [...card.clientSide.quests, ...card.businessSide.quests]) {
		for (const n of q.notes) rows.push(noteToQuestNoteRow(q.id, n));
	}
	return rows;
}

/** Flatten a Card's per-side notes into card_note rows. */
export function cardNoteRows(card: Card): CardNoteRow[] {
	return [
		...card.clientSide.notes.map((n) => noteToCardNoteRow(card.id, SIDE_CLIENT, n)),
		...card.businessSide.notes.map((n) => noteToCardNoteRow(card.id, SIDE_BUSINESS, n))
	];
}
