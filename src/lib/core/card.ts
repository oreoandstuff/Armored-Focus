// Card / side factories producing the SPEC §5 default shapes. Pure; ids are
// injected via `genId`.

import type { Card, CardSide } from './types';

/** A fresh, empty card side. Pass `business: true` for the business-only fields. */
export function newCardSide(business = false): CardSide {
	const base: CardSide = {
		notes: [],
		logs: [],
		quests: [],
		lob: [],
		carriers: []
	};
	if (business) {
		return {
			...base,
			businessName: '',
			phone: '',
			ein: '',
			established: '',
			occupancy: 'Own'
		};
	}
	return base;
}

/**
 * Build a full Card with SPEC §5 defaults, overlaying any provided fields.
 * `partial` overrides win over defaults (shallow merge).
 */
export function newCard(partial: Partial<Card>, genId: () => string): Card {
	const base: Card = {
		id: genId(),
		primarySide: 'Client',
		name: '',
		address: '',
		mailingAddress: '',
		phone: '',
		email: '',
		dob: '',
		license: '',
		residenceType: 'Homeowner',
		userRating: 0,
		relationshipScore: 0,
		isCOI: false,
		isBNI: false,
		clientSide: newCardSide(false),
		businessSide: newCardSide(true),
		connections: { referredBy: [], referrals: [], household: [] }
	};
	return { ...base, ...partial };
}

/**
 * A standalone-task card (SPEC §4.4): not a real client, holds a one-off quest.
 * The note is required and seeded onto the client side.
 */
export function newStandaloneCard(note: string, genId: () => string, now: Date = new Date()): Card {
	const card = newCard(
		{ primarySide: 'Standalone', name: 'Standalone Task', isStandalone: true },
		genId
	);
	if (note) {
		card.clientSide = {
			...card.clientSide,
			notes: [{ id: genId(), text: note, date: now.toISOString() }]
		};
	}
	return card;
}
