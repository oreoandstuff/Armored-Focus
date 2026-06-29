// Client-side application store (the imperative shell on the browser side).
// Holds all app state with Svelte 5 runes, mutates it via the pure functional
// core, and persists every change to D1 through /api/persist.
//
// Views and components should call these action methods rather than mutating
// state directly, so persistence stays consistent.

import type { Card, LogEntry, Rules, RulesKey, UserStats, View, SideKey } from './core/types';
import { generateId } from './core/id';
import { newCard, newStandaloneCard } from './core/card';
import { initialRules, DEFAULT_USER_NAME } from './core/rules';
import { awardExp } from './core/leveling';
import {
	startQuest as coreStartQuest,
	completeQuest as coreCompleteQuest,
	continueQuest as coreContinueQuest,
	cooldownAction as coreCooldownAction,
	rebalanceTracking,
	type CooldownActionType
} from './core/quests';
import { applyUserRating } from './core/relationship';
import { parseBooster } from './core/booster';
import { checkHouseholds } from './core/households';

type PersistKind =
	| 'saveCard'
	| 'deleteCard'
	| 'saveStats'
	| 'appendLog'
	| 'saveRules'
	| 'setBonus';

/** Fire-and-forget persistence to the D1-backed API. */
async function persist(kind: PersistKind, data: unknown): Promise<void> {
	try {
		await fetch('/api/persist', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ kind, data })
		});
	} catch (err) {
		console.error('persist failed', kind, err);
	}
}

export interface InitData {
	userStats: UserStats;
	cards: Card[];
	rules: Rules;
	dailyLog: LogEntry[];
	bonusProgress: Record<string, number>;
}

export interface ModalState {
	drawCard: boolean;
	startQuest: boolean;
	levelTable: boolean;
	boosterPack: boolean;
	questResult: boolean;
	mergeCard: boolean;
}

const NO_MODALS: ModalState = {
	drawCard: false,
	startQuest: false,
	levelTable: false,
	boosterPack: false,
	questResult: false,
	mergeCard: false
};

class AppStore {
	// Safe defaults so any render before init() can't crash on undefined rule
	// arrays. init() replaces these with the server-loaded state.
	userStats = $state<UserStats>({ name: DEFAULT_USER_NAME, exp: 0, level: 1 });
	cards = $state<Card[]>([]);
	rules = $state<Rules>(structuredClone(initialRules));
	dailyLog = $state<LogEntry[]>([]);
	bonusProgress = $state<Record<string, number>>({});

	// UI-only state
	view = $state<View>('hub');
	modals = $state<ModalState>({ ...NO_MODALS });
	expandedCardId = $state<string | null>(null);
	search = $state('');
	sort = $state('Alphabetical');

	// Context for the currently-open quest flow (set when opening a modal).
	flowCardId = $state<string | null>(null);
	flowSide = $state<SideKey>('clientSide');
	flowQuestId = $state<string | null>(null);
	flowStandalone = $state(false);
	flowAction = $state<'Complete' | 'Continue'>('Complete');

	private initialized = false;

	/** Seed the store from server load data (idempotent on the client). */
	init(data: InitData) {
		if (this.initialized) return;
		this.userStats = data.userStats;
		this.cards = data.cards;
		this.rules = data.rules;
		this.dailyLog = data.dailyLog;
		this.bonusProgress = data.bonusProgress;
		this.initialized = true;
	}

	// ---- navigation / modals ----
	setView(v: View) {
		this.view = v;
	}
	openModal(name: keyof ModalState) {
		this.modals = { ...NO_MODALS, [name]: true };
	}
	closeModals() {
		this.modals = { ...NO_MODALS };
	}
	toggleCard(id: string) {
		this.expandedCardId = this.expandedCardId === id ? null : id;
	}

