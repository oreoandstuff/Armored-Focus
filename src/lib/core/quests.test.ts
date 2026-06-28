import { describe, it, expect } from 'vitest';
import {
	rebalanceTracking,
	canStartQuest,
	startQuest,
	completeQuest,
	continueQuest,
	cooldownAction,
	getTrackedQuest
} from './quests';
import { newCard } from './card';
import { initialRules } from './rules';
import type { Quest, CardSide } from './types';

const NOW = new Date('2026-06-28T12:00:00Z');

/** Deterministic id generator for stable assertions. */
function counter() {
	let n = 0;
	return () => `id${++n}`;
}

function quest(partial: Partial<Quest> = {}): Quest {
	return {
		id: partial.id ?? 'q1',
		type: partial.type ?? 'Quote New - Initiated by Me',
		baseExp: partial.baseExp ?? 50,
		dueDate: partial.dueDate ?? '2026-06-28',
		status: partial.status ?? 'Active',
		tracked: partial.tracked ?? false,
		notes: partial.notes ?? [],
		completedDate: partial.completedDate,
		completionType: partial.completionType
	};
}

describe('rebalanceTracking', () => {
	it('tracks the earliest-due live quest when none is tracked', () => {
		const quests = [
			quest({ id: 'a', dueDate: '2026-07-10' }),
			quest({ id: 'b', dueDate: '2026-06-30' }),
			quest({ id: 'c', dueDate: '2026-08-01' })
		];
		const result = rebalanceTracking(quests);
		expect(result.find((q) => q.tracked)?.id).toBe('b');
		expect(result.filter((q) => q.tracked)).toHaveLength(1);
	});

	it('never tracks a completed/cancelled quest', () => {
		const quests = [
			quest({ id: 'a', status: 'Completed', tracked: true }),
			quest({ id: 'b', status: 'Active', dueDate: '2026-07-01' })
		];
		const result = rebalanceTracking(quests);
		expect(result.find((q) => q.tracked)?.id).toBe('b');
	});

	it('keeps a single existing tracked live quest', () => {
		const quests = [
			quest({ id: 'a', dueDate: '2026-07-10', tracked: true }),
			quest({ id: 'b', dueDate: '2026-06-30' })
		];
		expect(rebalanceTracking(quests).find((q) => q.tracked)?.id).toBe('a');
	});
});

describe('canStartQuest', () => {
	it('is false once 3 quests are active', () => {
		const three = [quest({ id: 'a' }), quest({ id: 'b' }), quest({ id: 'c' })];
		expect(canStartQuest(three)).toBe(false);
		expect(canStartQuest(three.slice(0, 2))).toBe(true);
	});
});

describe('startQuest', () => {
	it('adds an Active tracked quest and a zero-exp log', () => {
		const { quests, log } = startQuest([], {
			type: 'Follow-Up',
			baseExp: 10,
			dueDate: '2026-07-01',
			clientName: 'Bob',
			note: 'first call',
			now: NOW,
			genId: counter()
		});
		expect(quests).toHaveLength(1);
		expect(quests[0].status).toBe('Active');
		expect(quests[0].tracked).toBe(true);
		expect(quests[0].notes).toHaveLength(1);
		expect(log.questType).toBe('Quest Started: Follow-Up');
		expect(log.exp).toBe(0);
	});
});

function sideWith(q: Quest): CardSide {
	return { notes: [], logs: [], quests: [q], lob: [], carriers: [] };
}

