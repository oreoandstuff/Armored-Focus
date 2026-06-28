import { describe, it, expect } from 'vitest';
import { newCard, newCardSide, newStandaloneCard } from './card';

let n = 0;
const genId = () => `id${++n}`;
const NOW = new Date('2026-06-28T12:00:00Z');

describe('newCardSide', () => {
	it('returns empty arrays and business fields only when requested', () => {
		const client = newCardSide(false);
		expect(client).toMatchObject({ notes: [], logs: [], quests: [], lob: [], carriers: [] });
		expect(client.businessName).toBeUndefined();

		const biz = newCardSide(true);
		expect(biz.occupancy).toBe('Own');
		expect(biz.businessName).toBe('');
	});
});

describe('newCard', () => {
	it('produces SPEC §5 defaults', () => {
		const c = newCard({}, genId);
		expect(c).toMatchObject({
			primarySide: 'Client',
			residenceType: 'Homeowner',
			userRating: 0,
			relationshipScore: 0,
			isCOI: false,
			isBNI: false
		});
		expect(c.connections).toEqual({ referredBy: [], referrals: [], household: [] });
		expect(c.id).toBeTruthy();
	});
	it('applies overrides', () => {
		const c = newCard({ name: 'Alice', isCOI: true }, genId);
		expect(c.name).toBe('Alice');
		expect(c.isCOI).toBe(true);
	});
});

describe('newStandaloneCard', () => {
	it('flags standalone and seeds the required note', () => {
		const c = newStandaloneCard('Plan my day', genId, NOW);
		expect(c.isStandalone).toBe(true);
		expect(c.primarySide).toBe('Standalone');
		expect(c.name).toBe('Standalone Task');
		expect(c.clientSide.notes[0].text).toBe('Plan my day');
		expect(c.clientSide.notes[0].date).toBe(NOW.toISOString());
	});
});