	// ---- flow openers (set context, then open the relevant modal) ----
	/** Open the Start Quest modal for a card side. */
	openStartQuest(cardId: string, side: SideKey) {
		this.flowCardId = cardId;
		this.flowSide = side;
		this.flowStandalone = false;
		this.openModal('startQuest');
	}
	/** Open the Start Quest modal in standalone-task mode. */
	openStandaloneQuest() {
		this.flowStandalone = true;
		this.openModal('startQuest');
	}
	/** Open the Quest Result modal to Complete or Continue a quest. */
	openQuestResult(cardId: string, side: SideKey, questId: string, action: 'Complete' | 'Continue') {
		this.flowCardId = cardId;
		this.flowSide = side;
		this.flowQuestId = questId;
		this.flowAction = action;
		this.openModal('questResult');
	}
	/** Open the Merge modal with `cardId` as the merge target. */
	openMerge(cardId: string) {
		this.flowCardId = cardId;
		this.openModal('mergeCard');
	}

	// ---- helpers ----
	private findCard(id: string): Card | undefined {
		return this.cards.find((c) => c.id === id);
	}
	private replaceCard(card: Card) {
		this.cards = this.cards.map((c) => (c.id === card.id ? card : c));
		void persist('saveCard', card);
	}
	private addLog(entry: LogEntry, cardId?: string, side?: SideKey) {
		this.dailyLog = [entry, ...this.dailyLog];
		void persist('appendLog', { entry, cardId, side });
	}
	private awardExp(amount: number) {
		const { stats } = awardExp(this.userStats, amount, this.rules.levels);
		this.userStats = stats;
		void persist('saveStats', stats);
	}
	private generalValue(name: string): number {
		return this.rules.general.find((g) => g.name === name)?.value ?? 0;
	}

	// ---- user ----
	renameUser(name: string) {
		this.userStats = { ...this.userStats, name };
		void persist('saveStats', this.userStats);
	}

	// ---- cards ----
	/** Create a client/business card from the Draw Card modal; awards "New Card Drawn" exp. */
	drawCard(partial: Partial<Card>) {
		const card = newCard(partial, generateId);
		this.cards = checkHouseholds([...this.cards, card]);
		this.cards.forEach((c) => persist('saveCard', c));

		const exp = this.generalValue('New Card Drawn');
		if (exp > 0) {
			this.addLog(
				{ id: generateId(), clientName: card.name, questType: 'New Card Drawn', exp, date: new Date().toISOString() },
				card.id,
				'clientSide'
			);
			this.awardExp(exp);
		}
		this.closeModals();
	}

	/** Persist edits made in the expanded ClientCard. */
	saveCard(card: Card) {
		this.replaceCard(card);
	}

	deleteCard(id: string) {
		this.cards = this.cards.filter((c) => c.id !== id);
		if (this.expandedCardId === id) this.expandedCardId = null;
		void persist('deleteCard', { id });
	}

	setPrimary(cardId: string, side: 'Client' | 'Business') {
		const card = this.findCard(cardId);
		if (!card) return;
		this.replaceCard({ ...card, primarySide: side });
	}

	applyRating(cardId: string, rating: number) {
		const card = this.findCard(cardId);
		if (!card) return;
		this.replaceCard(applyUserRating(card, rating));
	}

	/** Merge `sourceId` into `targetId`, combining sides, then delete the source. */
	mergeCards(targetId: string, sourceId: string) {
		const target = this.findCard(targetId);
		const source = this.findCard(sourceId);
		if (!target || !source || target.id === source.id) return;
		const merged: Card = {
			...target,
			clientSide: {
				...target.clientSide,
				notes: [...target.clientSide.notes, ...source.clientSide.notes],
				quests: rebalanceTracking([...target.clientSide.quests, ...source.clientSide.quests]),
				logs: [...target.clientSide.logs, ...source.clientSide.logs],
				lob: [...new Set([...target.clientSide.lob, ...source.clientSide.lob])],
				carriers: [...new Set([...target.clientSide.carriers, ...source.clientSide.carriers])]
			},
			businessSide: {
				...target.businessSide,
				notes: [...target.businessSide.notes, ...source.businessSide.notes],
				quests: rebalanceTracking([...target.businessSide.quests, ...source.businessSide.quests]),
				logs: [...target.businessSide.logs, ...source.businessSide.logs],
				lob: [...new Set([...target.businessSide.lob, ...source.businessSide.lob])],
				carriers: [...new Set([...target.businessSide.carriers, ...source.businessSide.carriers])]
			}
		};
		this.cards = checkHouseholds(this.cards.filter((c) => c.id !== source.id).map((c) => (c.id === merged.id ? merged : c)));
		void persist('deleteCard', { id: source.id });
		void persist('saveCard', merged);
		this.closeModals();
	}

