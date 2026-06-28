import { describe, it, expect } from 'vitest';
import { parseBooster } from './booster';

function counter() {
	let n = 0;
	return () => `id${++n}`;
}
const NOW = new Date('2026-06-28T12:00:00Z');

describe('parseBooster', () => {
	it('parses client rows by column mapping', () => {
		const cards = parseBooster(
			'John Doe,555-0101,123 Maple Dr\nJane Roe,555-0102,456 Oak St',
			['Name', 'Phone', 'Address'],
			counter(),
			NOW
		);
		expect(cards).toHaveLength(2);
		expect(cards[0]).toMatchObject({
			primarySide: 'Client',
			name: 'John Doe',
			phone: '555-0101',
			address: '123 Maple Dr'
		});
		expect(cards[1].name).toBe('Jane Roe');
	});

	it('drops rows with neither Name nor Business Name (and blank lines)', () => {
		const cards = parseBooster(
			'Real Person,555\n,\n\n,999',
			['Name', 'Phone'],
			counter(),
			NOW
		);
		expect(cards).toHaveLength(1);
		expect(cards[0].name).toBe('Real Person');
	});

	it('makes a Business card when Business Name is present', () => {
		const cards = parseBooster(
			'Acme LLC,555-0200,99-1234567',
			['Business Name', 'Business Phone', 'EIN'],
			counter(),
			NOW
		);
		expect(cards[0].primarySide).toBe('Business');
		expect(cards[0].name).toBe('Acme LLC');
		expect(cards[0].businessSide.businessName).toBe('Acme LLC');
		expect(cards[0].businessSide.phone).toBe('555-0200');
		expect(cards[0].businessSide.ein).toBe('99-1234567');
	});

	it('captures Line of Business onto the active side', () => {
		const cards = parseBooster('Pat,Auto', ['Name', 'Line of Business'], counter(), NOW);
		expect(cards[0].clientSide.lob).toContain('Auto');
	});

	it('captures Notes and Website as a side note', () => {
		const cards = parseBooster(
			'Sam,call back,example.com',
			['Name', 'Notes', 'Website'],
			counter(),
			NOW
		);
		const note = cards[0].clientSide.notes[0];
		expect(note.text).toContain('call back');
		expect(note.text).toContain('Website: example.com');
	});
});
