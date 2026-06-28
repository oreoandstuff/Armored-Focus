import { describe, it, expect } from 'vitest';
import {
	getDaysOut,
	formatDisplayDate,
	formatDateStandard,
	isToday,
	addDays,
	todayISO,
	tomorrowISO
} from './dates';

const NOW = new Date('2026-06-28T12:00:00Z');

describe('getDaysOut', () => {
	it('returns 0 for today, positive for future, negative for past', () => {
		expect(getDaysOut('2026-06-28', NOW)).toBe(0);
		expect(getDaysOut('2026-06-29', NOW)).toBe(1);
		expect(getDaysOut('2026-07-04', NOW)).toBe(6);
		expect(getDaysOut('2026-06-27', NOW)).toBe(-1);
	});
	it('returns 999 for null', () => {
		expect(getDaysOut(null, NOW)).toBe(999);
	});
	it('is timezone-stable for date-only strings regardless of now time', () => {
		expect(getDaysOut('2026-06-28', new Date('2026-06-28T23:30:00Z'))).toBe(0);
		expect(getDaysOut('2026-06-28', new Date('2026-06-28T00:30:00Z'))).toBe(0);
	});
});

describe('formatDisplayDate', () => {
	it('uses relative wording near term and MM/DD/YYYY otherwise', () => {
		expect(formatDisplayDate('2026-06-28', NOW)).toBe('Today');
		expect(formatDisplayDate('2026-06-29', NOW)).toBe('Tomorrow');
		expect(formatDisplayDate('2026-07-01', NOW)).toBe('Due in 3 Days');
		expect(formatDisplayDate('2026-07-04', NOW)).toBe('Due in 6 Days');
		expect(formatDisplayDate('2026-07-05', NOW)).toBe('07/05/2026');
		expect(formatDisplayDate('2026-06-27', NOW)).toBe('06/27/2026');
	});
	it('returns empty string for null', () => {
		expect(formatDisplayDate(null, NOW)).toBe('');
	});
});

describe('formatDateStandard', () => {
	it('formats strings and Dates as MM/DD/YYYY', () => {
		expect(formatDateStandard('2026-06-28')).toBe('06/28/2026');
		expect(formatDateStandard(NOW)).toBe('06/28/2026');
	});
});

describe('isToday', () => {
	it('matches same UTC day from a full ISO timestamp', () => {
		expect(isToday('2026-06-28T08:00:00Z', NOW)).toBe(true);
		expect(isToday('2026-06-29T08:00:00Z', NOW)).toBe(false);
	});
});

describe('addDays / todayISO / tomorrowISO', () => {
	it('adds days and rolls over months', () => {
		expect(addDays('2026-06-28', 1)).toBe('2026-06-29');
		expect(addDays('2026-06-30', 1)).toBe('2026-07-01');
		expect(addDays('2026-06-28', -1)).toBe('2026-06-27');
	});
	it('derives today/tomorrow from now', () => {
		expect(todayISO(NOW)).toBe('2026-06-28');
		expect(tomorrowISO(NOW)).toBe('2026-06-29');
	});
});
