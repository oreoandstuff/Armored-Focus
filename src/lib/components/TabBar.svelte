<script lang="ts">
	// Header tabs — file-folder style, centered, text-only serif (matches the
	// prototype's HEADER TABS exactly). The header background changes per active
	// view.
	import type { View } from '$lib/core/types';

	let { active, onSelect }: { active: View; onSelect?: (v: View) => void } = $props();

	const TABS = ['Hub', 'Quests', 'Binder', 'Rules'] as const;

	const headerBg = $derived(
		active === 'hub'
			? 'bg-slate-950 border-blue-600'
			: active === 'quests'
				? 'bg-[#1f1b17] border-emerald-700'
				: active === 'binder'
					? 'bg-[#2c241b] border-pink-800'
					: 'bg-[#2c241b] border-[#daa520]'
	);

	function tabStyle(tab: string): string {
		const isActive = active === tab.toLowerCase();
		if (isActive) {
			switch (tab) {
				case 'Hub':
					return 'text-blue-100 bg-blue-800 border-2 border-blue-500 border-b-0 -mb-[4px] pb-1 rounded-t-lg shadow-[0_-5px_15px_rgba(59,130,246,0.4)] z-20';
				case 'Quests':
					return 'text-emerald-100 bg-emerald-800 border-2 border-emerald-500 border-b-0 -mb-[4px] pb-1 rounded-t-lg shadow-[0_-5px_15px_rgba(16,185,129,0.4)] z-20';
				case 'Binder':
					return 'text-pink-100 bg-pink-800 border-2 border-pink-600 border-b-0 -mb-[4px] pb-1 rounded-t-lg shadow-[0_-5px_15px_rgba(236,72,153,0.4)] z-20';
				default: // Rules
					return 'text-[#3e2723] bg-[#d7ccc8] border-[#5d4037] -mt-2 rounded-t-xl font-serif italic tracking-wider border-x-4 border-t-4 z-10';
			}
		}
		switch (tab) {
			case 'Hub':
				return 'text-blue-400/60 bg-blue-950/60 border-blue-900/50 mt-1';
			case 'Quests':
				return 'text-emerald-400/60 bg-emerald-950/60 border-emerald-900/50 mt-1';
			case 'Binder':
				return 'text-pink-400/60 bg-[#4c1d95]/60 border-pink-900/50 mt-1';
			default: // Rules
				return 'text-[#a1887f] bg-[#3e2723]/80 border-[#281915] mt-1';
		}
	}
</script>

<div
	class="flex justify-center px-0 pt-2 sticky top-0 z-50 shadow-lg border-b-4 transition-colors duration-500 shrink-0 {headerBg}"
>
	{#each TABS as tab (tab)}
		<button
			onclick={() => onSelect?.(tab.toLowerCase() as View)}
			class="px-8 py-3 font-serif font-bold text-lg transition-all border-t-4 mx-1 rounded-t-lg border-x border-b-0 {tabStyle(tab)}"
		>
			{tab}
		</button>
	{/each}
</div>