	// ---- quests ----
	private sideOf(card: Card, side: SideKey) {
		return side === 'businessSide' ? card.businessSide : card.clientSide;
	}
	private withSide(card: Card, side: SideKey, value: Card['clientSide']): Card {
		return side === 'businessSide' ? { ...card, businessSide: value } : { ...card, clientSide: value };
	}

	startQuest(cardId: string, side: SideKey, opts: { type: string; baseExp: number; dueDate: string | null; note?: string }) {
		const card = this.findCard(cardId);
		if (!card) return;
		const s = this.sideOf(card, side);
		const { quests, log } = coreStartQuest(s.quests, { ...opts, clientName: card.name, genId: generateId });
		const updated = this.withSide(card, side, { ...s, quests });
		this.replaceCard(updated);
		this.addLog(log, cardId, side);
		this.closeModals();
	}

	/** Create a standalone-task card with one quest. */
	createStandaloneQuest(opts: { type: string; baseExp: number; dueDate: string | null; note: string }) {
		const card = newStandaloneCard(opts.note, generateId);
		const { quests, log } = coreStartQuest(card.clientSide.quests, {
			type: opts.type,
			baseExp: opts.baseExp,
			dueDate: opts.dueDate,
			note: opts.note,
			clientName: card.name,
			genId: generateId
		});
		card.clientSide = { ...card.clientSide, quests };
		this.cards = [...this.cards, card];
		void persist('saveCard', card);
		this.addLog(log, card.id, 'clientSide');
		this.closeModals();
	}

	trackQuest(cardId: string, side: SideKey, questId: string) {
		const card = this.findCard(cardId);
		if (!card) return;
		const s = this.sideOf(card, side);
		const quests = rebalanceTracking(s.quests.map((q) => ({ ...q, tracked: q.id === questId })));
		this.replaceCard(this.withSide(card, side, { ...s, quests }));
	}

	completeQuest(cardId: string, side: SideKey, questId: string, opts: { completionTypeId: string; commission: number; note?: string }) {
		const card = this.findCard(cardId);
		if (!card) return;
		const s = this.sideOf(card, side);
		const quest = s.quests.find((q) => q.id === questId);
		if (!quest) return;
		const result = coreCompleteQuest(s, quest, {
			client: card,
			completionTypeId: opts.completionTypeId,
			commission: opts.commission,
			note: opts.note,
			rules: this.rules,
			genId: generateId
		});
		this.addLog(result.log, cardId, side);
		this.awardExp(result.expEarned);
		this.maybeAdvanceBonus(quest.type);

		if (card.isStandalone) {
			this.deleteCard(card.id);
		} else {
			this.replaceCard(this.withSide(card, side, result.side));
		}
		this.closeModals();
	}

	continueQuest(
		cardId: string,
		side: SideKey,
		questId: string,
		opts: { completionTypeId: string; commission: number; isCooldown: boolean; nextType: string; nextBaseExp: number; nextDueDate: string | null; note?: string }
	) {
		const card = this.findCard(cardId);
		if (!card) return;
		const s = this.sideOf(card, side);
		const quest = s.quests.find((q) => q.id === questId);
		if (!quest) return;
		const result = coreContinueQuest(s, quest, { client: card, rules: this.rules, genId: generateId, ...opts });
		this.addLog(result.log, cardId, side);
		this.awardExp(result.expEarned);
		this.replaceCard(this.withSide(card, side, result.side));
		this.closeModals();
	}

