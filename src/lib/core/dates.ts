// Pure date helpers (SPEC §4.8). All functions accept an injectable `now` so
// tests are deterministic and never read the system clock implicitly.
//
// All day arithmetic is done in UTC. Date-only strings (yyyy-mm-dd) are parsed
// by their calendar components, so results do not depend on the machine's local
// timezone (which would otherwise make tests flaky across CI environments).

const MS_PER_DAY = 86_400_000;

/** Whole-day number (days since the Unix epoch) for a Date, using UTC. */
function dayNumberOf(d: Date): number {
	return Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / MS_PER_DAY);
}

/** Whole-day number for a date string (yyyy-mm-dd or full ISO) or Date. */
function dayNumberFor(value: string | Date): number {
	if (value instanceof Date) return dayNumberOf(value);
	const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
	if (m) return Math.floor(Date.UTC(+m[1], +m[2] - 1, +m[3]) / MS_PER_DAY);
	const d = new Date(value);
	return dayNumberOf(d);
}

/** Calendar components (UTC) for a date string or Date. */
function partsFor(value: string | Date): { y: number; m: number; d: number } {
	if (typeof value === 'string') {
		const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
		if (match) return { y: +match[1], m: +match[2], d: +match[3] };
	}
	const dt = value instanceof Date ? value : new Date(value);
	return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** A day number back to a yyyy-mm-dd string. */
function dayNumberToISO(dayNum: number): string {
	const d = new Date(dayNum * MS_PER_DAY);
	return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/**
 * Days from today (midnight) to the due date. Future → positive, today → 0,
 * past → negative. null due date → 999 (treated as "no deadline"). (SPEC §4.8)
 */
export function getDaysOut(dateStr: string | null, now: Date = new Date()): number {
	if (!dateStr) return 999;
	return dayNumberFor(dateStr) - dayNumberOf(now);
}

/**
 * Human-friendly relative date: 0 → "Today", 1 → "Tomorrow", 2–6 → "Due in N
 * Days", everything else (including overdue / far future) → MM/DD/YYYY. (SPEC §4.8)
 */
export function formatDisplayDate(dateStr: string | null, now: Date = new Date()): string {
	if (!dateStr) return '';
	const daysOut = getDaysOut(dateStr, now);
	if (daysOut === 0) return 'Today';
	if (daysOut === 1) return 'Tomorrow';
	if (daysOut >= 2 && daysOut <= 6) return `Due in ${daysOut} Days`;
	return formatDateStandard(dateStr);
}

/** MM/DD/YYYY for a Date or date string (UTC components). (SPEC §4.8) */
export function formatDateStandard(date: Date | string): string {
	const { y, m, d } = partsFor(date);
	return `${pad(m)}/${pad(d)}/${y}`;
}

/** True when the given ISO timestamp/date falls on the same UTC day as `now`. */
export function isToday(iso: string, now: Date = new Date()): boolean {
	if (!iso) return false;
	return dayNumberFor(iso) === dayNumberOf(now);
}

/** Add `n` days to a date (string or Date), returning a yyyy-mm-dd string. */
export function addDays(date: Date | string, n: number): string {
	return dayNumberToISO(dayNumberFor(date) + n);
}

/** Today as yyyy-mm-dd. */
export function todayISO(now: Date = new Date()): string {
	return dayNumberToISO(dayNumberOf(now));
}

/** Tomorrow as yyyy-mm-dd. */
export function tomorrowISO(now: Date = new Date()): string {
	return dayNumberToISO(dayNumberOf(now) + 1);
}
