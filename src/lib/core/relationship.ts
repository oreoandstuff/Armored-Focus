// Relationship score / user rating (SPEC §4.6). Pure / immutable.

import type { Card } from './types';

/** Clamp a score into the 0..100 range. */
export function clampScore(n: number): number {
	return Math.max(0, Math.min(100, n));
}

/**
 * Apply a new user rating (0..5). Each rating point contributes +10 to the
 * relationship score on top of the underlying "base" score. The base is
 * recovered by removing the previous rating's contribution, so re-rating is
 * idempotent rather than cumulative. (SPEC §4.6)
 */
export function applyUserRating(card: Card, newRating: number): Card {
	const baseScore = card.relationshipScore - card.userRating * 10;
	return {
		...card,
		userRating: newRating,
		relationshipScore: clampScore(baseScore + newRating * 10)
	};
}
