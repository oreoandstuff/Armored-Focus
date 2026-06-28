import { describe, it, expect } from 'vitest';
import { clampScore, applyUserRating } from './relationship';
import { newCard } from './card';

let n = 0;
const genId = () => `id${++n}`;

describe('clampScore', () => {
	it('clamps to 0..100', () => {
		expect(clampScore(-5)).toBe(0);
		expect(clampScore(50)).toBe(50);
		expect(clampScore(150)).toBe(100);
	});
});

describe('applyUserRating', () => {
	it('each rating point adds +10 to the base score', () => {
		const card = newCard({}, genId); // score 0, rating 0
		const rated = applyUserRating(card, 3);
		expect(rated.userRating).toBe(3);
		expect(rated.relationshipScore).toBe(30);
	});
	it('re-rating replaces the prior contribution (idempotent, not cumulative)', () => {
		const card = newCard({}, genId);
		const first = applyUserRating(card, 3); // 30
		const second = applyUserRating(first, 5); // base 0 + 50 = 50, not 80
		expect(second.relationshipScore).toBe(50);
	});
	it('clamps when base + rating exceeds 100', () => {
		const card = newCard({ relationshipScore: 60, userRating: 0 }, genId);
		const rated = applyUserRating(card, 5); // 60 + 50 = 110 → 100
		expect(rated.relationshipScore).toBe(100);
	});
	it('does not mutate input', () => {
		const card = newCard({}, genId);
		applyUserRating(card, 4);
		expect(card.relationshipScore).toBe(0);
		expect(card.userRating).toBe(0);
	});
});