describe('completeQuest', () => {
	it('marks Completed, sets completedDate, awards exp, logs it', () => {
		const q = quest({ tracked: true });
		const card = newCard({ name: 'Carol' }, counter());
		const { side, expEarned, log } = completeQuest(sideWith(q), q, {
			client: card,
			completionTypeId: 'ct1', // Completed, +0%
			commission: 0,
			rules: initialRules,
			now: NOW,
			genId: counter()
		});
		const done = side.quests[0];
		expect(done.status).toBe('Completed');
		expect(done.completedDate).toBe('2026-06-28');
		expect(done.tracked).toBe(false);
		// baseExp 50, On-Time (due today), no bonuses → 50
		expect(expEarned).toBe(50);
		expect(log.questType).toBe('Quote New - Initiated by Me (Complete)');
		expect(log.exp).toBe(50);
		expect(side.logs).toHaveLength(1);
	});

	it('adds commission to exp and records it on the log', () => {
		const q = quest();
		const card = newCard({ name: 'Dan' }, counter());
		const { expEarned, log } = completeQuest(sideWith(q), q, {
			client: card,
			completionTypeId: 'ct1',
			commission: 100,
			rules: initialRules,
			now: NOW,
			genId: counter()
		});
		expect(expEarned).toBe(150); // 50 + 100 * 1 Exp/$
		expect(log.commission).toBe(100);
	});
});

describe('continueQuest', () => {
	it('advances to the next active step and notes the progression', () => {
		const q = quest({ tracked: true });
		const card = newCard({ name: 'Erin' }, counter());
		const { side } = continueQuest(sideWith(q), q, {
			client: card,
			completionTypeId: 'ct1',
			commission: 0,
			isCooldown: false,
			nextType: 'Follow-Up',
			nextBaseExp: 10,
			nextDueDate: '2026-07-05',
			rules: initialRules,
			now: NOW,
			genId: counter()
		});
		expect(side.quests[0].status).toBe('Active');
		expect(side.quests[0].type).toBe('Follow-Up');
		expect(side.notes.some((n) => n.text === 'Quest progressed to Follow-Up')).toBe(true);
	});

	it('puts the quest into Cooldown when isCooldown', () => {
		const q = quest({ tracked: true });
		const card = newCard({ name: 'Finn' }, counter());
		const { side } = continueQuest(sideWith(q), q, {
			client: card,
			completionTypeId: 'ct1',
			commission: 0,
			isCooldown: true,
			nextType: '',
			nextBaseExp: 0,
			nextDueDate: '2026-07-05',
			rules: initialRules,
			now: NOW,
			genId: counter()
		});
		expect(side.quests[0].status).toBe('Cooldown');
		expect(side.quests[0].type).toContain('(Cooldown)');
		expect(side.quests[0].dueDate).toBe('2026-07-05');
	});
});

describe('cooldownAction', () => {
	const base = () => quest({ status: 'Cooldown', tracked: true });

	it('GiveUp cancels and logs', () => {
		const q = base();
		const { side, log } = cooldownAction(sideWith(q), q, {
			action: 'GiveUp',
			clientName: 'Gwen',
			rules: initialRules,
			now: NOW,
			genId: counter()
		});
		expect(side.quests[0].status).toBe('Cancelled');
		expect(log?.questType).toBe('Quest Cancelled');
	});

	it('Extend pushes the due date and writes no log', () => {
		const q = base();
		const { side, log } = cooldownAction(sideWith(q), q, {
			action: 'Extend',
			newDate: '2026-07-09',
			rules: initialRules,
			now: NOW,
			genId: counter()
		});
		expect(side.quests[0].dueDate).toBe('2026-07-09');
		expect(side.quests[0].status).toBe('Cooldown');
		expect(log).toBeNull();
	});

	it('Continue reactivates with the default Follow-Up step', () => {
		const q = base();
		const { side, log } = cooldownAction(sideWith(q), q, {
			action: 'Continue',
			rules: initialRules,
			now: NOW,
			genId: counter()
		});
		expect(side.quests[0].status).toBe('Active');
		expect(side.quests[0].type).toBe('Follow-Up');
		expect(side.quests[0].baseExp).toBe(10);
		expect(log?.questType).toBe('Quest Progressed (From Cooldown)');
		expect(getTrackedQuest(side)?.id).toBe(q.id);
	});
});
