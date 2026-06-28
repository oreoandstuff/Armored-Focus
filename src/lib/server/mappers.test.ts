import { describe, it, expect } from 'vitest';
import type { Card } from '$lib/core/types';
import {
	cardNoteRows,
	cardQuestNoteRows,
	cardQuestRows,
	cardToRow,
	logToRow,
	noteToCardNoteRow,
	questToRow,
	rowToCard,
	rowToLog,
	rowToNote,
	rowToQuest,
	SIDE_BUSINESS,
	SIDE_CLIENT,
	type LogRow,
	type QuestNoteRow,
	type QuestRow
} from './mappers';

function makeCard(): Card {
	return {
		id: 'card-1',
		primarySide: 'Business',
		name: 'Acme Co',
		address: '123 Main St',
		mailingAddress: 'PO Box 9',
		phone: '5551234567',
		email: 'a@b.com',
		dob: '1990-01-01',
		license: 'D123',
		residenceType: 'Rent',
		userRating: 3,
		relationshipScore: 55,
		isCOI: true,
		isBNI: false,
		isStandalone: false,
		clientSide: {
			notes: [{ id: 'cn1', text: 'client note', date: '2026-01-01' }],
			logs: [],
			quests: [
				{
					id: 'q1',
					type: 'Follow-Up',
					baseExp: 10,
					dueDate: null,
					status: 'Active',
					tracked: true,
					notes: [{ id: 'qn1', text: 'first', date: '2026-01-02' }]
				}
			],
			lob: ['Home', 'Auto'],
			carriers: ['Farmers']
		},
		businessSide: {
			businessName: 'Acme LLC',
			phone: '5559999999',
			ein: '12-3456789',
			established: '2001',
			occupancy: 'Lease',
			notes: [],
			logs: [],
			quests: [
				{
					id: 'q2',
					type: 'Quote Existing',
					baseExp: 20,
					dueDate: '2026-03-01',
					status: 'Completed',
					tracked: false,
					notes: [],
					completedDate: '2026-02-20',
					completionType: 'Won Farmers'
				}
			],
			lob: ['GL'],
			carriers: ['Foremost', 'Hiscox']
		},
		connections: {
			referredBy: ['x'],
			referrals: ['y', 'z'],
			household: []
		}
	};
}

describe('boolean <-> 0/1', () => {
	it('stores booleans as 0/1 and restores them', () => {
		const card = makeCard();
		const row = cardToRow('default', card);
		expect(row.is_coi).toBe(1);
		expect(row.is_bni).toBe(0);
		expect(row.is_standalone).toBe(0);

		const back = rowToCard(row, [], [], [], []);
		expect(back.isCOI).toBe(true);
		expect(back.isBNI).toBe(false);
		expect(back.isStandalone).toBe(false);
	});

	it('round-trips quest.tracked boolean', () => {
		const q = makeCard().clientSide.quests[0];
		const row = questToRow('card-1', SIDE_CLIENT, q);
		expect(row.tracked).toBe(1);
		expect(rowToQuest(row, []).tracked).toBe(true);
	});
});

describe('JSON columns', () => {
	it('stringifies lob/carriers/connections and parses them back', () => {
		const card = makeCard();
		const row = cardToRow('default', card);

		// stored as strings
		expect(typeof row.connections).toBe('string');
		expect(typeof row.client_meta).toBe('string');
		expect(typeof row.business_meta).toBe('string');

		const clientMeta = JSON.parse(row.client_meta);
		expect(clientMeta.lob).toEqual(['Home', 'Auto']);
		expect(clientMeta.carriers).toEqual(['Farmers']);

		const businessMeta = JSON.parse(row.business_meta);
		expect(businessMeta.businessName).toBe('Acme LLC');
		expect(businessMeta.ein).toBe('12-3456789');
		expect(businessMeta.occupancy).toBe('Lease');
		expect(businessMeta.lob).toEqual(['GL']);

		const back = rowToCard(row, [], [], [], []);
		expect(back.connections).toEqual(card.connections);
		expect(back.clientSide.lob).toEqual(['Home', 'Auto']);
		expect(back.businessSide.carriers).toEqual(['Foremost', 'Hiscox']);
	});

	it('tolerates malformed JSON with safe fallbacks', () => {
		const card = makeCard();
		const row = cardToRow('default', card);
		row.client_meta = 'not json';
		row.connections = '{bad';
		const back = rowToCard(row, [], [], [], []);
		expect(back.clientSide.lob).toEqual([]);
		expect(back.connections).toEqual({ referredBy: [], referrals: [], household: [] });
	});
});

