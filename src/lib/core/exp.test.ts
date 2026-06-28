import { describe, it, expect } from 'vitest';
import { calculateFinalExp, expBreakdown } from './exp';
import { newCard } from './card';
import { initialRules } from './rules';
import type { Quest } from './types';

const NOW = new Date('2026-06-28T12:00:00Z');
let n = 0;
const genId = () => `id${++n}`;

function quest(dueDate: string | null, baseExp = 50): Quest {
	return {
		id: 'q1',
		type: 'Quote New - Initiated by Me',
		baseExp,
		dueDate,
		status: 'Active',
		tracked: true,
		notes: []
	};
}

describe('calculateFinalExp', () => {
	it('worked example: Early + COI + Farmers + Won Farmers + commission', () => {
		// base 50; Early +15, COI +20, Farmers +20, Won Farmers +25 = +80% → 90;
		// + commission 100 * 1 = 100 → 190
		const card = newCard({ isCOI: true }, genId);
		card.clientSide.carriers = ['Farmers'];
		const result = calculateFinalExp(quest('2026-07-01'), card, card.clientSide, initialRules, 'ct2', 100, NOW);
		expect(result).toBe(190);
	});

	it('On-Time (0%) with no flags equals baseExp', () => {
		const card = newCard({}, genId);
		expect(calculateFinalExp(quest('2026-06-28'), card, card.clientSide, initialRules, 'ct1', 0, NOW)).toBe(50);
	});

	it('Late applies -15%', () => {
		const card = newCard({}, genId);
		// 50 * 0.85 = 42.5 → round 43
		expect(calculateFinalExp(quest('2026-06-25'), card, card.clientSide, initialRules, 'ct1', 0, NOW)).toBe(43);
	});

	it('falls back to Foremost/Bristol West when no Farmers', () => {
		const card = newCard({}, genId);
		card.clientSide.carriers = ['Bristol West', 'Progressive'];
		// On-Time, +15% carrier → 50 * 1.15. In IEEE-754, 50 * 1.15 = 57.4999…,
		// so Math.round → 57 (matches the original prototype's float behavior).
		expect(calculateFinalExp(quest('2026-06-28'), card, card.clientSide, initialRules, 'ct1', 0, NOW)).toBe(57);
	});

	it('BNI adds +25%', () => {
		const card = newCard({ isBNI: true }, genId);
		// On-Time + BNI 25% → 50 * 1.25 = 62.5 → 63
		expect(calculateFinalExp(quest('2026-06-28'), card, card.clientSide, initialRules, 'ct1', 0, NOW)).toBe(63);
	});
});

describe('expBreakdown', () => {
	it('lists each applied multiplier and the commission contribution', () => {
		const card = newCard({ isCOI: true }, genId);
		card.clientSide.carriers = ['Farmers'];
		const b = expBreakdown(quest('2026-07-01'), card, card.clientSide, initialRules, 'ct2', 100, NOW);
		expect(b.multiplierPercent).toBe(80);
		expect(b.parts.map((p) => p.name)).toEqual(['Early', 'COI Card', 'Carrier: Farmers', 'Won Farmers']);
		expect(b.subtotal).toBe(90);
		expect(b.commissionExp).toBe(100);
		expect(b.total).toBe(190);
	});
});
