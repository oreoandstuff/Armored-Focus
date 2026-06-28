// Quest lifecycle transitions (SPEC §4.4). Every function is pure: it returns
// new quests/sides and never mutates its inputs. Time and id generation are
// injected so tests are deterministic.

import type { Card, CardSide, LogEntry, Note, Quest } from './types';
import { calculateFinalExp } from './exp';
import { todayISO, tomorrowISO } from './dates';
import type { Rules } from './types';

const FAR_FUTURE = '9999-12-31';

/** Quests that occupy a "live" slot on the board (shown as tabs). */
function isLive(q: Quest): boolean {
	return q.status === 'Active' || q.status === 'Cooldown';
}

/** The single tracked live quest of a side, if any. */
export function getTrackedQuest(side: CardSide): Quest | undefined {
	return side.quests.find((q) => q.tracked && isLive(q));
}

/** Active quest count (used for the max-3 rule). */
export function canStartQuest(quests: Quest[]): boolean {
	return quests.filter((q) => q.status === 'Active').length < 3;
}

/** Earliest-due live quest (null dueDate sorts last). */
function earliestLive(quests: Quest[]): Quest | undefined {
	const live = quests.filter(isLive);
	if (live.length === 0) return undefined;
	return [...live].sort((a, b) => (a.dueDate ?? FAR_FUTURE).localeCompare(b.dueDate ?? FAR_FUTURE))[0];
}

/**
 * Ensure exactly one live quest is tracked. If none (or several) are tracked,
 * track the earliest-due live quest. Completed/Cancelled quests are never
 * tracked. Returns a new array. (SPEC §4.4)
 */
export function rebalanceTracking(quests: Quest[]): Quest[] {
	const trackedLive = quests.filter((q) => q.tracked && isLive(q));
	let chosenId: string | undefined;
	if (trackedLive.length === 1) {
		chosenId = trackedLive[0].id;
	} else {
		chosenId = earliestLive(quests)?.id;
	}
	return quests.map((q) => ({ ...q, tracked: isLive(q) && q.id === chosenId }));
}

function makeNote(text: string, genId: () => string, now: Date): Note {
	return { id: genId(), text, date: now.toISOString() };
}

function appendNote(quest: Quest, note: string | undefined, genId: () => string, now: Date): Note[] {
	return note ? [...quest.notes, makeNote(note, genId, now)] : quest.notes;
}

// ---------------------------------------------------------------------------

export interface StartQuestOptions {
	type: string;
	baseExp: number;
	dueDate: string | null;
	note?: string;
	clientName?: string;
	now?: Date;
	genId: () => string;
}

export interface StartQuestResult {
	quests: Quest[];
	log: LogEntry;
}

/** Add a new Active quest to a side's quest array and rebalance tracking. */
export function startQuest(quests: Quest[], opts: StartQuestOptions): StartQuestResult {
	const now = opts.now ?? new Date();
	const newQuest: Quest = {
		id: opts.genId(),
		type: opts.type,
		baseExp: opts.baseExp,
		dueDate: opts.dueDate,
		status: 'Active',
		tracked: false,
		notes: opts.note ? [makeNote(opts.note, opts.genId, now)] : []
	};
	const next = rebalanceTracking([...quests, newQuest]);
	const log: LogEntry = {
		id: opts.genId(),
		clientName: opts.clientName ?? '',
		questType: `Quest Started: ${opts.type}`,
		exp: 0,
		date: now.toISOString(),
		note: opts.note
	};
	return { quests: next, log };
}

// ---------------------------------------------------------------------------

export interface CompleteQuestOptions {
	client: Card;
	completionTypeId: string;
	commission: number;
	note?: string;
	rules: Rules;
	now?: Date;
	genId: () => string;
}

export interface SideTransitionResult {
	side: CardSide;
	expEarned: number;
	log: LogEntry;
}

/**
 * Complete a quest: compute final exp, mark Completed + completedDate +
 * completionType, append the optional note, append the log to the side, and
 * rebalance tracking. The caller awards the exp to user stats and deletes the
 * card if it's a standalone task. (SPEC §4.4)
 */
export function completeQuest(
	side: CardSide,
	quest: Quest,
	opts: CompleteQuestOptions
): SideTransitionResult {
	const now = opts.now ?? new Date();
	const expEarned = calculateFinalExp(
		quest,
		opts.client,
		side,
		opts.rules,
		opts.completionTypeId,
		opts.commission,
		now
	);
	const completionType = opts.rules.completionTypes.find((c) => c.id === opts.completionTypeId)?.name;

	const updated: Quest = {
		...quest,
		status: 'Completed',
		tracked: false,
		completedDate: todayISO(now),
		completionType,
		notes: appendNote(quest, opts.note, opts.genId, now)
	};

	const quests = rebalanceTracking(side.quests.map((q) => (q.id === quest.id ? updated : q)));

	const log: LogEntry = {
		id: opts.genId(),
		clientName: opts.client.name,
		questType: `${quest.type} (Complete)`,
		exp: expEarned,
		commission: opts.commission,
		date: now.toISOString(),
		note: opts.note
	};

	return { side: { ...side, quests, logs: [...side.logs, log] }, expEarned, log };
}