	cooldownAction(cardId: string, side: SideKey, questId: string, action: CooldownActionType, opts: { newDate?: string | null; nextType?: string; nextBaseExp?: number } = {}) {
		const card = this.findCard(cardId);
		if (!card) return;
		const s = this.sideOf(card, side);
		const quest = s.quests.find((q) => q.id === questId);
		if (!quest) return;
		const result = coreCooldownAction(s, quest, { action, clientName: card.name, rules: this.rules, genId: generateId, ...opts });
		if (result.log) this.addLog(result.log, cardId, side);

		// Giving up a standalone task removes the card entirely.
		if (action === 'GiveUp' && card.isStandalone) {
			this.deleteCard(card.id);
		} else {
			this.replaceCard(this.withSide(card, side, result.side));
		}
	}

	/** Fix for the prototype's dead active-quest Cancel button (SPEC §9 #6). */
	cancelQuest(cardId: string, side: SideKey, questId: string) {
		const card = this.findCard(cardId);
		if (!card) return;
		const s = this.sideOf(card, side);
		const quests = rebalanceTracking(s.quests.map((q) => (q.id === questId ? { ...q, status: 'Cancelled' as const, tracked: false } : q)));
		this.addLog({ id: generateId(), clientName: card.name, questType: 'Quest Cancelled', exp: 0, date: new Date().toISOString() }, cardId, side);
		if (card.isStandalone) this.deleteCard(card.id);
		else this.replaceCard(this.withSide(card, side, { ...s, quests }));
	}

	// ---- booster import ----
	importBooster(rawText: string, columns: string[]) {
		const imported = parseBooster(rawText, columns, generateId);
		if (imported.length === 0) {
			this.closeModals();
			return;
		}
		this.cards = checkHouseholds([...this.cards, ...imported]);
		this.cards.forEach((c) => persist('saveCard', c));
		this.closeModals();
	}

	// ---- bonus board (SPEC §9 #8: make it actually work) ----
	private maybeAdvanceBonus(questType: string) {
		// The seed bonus tracks "Plan Day" standalone completions.
		const bonus = this.rules.bonuses.find((b) => b.name.toLowerCase().includes('plan day'));
		if (!bonus || !questType.toLowerCase().startsWith('plan day')) return;
		const current = (this.bonusProgress[bonus.id] ?? 0) + 1;
		if (current >= bonus.required) {
			this.bonusProgress = { ...this.bonusProgress, [bonus.id]: 0 };
			void persist('setBonus', { bonusId: bonus.id, current: 0 });
			this.awardExp(bonus.reward);
			this.addLog({ id: generateId(), clientName: '', questType: `Bonus: ${bonus.name}`, exp: bonus.reward, date: new Date().toISOString() });
		} else {
			this.bonusProgress = { ...this.bonusProgress, [bonus.id]: current };
			void persist('setBonus', { bonusId: bonus.id, current });
		}
	}

	// ---- rules editor ----
	private saveRules() {
		void persist('saveRules', this.rules);
	}
	addRule(key: RulesKey) {
		const list = this.rules[key] as unknown as Array<Record<string, unknown>>;
		const blank: Record<string, unknown> = { id: generateId(), name: 'New' };
		// Default the numeric field present on this rule family.
		const sample = list[0] ?? {};
		for (const f of ['value', 'exp', 'bonusPercent', 'reward', 'required']) {
			if (f in sample) blank[f] = 0;
		}
		if ('level' in sample) blank.level = (list.length ?? 0) + 1;
		this.rules = { ...this.rules, [key]: [...list, blank] };
		this.saveRules();
	}
	updateRule(key: RulesKey, id: string, field: string, value: string | number) {
		const list = this.rules[key] as unknown as Array<Record<string, unknown>>;
		this.rules = { ...this.rules, [key]: list.map((r) => (r.id === id ? { ...r, [field]: value } : r)) };
		this.saveRules();
	}
	deleteRule(key: RulesKey, id: string) {
		const list = this.rules[key] as unknown as Array<Record<string, unknown>>;
		this.rules = { ...this.rules, [key]: list.filter((r) => r.id !== id) };
		this.saveRules();
	}
}

export const app = new AppStore();
