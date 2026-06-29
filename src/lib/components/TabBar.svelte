<script lang="ts">
	// Header tabs — file-folder style, centered, text-only serif (matches the
	// prototype's HEADER TABS exactly). The header background changes per active
	// view. All styling lives in the scoped style block below; state is expressed
	// via Svelte class: directives keyed to the active view.
	import type { View } from '$lib/core/types';

	let { active, onSelect }: { active: View; onSelect?: (v: View) => void } = $props();

	const TABS = ['Hub', 'Quests', 'Binder', 'Rules'] as const;
</script>

<div
	class="tab-bar"
	class:hub={active === 'hub'}
	class:quests={active === 'quests'}
	class:binder={active === 'binder'}
	class:rules={active === 'rules'}
>
	{#each TABS as tab (tab)}
		{@const view = tab.toLowerCase() as View}
		<button
			onclick={() => onSelect?.(view)}
			class="tab"
			class:active={active === view}
			class:hub={view === 'hub'}
			class:quests={view === 'quests'}
			class:binder={view === 'binder'}
			class:rules={view === 'rules'}
		>
			{tab}
		</button>
	{/each}
</div>

<style lang="postcss">
	/* Header bar */
	.tab-bar {
		@apply flex justify-center px-0 pt-2 sticky top-0 z-50 shadow-lg border-b-4 transition-colors duration-500 shrink-0;
	}
	.tab-bar.hub {
		@apply bg-slate-950 border-blue-600;
	}
	.tab-bar.quests {
		@apply bg-[#1f1b17] border-emerald-700;
	}
	.tab-bar.binder {
		@apply bg-[#2c241b] border-pink-800;
	}
	.tab-bar.rules {
		@apply bg-[#2c241b] border-[#daa520];
	}

	/* Tab buttons base — compact on phones, full size from sm up (desktop unchanged). */
	.tab {
		@apply px-3 py-2 text-sm sm:px-8 sm:py-3 sm:text-lg font-serif font-bold transition-all border-t-4 mx-0.5 sm:mx-1 rounded-t-lg border-x border-b-0;
	}

	/* Inactive per-tab colors */
	.tab.hub {
		@apply text-blue-400/60 bg-blue-950/60 border-blue-900/50 mt-1;
	}
	.tab.quests {
		@apply text-emerald-400/60 bg-emerald-950/60 border-emerald-900/50 mt-1;
	}
	.tab.binder {
		@apply text-pink-400/60 bg-[#4c1d95]/60 border-pink-900/50 mt-1;
	}
	.tab.rules {
		@apply text-[#a1887f] bg-[#3e2723]/80 border-[#281915] mt-1;
	}

	/* Active per-tab colors. The original active classes also listed border-2,
	   but the base per-side widths (border-t-4 / border-x / border-b-0) override
	   it on every side, making it a no-op; only the border color is set here. */
	.tab.active.hub {
		@apply text-blue-100 bg-blue-800 border-blue-500 -mb-[4px] pb-1 mt-0 z-20;
		box-shadow: 0 -5px 15px rgba(59, 130, 246, 0.4);
	}
	.tab.active.quests {
		@apply text-emerald-100 bg-emerald-800 border-emerald-500 -mb-[4px] pb-1 mt-0 z-20;
		box-shadow: 0 -5px 15px rgba(16, 185, 129, 0.4);
	}
	.tab.active.binder {
		@apply text-pink-100 bg-pink-800 border-pink-600 -mb-[4px] pb-1 mt-0 z-20;
		box-shadow: 0 -5px 15px rgba(236, 72, 153, 0.4);
	}
	.tab.active.rules {
		@apply text-[#3e2723] bg-[#d7ccc8] border-[#5d4037] -mb-[4px] pb-1 mt-0 rounded-t-xl font-serif italic tracking-wider z-10;
	}
</style>