// ---------------------------------------------------------------------------

export interface ContinueQuestOptions {
	client: Card;
	completionTypeId: string;
	commission: number;
	isCooldown: boolean;
	nextType: string;
	nextBaseExp: number;
	nextDueDate: string | null;
	note?: string;
	rules: Rules;
	now?: Date;
	genId: () => string;
}

/**
 * Continue a quest, awarding exp. If `isCooldown`, the quest goes to Cooldown
 * (dueDate = nextDueDate, type suffixed " (Cooldown)"). Otherwise it advances to
 * the next active step (new type/exp/dueDate) and a "Quest progressed to {type}"
 * note is added to the side. (SPEC §4.4)
 */
export function continueQuest(
	side: CardSide,
	quest: Quest,
	opts: ContinueQuestOptions
): SideTransitionResult {
	const now = opts.now ?? new Date();
	const originalType = quest.type;
	const expEarned = calculateFinalExp(
		quest,
		opts.client,
		side,
		opts.rules,
		opts.completionTypeId,
		opts.commission,
		now
	);

	let updated: Quest;
	let sideNotes = side.notes;

	if (opts.isCooldown) {
		updated = {
			...quest,
			status: 'Cooldown',
			dueDate: opts.nextDueDate,
			type: `${quest.type} (Cooldown)`,
			notes: appendNote(quest, opts.note, opts.genId, now)
		};
	} else {
		updated = {
			...quest,
			status: 'Active',
			type: opts.nextType,
			baseExp: opts.nextBaseExp,
			dueDate: opts.nextDueDate,
			notes: appendNote(quest, opts.note, opts.genId, now)
		};
		sideNotes = [...side.notes, makeNote(`Quest progressed to ${opts.nextType}`, opts.genId, now)];
	}

	const quests = rebalanceTracking(side.quests.map((q) => (q.id === quest.id ? updated : q)));

	const log: LogEntry = {
		id: opts.genId(),
		clientName: opts.client.name,
		questType: opts.isCooldown ? `${originalType} (Cooldown)` : `${originalType} (Continued)`,
		exp: expEarned,
		commission: opts.commission,
		date: now.toISOString(),
		note: opts.note
	};

	return {
		side: { ...side, quests, notes: sideNotes, logs: [...side.logs, log] },
		expEarned,
		log
	};
}

// ---------------------------------------------------------------------------

export type CooldownActionType = 'GiveUp' | 'Extend' | 'Continue';

export interface CooldownActionOptions {
	action: CooldownActionType;
	newDate?: string | null;
	nextType?: string;
	nextBaseExp?: number;
	clientName?: string;
	rules: Rules;
	now?: Date;
	genId: () => string;
}

export interface CooldownActionResult {
	side: CardSide;
	log: LogEntry | null;
}

/**
 * Resolve a quest sitting in Cooldown. (SPEC §4.4)
 *  - GiveUp   → status Cancelled, log "Quest Cancelled".
 *  - Extend   → dueDate = newDate || tomorrow (no log).
 *  - Continue → advance to a fresh Active step (default Follow-Up, exp 10),
 *               dueDate = newDate || today, log "Quest Progressed (From Cooldown)".
 */
export function cooldownAction(
	side: CardSide,
	quest: Quest,
	opts: CooldownActionOptions
): CooldownActionResult {
	const now = opts.now ?? new Date();
	let updated: Quest;
	let log: LogEntry | null = null;

	if (opts.action === 'GiveUp') {
		updated = { ...quest, status: 'Cancelled', tracked: false };
		log = {
			id: opts.genId(),
			clientName: opts.clientName ?? '',
			questType: 'Quest Cancelled',
			exp: 0,
			date: now.toISOString()
		};
	} else if (opts.action === 'Extend') {
		updated = { ...quest, dueDate: opts.newDate ?? tomorrowISO(now) };
	} else {
		// Continue
		updated = {
			...quest,
			status: 'Active',
			type: opts.nextType ?? 'Follow-Up',
			baseExp: opts.nextBaseExp ?? 10,
			dueDate: opts.newDate ?? todayISO(now)
		};
		log = {
			id: opts.genId(),
			clientName: opts.clientName ?? '',
			questType: 'Quest Progressed (From Cooldown)',
			exp: 0,
			date: now.toISOString()
		};
	}

	const quests = rebalanceTracking(side.quests.map((q) => (q.id === quest.id ? updated : q)));
	const logs = log ? [...side.logs, log] : side.logs;
	return { side: { ...side, quests, logs }, log };
}
