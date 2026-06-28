// Leveling / XP progression (SPEC §4.1). Implements the real level-up that the
// prototype was missing (SPEC §9 #1). Pure.

import type { LevelRule, UserStats } from './types';

const FALLBACK_MAX_EXP = 2000;

/** Levels sorted ascending by their exp threshold. */
function sortedByExp(levels: LevelRule[]): LevelRule[] {
	return [...levels].sort((a, b) => a.exp - b.exp);
}

/** Highest level whose exp threshold is ≤ the given exp. (SPEC §4.1) */
export function computeLevel(exp: number, levels: LevelRule[]): number {
	const eligible = sortedByExp(levels).filter((l) => l.exp <= exp);
	if (eligible.length === 0) {
		// Below every threshold — fall back to the lowest defined level (or 1).
		const lowest = sortedByExp(levels)[0];
		return lowest ? lowest.level : 1;
	}
	return eligible[eligible.length - 1].level;
}

export interface ExpData {
	level: number;
	title: string;
	currentExp: number; // total accumulated exp
	maxExp: number; // exp threshold of the next level (fallback 2000)
	percent: number; // clamp(currentExp / maxExp * 100, 0..100)
	remaining: number; // max(0, maxExp - currentExp)
}

/** Display data for the Hub exp bar. (SPEC §4.1) */
export function getExpData(stats: UserStats, levels: LevelRule[]): ExpData {
	const level = computeLevel(stats.exp, levels);
	const current = levels.find((l) => l.level === level);
	const next = levels.find((l) => l.level === level + 1);

	const currentExp = stats.exp;
	const maxExp = next ? next.exp : FALLBACK_MAX_EXP;
	const percent = Math.max(0, Math.min(100, (currentExp / maxExp) * 100));
	const remaining = Math.max(0, maxExp - currentExp);

	return {
		level,
		title: current ? current.title : '',
		currentExp,
		maxExp,
		percent,
		remaining
	};
}

export interface AwardResult {
	stats: UserStats;
	leveledUp: boolean;
	newLevels: LevelRule[]; // level rules newly reached, in ascending order
}

/**
 * Add exp and recompute level, reporting any level-ups. The fix for SPEC §9 #1
 * (prototype accrued exp but never incremented the level). Pure / immutable.
 */
export function awardExp(stats: UserStats, amount: number, levels: LevelRule[]): AwardResult {
	const oldLevel = computeLevel(stats.exp, levels);
	const newExp = stats.exp + amount;
	const newLevel = computeLevel(newExp, levels);

	const newLevels = sortedByExp(levels).filter((l) => l.level > oldLevel && l.level <= newLevel);

	return {
		stats: { ...stats, exp: newExp, level: newLevel },
		leveledUp: newLevel > oldLevel,
		newLevels
	};
}
