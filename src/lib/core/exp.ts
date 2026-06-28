// Final-Exp calculation (SPEC §4.3). Pure: all randomness/time is injected.

import type { Card, CardSide, Quest, Rules } from './types';
import { getDaysOut } from './dates';

export interface ExpPart {
	name: string;
	percent: number;
}

export interface ExpBreakdown {
	baseExp: number;
	parts: ExpPart[]; // each percentage multiplier/bonus that was applied
	multiplierPercent: number; // sum of all parts
	commission: number;
	commissionExp: number; // exp contributed by commission
	subtotal: number; // baseExp * (1 + multiplierPercent/100), pre-commission
	total: number; // final, rounded (== calculateFinalExp result)
}

/** Look up a multiplier's bonusPercent by name; 0 if absent. */
function multiplierPercent(rules: Rules, name: string): number {
	const m = rules.multipliers.find((x) => x.name === name);
	return m ? m.bonusPercent : 0;
}

/**
 * Full breakdown of the Final-Exp formula — handy for UI tooltips and for
 * testing each contribution independently. (SPEC §4.3)
 */
export function expBreakdown(
	quest: Quest,
	client: Card,
	sideData: CardSide,
	rules: Rules,
	completionTypeId: string,
	commission: number,
	now: Date = new Date()
): ExpBreakdown {
	const baseExp = quest.baseExp;
	const parts: ExpPart[] = [];
	const add = (name: string, percent: number) => {
		if (percent !== 0) parts.push({ name, percent });
	};

	// Timing multiplier (Early / On-Time / Late) keyed off the due date.
	const daysOut = getDaysOut(quest.dueDate, now);
	if (daysOut > 0) add('Early', multiplierPercent(rules, 'Early'));
	else if (daysOut < 0) add('Late', multiplierPercent(rules, 'Late'));
	else add('On-Time', multiplierPercent(rules, 'On-Time'));

	// Relationship multipliers.
	if (client.isCOI) add('COI Card', multiplierPercent(rules, 'COI Card'));
	if (client.isBNI) add('BNI Card', multiplierPercent(rules, 'BNI Card'));

	// Carrier multiplier: Farmers wins; otherwise Foremost / Bristol West.
	const carriers = sideData.carriers ?? [];
	if (carriers.includes('Farmers')) {
		add('Carrier: Farmers', multiplierPercent(rules, 'Carrier: Farmers'));
	} else if (carriers.some((c) => c.includes('Foremost') || c.includes('Bristol'))) {
		add('Carrier: Foremost/Bristol West', multiplierPercent(rules, 'Carrier: Foremost/Bristol West'));
	}

	// Completion-type bonus (looked up by id).
	const ct = rules.completionTypes.find((c) => c.id === completionTypeId);
	if (ct) add(ct.name, ct.bonusPercent);

	const totalPercent = parts.reduce((sum, p) => sum + p.percent, 0);

	const subtotal = baseExp * (1 + totalPercent / 100);
	const rate = rules.general.find((g) => g.name === 'Exp per Commission Dollar')?.value ?? 1;
	const commissionExp = commission * rate;
	const total = Math.round(subtotal + commissionExp);

	return {
		baseExp,
		parts,
		multiplierPercent: totalPercent,
		commission,
		commissionExp,
		subtotal,
		total
	};
}

/** Final exp for a quest completion/continuation. (SPEC §4.3) */
export function calculateFinalExp(
	quest: Quest,
	client: Card,
	sideData: CardSide,
	rules: Rules,
	completionTypeId: string,
	commission: number,
	now: Date = new Date()
): number {
	return expBreakdown(quest, client, sideData, rules, completionTypeId, commission, now).total;
}
