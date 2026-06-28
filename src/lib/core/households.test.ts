import { describe, it, expect } from 'vitest';
import { checkHouseholds } from './households';
import { newCard } from './card';

let n = 0;
const genId = () => `id${++n}`;

describe('checkHouseholds', () => {
	it('links cards that share a meaningful address', () => {
		const a = newCard({ id: 'a', address: '123 Main Street' }, genId);
		const b = newCard({ id: 'b', address: '123 Main Street' }, genId);
		const c = newCard({ id: 'c', address: '999 Other Ave' }, genId);
		const [ra, rb, rc] = checkHouseholds([a, b, c]);
		expect(ra.connections.household).toEqual(['b']);
		expect(rb.connections.household).toEqual(['a']);
		expect(rc.connections.household).toEqual([]);
	});
	it('ignores short / empty addresses', () => {
		const a = newCard({ id: 'a', address: 'NY' }, genId);
		const b = newCard({ id: 'b', address: 'NY' }, genId);
		const [ra, rb] = checkHouseholds([a, b]);
		expect(ra.connections.household).toEqual([]);
		expect(rb.connections.household).toEqual([]);
	});
	it('does not mutate inputs', () => {
		const a = newCard({ id: 'a', address: '123 Main Street' }, genId);
		const b = newCard({ id: 'b', address: '123 Main Street' }, genId);
		checkHouseholds([a, b]);
		expect(a.connections.household).toEqual([]);
	});
});
