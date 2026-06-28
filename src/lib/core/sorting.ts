// Binder search + sort (SPEC §4.10). Fixes the prototype's broken search
// (§9 #3/#4) and the identical Exp/Commission sorts (§9 #10). Pure.

import type { Card, CardSide, Quest } from './types';

const FAR_FUTURE = '2099-12-31';

/** The single tracked live quest of a side, if any. */
export function getTrackedQuest(side: CardSide): Quest | undefined {
	return side.quests.find((q) => q.tracked && (q.status === 'Active' || q.status === 'Cooldown'));
}

/** Total exp recorded across both sides' activity logs. */
export function sumLogExp(card: Card): number {
	const sides = [card.clientSide, card.businessSide];
	return sides.reduce((sum, s) => sum + s.logs.reduce((a, l) => a + (l.exp ?? 0), 0), 0);
}

/** Total commission recorded across both sides' activity logs (distinct from exp). */
export function sumLogCommission(card: Card): number {
	const sides = [card.clientSide, card.businessSide];
	return sides.reduce((sum, s) => sum + s.logs.reduce((a, l) => a + (l.commission ?? 0), 0), 0);
}

/**
 * Filter cards by a free-text query against name, phone, and address
 * (case-insensitive). Business name and business phone are also matched so
 * business cards are findable. Empty/whitespace query → all cards. (SPEC §4.10)
 */
export function searchCards(cards: Card[], query: string): Card[] {
	const q = (query ?? '').trim().toLowerCase();
	if (!q) return cards;
	return cards.filter((c) => {
		const haystack = [
			c.name,
			c.phone,
			c.address,
			c.businessSide.businessName ?? '',
			c.businessSide.phone ?? ''
		]
			.join(' ')
			.toLowerCase();
		return haystack.includes(q);
	});
}

/** Earliest tracked-quest due date across both sides (fallback far future). */
function dueDateKey(card: Card): string {
	const dates = [card.clientSide, card.businessSide]
		.map((s) => getTrackedQuest(s)?.dueDate)
		.filter((d): d is string => !!d);
	if (dates.length === 0) return FAR_FUTURE;
	return dates.sort((a, b) => a.localeCompare(b))[0];
}

const byName = (a: Card, b: Card) => a.name.localeCompare(b.name);

/** true-first grouping with alphabetical tiebreak. */
function flagSort(flag: (c: Card) => boolean) {
	return (a: Card, b: Card) => {
		const fa = flag(a) ? 0 : 1;
		const fb = flag(b) ? 0 : 1;
		return fa !== fb ? fa - fb : byName(a, b);
	};
}

/** numeric-desc with alphabetical tiebreak. */
function numDescSort(value: (c: Card) => number) {
	return (a: Card, b: Card) => {
		const d = value(b) - value(a);
		return d !== 0 ? d : byName(a, b);
	};
}

function hasFarmers(card: Card): boolean {
	return [card.clientSide, card.businessSide].some((s) => s.carriers.includes('Farmers'));
}

function hasLife(card: Card): boolean {
	return [card.clientSide, card.businessSide].some((s) => s.lob.includes('Life'));
}

/** Sort a copy of `cards` by the chosen option. (SPEC §4.10) */
export function sortCards(cards: Card[], sortOption: string): Card[] {
	const list = [...cards];
	switch (sortOption) {
		case 'Due Date':
			return list.sort((a, b) => {
				const d = dueDateKey(a).localeCompare(dueDateKey(b));
				return d !== 0 ? d : byName(a, b);
			});
		case 'Client Side':
			return list.sort(flagSort((c) => c.primarySide === 'Client'));
		case 'Business Side':
			return list.sort(flagSort((c) => c.primarySide === 'Business'));
		case 'CoI':
			return list.sort(flagSort((c) => c.isCOI));
		case 'BNI':
			return list.sort(flagSort((c) => c.isBNI));
		case 'Relationship Score':
			return list.sort(numDescSort((c) => c.relationshipScore));
		case 'Farmers First':
			return list.sort(flagSort(hasFarmers));
		case 'Life First':
			return list.sort(flagSort(hasLife));
		case 'Exp Earned':
			return list.sort(numDescSort(sumLogExp));
		case 'Commission Earned':
			return list.sort(numDescSort(sumLogCommission));
		case 'Alphabetical':
		default:
			return list.sort(byName);
	}
}
