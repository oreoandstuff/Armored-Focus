// Household auto-matching (SPEC §4.9). Groups cards by identical address and
// records the other members' ids in each card's `connections.household`. Pure.

import type { Card } from './types';

/** Normalised address key; empty for addresses too short to be meaningful. */
function addressKey(card: Card): string {
	const a = (card.address ?? '').trim();
	return a.length > 5 ? a.toLowerCase() : '';
}

/**
 * Return a new card list where every card's `connections.household` lists the
 * ids of the OTHER cards sharing its address. Cards with no shared address get
 * an empty household. (SPEC §4.9)
 */
export function checkHouseholds(cards: Card[]): Card[] {
	const groups = new Map<string, string[]>();
	for (const card of cards) {
		const key = addressKey(card);
		if (!key) continue;
		const ids = groups.get(key) ?? [];
		ids.push(card.id);
		groups.set(key, ids);
	}

	return cards.map((card) => {
		const key = addressKey(card);
		const members = key ? groups.get(key) ?? [] : [];
		const household = members.filter((id) => id !== card.id);
		return { ...card, connections: { ...card.connections, household } };
	});
}
