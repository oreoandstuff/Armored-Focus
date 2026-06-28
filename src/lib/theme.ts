// Theme tokens for Armored Focus (SPEC §7).
// Plain constants so views/components can apply the prototype's look 1:1.
// These mirror the values in tailwind.config.js where applicable, but are
// exported here as JS objects so layout code can build per-tab styling.

import type { Card } from '$lib/core/types';

// Metallic font + shadow (SPEC §7).
export const METALLIC_FONT = 'font-serif font-bold tracking-wide';
export const METALLIC_SHADOW =
	'shadow-[0_4px_4px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.5)]';

// ---- Parchment / global theme (also the Rules screen) ----
export const THEME = {
	bg: '#e8e4d9',
	panel: '#fdfbf7',
	border: '#d4c5a9',
	headerBg: '#2c241b',
	headerText: '#eebb4d',
	accent: '#8b4513',
	goldBorder: '#daa520',
	silver: '#a9a9a9',
	inputBg: '#fffef8',
	text: '#2c241b'
} as const;

// ---- Hub theme (retro blue "file-select") ----
export const HUB_THEME = {
	root: 'bg-slate-950',
	bg: 'bg-gradient-to-b from-blue-800 to-slate-900',
	panel: 'bg-blue-900/80 border-blue-400/40 backdrop-blur',
	border: 'border-blue-400/40',
	text: 'text-blue-50',
	accent: 'text-cyan-300',
	// Exp/level bar fill: blue→cyan→blue with cyan glow.
	bar: 'bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-300',
	barGlow: 'shadow-[0_0_12px_rgba(34,211,238,0.7)]'
} as const;

// ---- Quests theme (fantasy map / emerald) ----
export const QUEST_THEME = {
	bg: 'bg-gradient-to-br from-emerald-900 via-[#5d534a] to-[#3e3730]',
	tray: 'bg-emerald-900/80 border-emerald-700/50',
	border: 'border-emerald-700/50',
	text: 'text-emerald-50',
	accent: 'text-emerald-300'
} as const;

// ---- Binder theme (pink→purple) ----
export const BINDER_THEME = {
	bg: 'bg-gradient-to-br from-pink-900 to-purple-950',
	page: '#fdf4f8',
	spine: '#4c1d95',
	ring: '#a9a9a9',
	accent: '#e9d5ff',
	text: 'text-purple-50'
} as const;

// Per-tab active glow styling (SPEC §7 "Tab glows").
export const TAB_THEME = {
	hub: { glow: 'shadow-[0_0_12px_rgba(59,130,246,0.7)]', text: 'text-blue-200', active: 'bg-blue-600' },
	quests: {
		glow: 'shadow-[0_0_12px_rgba(16,185,129,0.7)]',
		text: 'text-emerald-200',
		active: 'bg-emerald-600'
	},
	binder: { glow: 'shadow-[0_0_12px_rgba(236,72,153,0.7)]', text: 'text-pink-200', active: 'bg-pink-600' },
	rules: {
		glow: 'shadow-[0_0_12px_rgba(215,204,200,0.7)]',
		text: 'text-[#5d4037] italic font-serif',
		active: 'bg-[#d7ccc8]'
	}
} as const;

// ---- RPGButton variants (SPEC §7 button gradients) ----
// `gradient` is an inline linear-gradient (top→bottom 3-stop) since Tailwind
// utilities can't express the exact prototype hex stops; `text` is a hex color.
export const BUTTON_VARIANTS = {
	primary: {
		gradient: 'linear-gradient(to bottom, #5c4033, #2c241b, #1a1008)',
		text: '#f5deb3'
	},
	action: {
		gradient: 'linear-gradient(to bottom, #4ade80, #2e8b57, #14532d)',
		text: '#ffffff'
	},
	danger: {
		gradient: 'linear-gradient(to bottom, #ef4444, #8b0000, #450a0a)',
		text: '#ffffff'
	},
	gold: {
		gradient: 'linear-gradient(to bottom, #faeebf, #daa520, #b8860b)',
		text: '#2c241b'
	}
} as const;

export type ButtonVariant = keyof typeof BUTTON_VARIANTS;

// ---- Card type colors (SPEC §7 "Card type colors") ----
// A card "has policies" if its primary side's lob array is non-empty.
export function getCardColors(card: Card): { bg: string; border: string } {
	let bg: string;
	let border: string;

	if (card.primarySide === 'Standalone' || card.isStandalone) {
		// Standalone → purple
		bg = 'bg-gradient-to-br from-purple-100 to-purple-200';
		border = 'border-purple-600';
	} else if (card.primarySide === 'Business') {
		const hasPolicies = (card.businessSide?.lob?.length ?? 0) > 0;
		if (hasPolicies) {
			bg = 'bg-gradient-to-br from-blue-100 to-blue-200';
			border = 'border-blue-600';
		} else {
			// Business prospect → orange/amber
			bg = 'bg-gradient-to-br from-orange-100 to-orange-200';
			border = 'border-orange-700';
		}
	} else {
		// Client
		const hasPolicies = (card.clientSide?.lob?.length ?? 0) > 0;
		if (hasPolicies) {
			bg = 'bg-gradient-to-br from-emerald-100 to-emerald-200';
			border = 'border-emerald-600';
		} else {
			// Client prospect → stone
			bg = 'bg-gradient-to-br from-stone-200 to-stone-300';
			border = 'border-stone-500';
		}
	}

	// COI / BNI override the border (BNI takes visual precedence if both set).
	if (card.isBNI) {
		border = 'border-4 border-yellow-500';
	} else if (card.isCOI) {
		border = 'border-4 border-slate-700';
	}

	return { bg, border };
}
