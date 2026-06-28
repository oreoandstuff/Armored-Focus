import { describe, it, expect } from 'vitest';
import { searchCards, sortCards, sumLogExp, sumLogCommission } from './sorting';
import { newCard } from './card';
import type { Card, LogEntry } from './types';

function counter() {
	let n = 0;
	return () => `id${++n}`;
}
const genId = counter();

function card(partial: Partial<Card>): Card {
	return newCard(partial, genId);
}

function log(exp: number, commission: number): LogEntry {
	return { id: genId(), clientName: '', questType: 't', exp, commission, date: '2026-06-28' };
}

describe('searchCards', () => {
	const cards = [
		card({ name: 'Alice Adams', phone: '555-1111', address: '1 Maple Dr' }),
		card({ name: 'Bob Brown', phone: '555-2222', address: '2 Oak St' })
	];

	it('returns all cards for an empty/whitespace query', () => {
		expect(searchCards(cards, '')).toHaveLength(2);
		expect(searchCards(cards, '   ')).toHaveLength(2);
	});

	it('matches by name, phone, and address (case-insensitive)', () => {
		expect(searchCards(cards, 'alice')).toEqual([cards[0]]);
		expect(searchCards(cards, '2222')).toEqual([cards[1]]);
		expect(searchCards(cards, 'maple')).toEqual([cards[0]]);
	});

	it('matches business name', () => {
		const biz = card({ name: 'X', primarySide: 'Business' });
		biz.businessSide.businessName = 'Acme Co';
		expect(searchCards([biz], 'acme')).toEqual([biz]);
	});
});

describe('sortCards', () => {
	it('sorts alphabetically by default', () => {
		const list = [card({ name: 'Zed' }), card({ name: 'Amy' })];
		expect(sortCards(list, 'Alphabetical').map((c) => c.name)).toEqual(['Amy', 'Zed']);
	});

	it('Exp Earned and Commission Earned produce DIFFERENT orders (SPEC §9 #10)', () => {
		const a = card({ name: 'A' });
		a.clientSide.logs = [log(100, 0)]; // high exp, no commission
		const b = card({ name: 'B' });
		b.clientSide.logs = [log(10, 500)]; // low exp, high commission

		expect(sumLogExp(a)).toBe(100);
		expect(sumLogCommission(b)).toBe(500);

		expect(sortCards([a, b], 'Exp Earned').map((c) => c.name)).toEqual(['A', 'B']);
		expect(sortCards([a, b], 'Commission Earned').map((c) => c.name)).toEqual(['B', 'A']);
	});

	it('Relationship Score sorts descending', () => {
		const lo = card({ name: 'Lo', relationshipScore: 20 });
		const hi = card({ name: 'Hi', relationshipScore: 90 });
		expect(sortCards([lo, hi], 'Relationship Score').map((c) => c.name)).toEqual(['Hi', 'Lo']);
	});

	it('CoI groups flagged cards first', () => {
		const plain = card({ name: 'Plain', isCOI: false });
		const coi = card({ name: 'Coi', isCOI: true });
		expect(sortCards([plain, coi], 'CoI').map((c) => c.name)).toEqual(['Coi', 'Plain']);
	});
});
