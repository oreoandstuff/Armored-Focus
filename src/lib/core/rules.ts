// Seed rules + option lists (SPEC §4, §8). These are the default/initial values
// used to populate a new user's editable rules.

import type { Rules } from './types';

export const initialRules: Rules = {
	general: [
		{ id: 'g1', name: 'New Card Drawn', value: 25 },
		{ id: 'g2', name: 'Exp per Commission Dollar', value: 1 }
	],
	cardQuestTypes: [
		{ id: 'cq1', name: 'Quote New - Initiated by Me', exp: 50 },
		{ id: 'cq2', name: 'Quote New - Initiated by Them', exp: 25 },
		{ id: 'cq3', name: 'Quote Existing', exp: 20 },
		{ id: 'cq4', name: 'General Meeting', exp: 15 },
		{ id: 'cq5', name: 'Productive Meeting', exp: 30 },
		{ id: 'cq6', name: 'Follow-Up', exp: 10 },
		{ id: 'cq7', name: 'Review', exp: 25 },
		{ id: 'cq8', name: 'Letter', exp: 25 },
		{ id: 'cq9', name: 'Service - Payment', exp: 20 },
		{ id: 'cq10', name: 'Service - Change', exp: 20 },
		{ id: 'cq11', name: 'Service - Claim', exp: 20 },
		{ id: 'cq12', name: 'Service - Other', exp: 20 }
	],
	standaloneQuestTypes: [
		{ id: 'sq1', name: 'Plan Day', exp: 15 },
		{ id: 'sq2', name: 'Attend Network', exp: 15 },
		{ id: 'sq3', name: 'BNI', exp: 15 },
		{ id: 'sq4', name: 'Intentional Prospecting', exp: 25 },
		{ id: 'sq5', name: 'Service Agency Client', exp: 15 }
	],
	completionTypes: [
		{ id: 'ct1', name: 'Completed', bonusPercent: 0 },
		{ id: 'ct2', name: 'Won Farmers', bonusPercent: 25 },
		{ id: 'ct3', name: 'Won Farmers Life', bonusPercent: 50 },
		{ id: 'ct4', name: 'Won Farmers Commercial', bonusPercent: 40 },
		{ id: 'ct5', name: 'Won Non-Farmers New Business', bonusPercent: 15 }
	],
	multipliers: [
		{ id: 'm1', name: 'Early', bonusPercent: 15 },
		{ id: 'm2', name: 'On-Time', bonusPercent: 0 },
		{ id: 'm3', name: 'Late', bonusPercent: -15 },
		{ id: 'm4', name: 'COI Card', bonusPercent: 20 },
		{ id: 'm5', name: 'BNI Card', bonusPercent: 25 },
		{ id: 'm6', name: 'Carrier: Farmers', bonusPercent: 20 },
		{ id: 'm7', name: 'Carrier: Foremost/Bristol West', bonusPercent: 15 }
	],
	bonuses: [{ id: 'b1', name: 'Plan Day 5 Days Straight', reward: 100, required: 5 }],
	levels: [
		{ id: 'l1', level: 1, exp: 0, title: 'Novice', reward: 'Starter Pack' },
		{ id: 'l2', level: 2, exp: 500, title: 'Apprentice', reward: 'New Sword' },
		{ id: 'l3', level: 3, exp: 1500, title: 'Journeyman', reward: 'Horse' }
	],
	universalLevelRewards: [
		{ id: 'ur1', name: 'Full Health Restore' },
		{ id: 'ur2', name: '+5 to Relationship Cap' }
	]
};

export const CLIENT_LOB_OPTIONS = [
	'Home', 'Auto', 'Toys', 'Umbrella', 'Life', 'Commercial', 'Health',
	'Supplemental', 'Warranty', 'Electronics', 'Jewelry', 'Pet', 'Other'
];

export const CLIENT_CARRIER_OPTIONS = [
	'Farmers', 'Bristol West', 'Foremost', 'Progressive', 'National General',
	'Kraft Lake', 'Other'
];

export const BUSINESS_LOB_OPTIONS = [
	'GL', 'BoP', 'Farm', 'Comm Auto', 'Workers Comp', 'E&O', 'Inland Marine',
	'Umbrella', 'Cyber', 'Other'
];

export const BUSINESS_CARRIER_OPTIONS = [
	'Farmers', 'Foremost', 'Progressive', 'Tapco', 'Hiscox', 'Next',
	'Liberty Mutual', 'Berkshire Hathaway', 'Kraft Lake Compare', 'Other'
];

export const RESIDENCE_OPTIONS = ['Homeowner', 'Rent', 'Other'] as const;
export const OCCUPANCY_OPTIONS = ['Own', 'Lease', 'Other'] as const;

// Booster CSV column types (SPEC §8).
export const BOOSTER_COLUMN_TYPES = [
	'Ignore', 'Name', 'Phone', 'Address', 'Mailing Address', 'Email',
	'Date of Birth', 'Drivers License #', 'Notes', 'Business Name',
	'Business Phone', 'Business Address', 'Business Email', 'Website', 'EIN',
	'Line of Business'
];

export const SORT_OPTIONS = [
	'Alphabetical', 'Due Date', 'Client Side', 'Business Side', 'CoI', 'BNI',
	'Relationship Score', 'Farmers First', 'Life First', 'Exp Earned',
	'Commission Earned'
];

export const DEFAULT_USER_NAME = 'Drew Leui';