describe('null due_date', () => {
	it('preserves null dueDate through the round-trip', () => {
		const q = makeCard().clientSide.quests[0];
		expect(q.dueDate).toBeNull();
		const row = questToRow('card-1', SIDE_CLIENT, q);
		expect(row.due_date).toBeNull();
		expect(rowToQuest(row, []).dueDate).toBeNull();
	});

	it('preserves a real dueDate and completion fields', () => {
		const q = makeCard().businessSide.quests[0];
		const row = questToRow('card-1', SIDE_BUSINESS, q);
		expect(row.due_date).toBe('2026-03-01');
		expect(row.completed_date).toBe('2026-02-20');
		expect(row.completion_type).toBe('Won Farmers');
		const back = rowToQuest(row, []);
		expect(back.dueDate).toBe('2026-03-01');
		expect(back.completedDate).toBe('2026-02-20');
		expect(back.completionType).toBe('Won Farmers');
	});

	it('omits completion fields when absent', () => {
		const q = makeCard().clientSide.quests[0];
		const row = questToRow('card-1', SIDE_CLIENT, q);
		expect(row.completed_date).toBeNull();
		const back = rowToQuest(row, []);
		expect(back).not.toHaveProperty('completedDate');
		expect(back).not.toHaveProperty('completionType');
	});
});

describe('full Card round-trip via flattened rows', () => {
	it('reassembles a two-sided card with quests, notes and logs', () => {
		const card = makeCard();
		const userId = 'default';

		const cardRow = cardToRow(userId, card);
		const questRows: QuestRow[] = cardQuestRows(card);
		const questNoteRows: QuestNoteRow[] = cardQuestNoteRows(card);
		const noteRows = cardNoteRows(card);

		// simulate per-side activity_log rows
		const logRows: LogRow[] = [
			logToRow(
				userId,
				{ id: 'l1', clientName: 'Acme Co', questType: 'Follow-Up', exp: 12, date: '2026-01-03' },
				card.id,
				SIDE_CLIENT
			),
			logToRow(
				userId,
				{
					id: 'l2',
					clientName: 'Acme LLC',
					questType: 'Quote Existing',
					exp: 40,
					commission: 100,
					note: 'won',
					date: '2026-02-20'
				},
				card.id,
				SIDE_BUSINESS
			)
		];

		const back = rowToCard(cardRow, questRows, questNoteRows, noteRows, logRows);

		// scalar identity
		expect(back.id).toBe(card.id);
		expect(back.name).toBe(card.name);
		expect(back.primarySide).toBe('Business');
		expect(back.userRating).toBe(3);
		expect(back.relationshipScore).toBe(55);

		// quests routed to the correct side
		expect(back.clientSide.quests).toHaveLength(1);
		expect(back.clientSide.quests[0].id).toBe('q1');
		expect(back.clientSide.quests[0].notes).toEqual([
			{ id: 'qn1', text: 'first', date: '2026-01-02' }
		]);
		expect(back.businessSide.quests).toHaveLength(1);
		expect(back.businessSide.quests[0].id).toBe('q2');
		expect(back.businessSide.quests[0].completionType).toBe('Won Farmers');

		// per-side notes
		expect(back.clientSide.notes).toEqual([{ id: 'cn1', text: 'client note', date: '2026-01-01' }]);
		expect(back.businessSide.notes).toEqual([]);

		// per-side logs reconstructed from activity_log by side
		expect(back.clientSide.logs.map((l) => l.id)).toEqual(['l1']);
		expect(back.businessSide.logs.map((l) => l.id)).toEqual(['l2']);
		expect(back.businessSide.logs[0].commission).toBe(100);
		expect(back.businessSide.logs[0].note).toBe('won');

		// business scalar fields
		expect(back.businessSide.businessName).toBe('Acme LLC');
		expect(back.businessSide.occupancy).toBe('Lease');
		// client side has no business-only fields
		expect(back.clientSide.businessName).toBeUndefined();
	});
});

describe('log mapper', () => {
	it('round-trips a LogEntry, omitting optional fields when absent', () => {
		const row = logToRow('default', {
			id: 'l9',
			clientName: 'Bob',
			questType: 'Review',
			exp: 25,
			date: '2026-06-01'
		});
		expect(row.commission).toBeNull();
		expect(row.note).toBeNull();
		const back = rowToLog(row);
		expect(back).not.toHaveProperty('commission');
		expect(back).not.toHaveProperty('note');
		expect(back.clientName).toBe('Bob');
	});
});

describe('note mapper', () => {
	it('maps a note row to a Note', () => {
		const row = noteToCardNoteRow('card-1', SIDE_CLIENT, {
			id: 'n1',
			text: 'hi',
			date: '2026-01-01'
		});
		expect(row.side).toBe('client');
		expect(rowToNote(row)).toEqual({ id: 'n1', text: 'hi', date: '2026-01-01' });
	});
});
