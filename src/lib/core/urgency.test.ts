import { describe, it, expect } from 'vitest';
import { getQuestColorClass, getDueBadge } from './urgency';
import type { Quest } from './types';

const NOW = new Date('2026-06-28T12:00:00Z');

function quest(dueDate: string | null, status: Quest['status'] = 'Active'): Quest {
	return { id: 'q', type: 'X', baseExp: 10, dueDate, status, tracked: false, notes: [] };
}

describe('getQuestColorClass', () => {
	it('cooldown status wins regardless of date', () => {
		expect(getQuestColorClass(quest('2099-01-01', 'Cooldown'), NOW)).toBe('cooldown');
	});
	it('maps daysOut boundaries', () => {
		expect(getQuestColorClass(quest('2026-06-27'), NOW)).toBe('overdue'); // -1
		expect(getQuestColorClass(quest('2026-06-28'), NOW)).toBe('now'); // 0
		expect(getQuestColorClass(quest('2026-06-29'), NOW)).toBe('now'); // 1
		expect(getQuestColorClass(quest('2026-07-01'), NOW)).toBe('soon'); // 3
		expect(getQuestColorClass(quest('2026-07-02'), NOW)).toBe('ok'); // 4
	});
});

describe('getDueBadge', () => {
	it('returns Cool / Now / Nd', () => {
		expect(getDueBadge(quest('2026-06-28', 'Cooldown'), NOW)).toBe('Cool');
		expect(getDueBadge(quest('2026-06-28'), NOW)).toBe('Now'); // 0
		expect(getDueBadge(quest('2026-06-29'), NOW)).toBe('Now'); // 1
		expect(getDueBadge(quest('2026-07-01'), NOW)).toBe('3d'); // 3
	});
});
