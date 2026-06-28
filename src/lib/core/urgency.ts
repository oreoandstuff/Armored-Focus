// Quest urgency / due-date styling (SPEC §4.5). Pure.

import type { Quest } from './types';
import { getDaysOut } from './dates';

export type UrgencyKey = 'cooldown' | 'overdue' | 'now' | 'soon' | 'ok';

/** Tailwind class hints per urgency key (UI may override). */
export const URGENCY_CLASSES: Record<UrgencyKey, string> = {
	cooldown: 'bg-blue-500',
	overdue: 'bg-purple-600',
	now: 'bg-red-500',
	soon: 'bg-yellow-400',
	ok: 'bg-green-500'
};

/**
 * Semantic urgency key for a quest:
 *  - Cooldown status        → 'cooldown' (blue)
 *  - daysOut < 0 (overdue)  → 'overdue'  (purple)
 *  - daysOut <= 1 (today/tomorrow) → 'now' (red)
 *  - daysOut < 4 (soon)     → 'soon'     (yellow)
 *  - otherwise              → 'ok'       (green)
 * (SPEC §4.5)
 */
export function getQuestColorClass(quest: Quest, now: Date = new Date()): UrgencyKey {
	if (quest.status === 'Cooldown') return 'cooldown';
	const daysOut = getDaysOut(quest.dueDate, now);
	if (daysOut < 0) return 'overdue';
	if (daysOut <= 1) return 'now';
	if (daysOut < 4) return 'soon';
	return 'ok';
}

/** Short due badge: 'Cool' for cooldown, 'Now' for ≤1 day, else 'Nd'. (SPEC §4.5) */
export function getDueBadge(quest: Quest, now: Date = new Date()): string {
	if (quest.status === 'Cooldown') return 'Cool';
	const daysOut = getDaysOut(quest.dueDate, now);
	if (daysOut <= 1) return 'Now';
	return `${daysOut}d`;
}
