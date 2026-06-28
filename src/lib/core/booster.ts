// Booster Pack (CSV) import (SPEC §8). Handles every mapped column type so no
// data is silently dropped (fixes §9 #12). Pure; ids injected via `genId`.

import type { Card } from './types';
import { newCard } from './card';

/**
 * Parse pasted CSV text into Cards using a per-column type mapping.
 *
 * @param rawText  newline-separated rows, comma-separated fields
 * @param columns  type for each column index (e.g. 'Name', 'Phone', 'Ignore')
 * @param genId    id generator
 * @param now      injectable clock for note timestamps
 *
 * Rows with no Name AND no Business Name are dropped. A Business Name makes the
 * card primarySide 'Business'. (SPEC §8)
 */
export function parseBooster(
	rawText: string,
	columns: string[],
	genId: () => string,
	now: Date = new Date()
): Card[] {
	const cards: Card[] = [];
	const lines = rawText.split('\n');

	for (const rawLine of lines) {
		const line = rawLine.replace(/\r$/, '');
		if (line.trim() === '') continue;

		const fields = line.split(',').map((f) => f.trim());
		const rec: Record<string, string> = {};
		columns.forEach((type, i) => {
			if (!type || type === 'Ignore') return;
			const value = fields[i] ?? '';
			// First non-empty value wins if a type is mapped to multiple columns.
			if (value && !rec[type]) rec[type] = value;
		});

		const name = rec['Name'] ?? '';
		const businessName = rec['Business Name'] ?? '';
		if (!name && !businessName) continue; // drop empty rows

		const isBusiness = !!businessName;
		const partial: Partial<Card> = {
			primarySide: isBusiness ? 'Business' : 'Client',
			name: name || businessName,
			phone: rec['Phone'] ?? '',
			address: (isBusiness ? rec['Business Address'] : rec['Address']) || rec['Address'] || '',
			mailingAddress: rec['Mailing Address'] ?? '',
			email: (isBusiness ? rec['Business Email'] : rec['Email']) || rec['Email'] || '',
			dob: rec['Date of Birth'] ?? '',
			license: rec['Drivers License #'] ?? ''
		};

		const card = newCard(partial, genId);

		// Business-only fields.
		if (isBusiness || rec['Business Phone'] || rec['EIN']) {
			card.businessSide = {
				...card.businessSide,
				businessName,
				phone: rec['Business Phone'] ?? card.businessSide.phone ?? '',
				ein: rec['EIN'] ?? card.businessSide.ein ?? ''
			};
		}

		// Line of Business → lob on the active side.
		const lob = rec['Line of Business'];
		if (lob) {
			const side = isBusiness ? card.businessSide : card.clientSide;
			side.lob = [...side.lob, lob];
		}

		// Notes + Website (no dedicated Website field → captured as a note).
		const noteParts: string[] = [];
		if (rec['Notes']) noteParts.push(rec['Notes']);
		if (rec['Website']) noteParts.push(`Website: ${rec['Website']}`);
		if (noteParts.length > 0) {
			const side = isBusiness ? card.businessSide : card.clientSide;
			side.notes = [
				...side.notes,
				{ id: genId(), text: noteParts.join(' | '), date: now.toISOString() }
			];
		}

		cards.push(card);
	}

	return cards;
}
