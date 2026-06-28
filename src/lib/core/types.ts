// Shared domain types for Armored Focus (SPEC §4, §5).
// These are the single source of truth that the functional core, the D1 data
// layer, and the UI all build against.

export type PrimarySide = 'Client' | 'Business' | 'Standalone';
export type SideKey = 'clientSide' | 'businessSide';
export type QuestStatus = 'Active' | 'Cooldown' | 'Completed' | 'Cancelled';
export type ResidenceType = 'Homeowner' | 'Rent' | 'Other';
export type Occupancy = 'Own' | 'Lease' | 'Other';

export interface Note {
	id: string;
	text: string;
	date: string; // ISO
}

export interface LogEntry {
	id: string;
	clientName: string;
	questType: string;
	exp: number;
	date: string; // ISO
	note?: string;
}

export interface Quest {
	id: string;
	type: string;
	baseExp: number;
	dueDate: string | null; // ISO date (yyyy-mm-dd) or null
	status: QuestStatus;
	tracked: boolean;
	notes: Note[];
	completedDate?: string;
	completionType?: string;
}

export interface CardSide {
	notes: Note[];
	logs: LogEntry[];
	quests: Quest[];
	lob: string[];
	carriers: string[];
	// Business-only fields (present/empty on businessSide):
	businessName?: string;
	phone?: string;
	ein?: string;
	established?: string;
	occupancy?: Occupancy;
}

export interface Connections {
	referredBy: string[];
	referrals: string[];
	household: string[];
}

export interface Card {
	id: string;
	primarySide: PrimarySide;
	name: string;
	address: string;
	mailingAddress: string;
	phone: string;
	email: string;
	dob: string;
	license: string;
	residenceType: ResidenceType;
	userRating: number; // 0..5
	relationshipScore: number; // 0..100
	isCOI: boolean;
	isBNI: boolean;
	isStandalone?: boolean;
	clientSide: CardSide;
	businessSide: CardSide;
	connections: Connections;
}

export interface UserStats {
	name: string;
	exp: number;
	level: number;
}

// ---- Rules (editable in the Rules screen) ----

export interface NamedValue {
	id: string;
	name: string;
	value: number;
}
export interface QuestTypeRule {
	id: string;
	name: string;
	exp: number;
}
export interface CompletionTypeRule {
	id: string;
	name: string;
	bonusPercent: number;
}
export interface MultiplierRule {
	id: string;
	name: string;
	bonusPercent: number;
}
export interface BonusRule {
	id: string;
	name: string;
	reward: number; // exp reward
	required: number;
}
export interface LevelRule {
	id: string;
	level: number;
	exp: number; // exp threshold to reach this level
	title: string;
	reward: string;
}
export interface RewardRule {
	id: string;
	name: string;
}

export interface Rules {
	general: NamedValue[];
	cardQuestTypes: QuestTypeRule[];
	standaloneQuestTypes: QuestTypeRule[];
	completionTypes: CompletionTypeRule[];
	multipliers: MultiplierRule[];
	bonuses: BonusRule[];
	levels: LevelRule[];
	universalLevelRewards: RewardRule[];
}

export type RulesKey = keyof Rules;

export type View = 'hub' | 'quests' | 'binder' | 'rules';
