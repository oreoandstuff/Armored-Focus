import { describe, it, expect } from 'vitest';
import { computeLevel, getExpData, awardExp } from './leveling';
import { initialRules } from './rules';
import type { UserStats } from './types';

const levels = initialRules.levels; // 0 / 500 / 1500

describe('computeLevel', () => {
	it('picks the highest threshold ≤ exp', () => {
		expect(computeLevel(0, levels)).toBe(1);
		expect(computeLevel(499, levels)).toBe(1);
		expect(computeLevel(500, levels)).toBe(2);
		expect(computeLevel(1499, levels)).toBe(2);
		expect(computeLevel(1500, levels)).toBe(3);
		expect(computeLevel(9999, levels)).toBe(3);
	});
});

describe('getExpData', () => {
	it('reports progress toward the next threshold', () => {
		const d0 = getExpData({ name: 'X', exp: 0, level: 1 }, levels);
		expect(d0).toMatchObject({ level: 1, title: 'Novice', maxExp: 500, percent: 0, remaining: 500 });

		const d250 = getExpData({ name: 'X', exp: 250, level: 1 }, levels);
		expect(d250.percent).toBe(50);
		expect(d250.remaining).toBe(250);
	});
	it('falls back to maxExp 2000 at the top level', () => {
		const d = getExpData({ name: 'X', exp: 1500, level: 3 }, levels);
		expect(d).toMatchObject({ level: 3, maxExp: 2000, percent: 75, remaining: 500 });
	});
});

describe('awardExp', () => {
	it('levels up when crossing a threshold (fixes SPEC §9 #1)', () => {
		const stats: UserStats = { name: 'Drew', exp: 480, level: 1 };
		const res = awardExp(stats, 30, levels); // 510 → level 2
		expect(res.stats.exp).toBe(510);
		expect(res.stats.level).toBe(2);
		expect(res.leveledUp).toBe(true);
		expect(res.newLevels.map((l) => l.level)).toEqual([2]);
	});
	it('can cross multiple levels at once', () => {
		const res = awardExp({ name: 'Drew', exp: 0, level: 1 }, 1500, levels);
		expect(res.stats.level).toBe(3);
		expect(res.newLevels.map((l) => l.level)).toEqual([2, 3]);
	});
	it('reports no level-up when staying within a band', () => {
		const res = awardExp({ name: 'Drew', exp: 100, level: 1 }, 50, levels);
		expect(res.leveledUp).toBe(false);
		expect(res.newLevels).toEqual([]);
		expect(res.stats.level).toBe(1);
	});
	it('does not mutate the input stats', () => {
		const stats: UserStats = { name: 'Drew', exp: 480, level: 1 };
		awardExp(stats, 30, levels);
		expect(stats.exp).toBe(480);
	});
});
