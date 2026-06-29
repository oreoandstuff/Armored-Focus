<script lang="ts">
	// Quests screen (SPEC §2.2). Fantasy-map / emerald theme (QUEST_THEME).
	// Full-bleed two-column layout matching the React prototype's `view === 'quests'`
	// block: an absolute 1/4 left sidebar (search + 3 action buttons + scroll log)
	// over a 3/4 right quest tray. The shell renders this view in a padding-less
	// `h-full w-full` container, so this component owns the full-bleed split.
	import { app } from '$lib/state.svelte';
	import { searchCards } from '$lib/core/sorting';
	import ScrollLog from '$lib/components/ScrollLog.svelte';
	import ClientCard from '$lib/components/ClientCard.svelte';
	import { Search, Coins, Map } from '@lucide/svelte';

	// Cards that have at least one live quest (Active/Cooldown) on either side.
	const liveCards = $derived(
		app.cards.filter((c) =>
			[c.clientSide, c.businessSide].some((s) =>
				s.quests.some((q) => q.status === 'Active' || q.status === 'Cooldown')
			)
		)
	);

	// Further filtered by the sidebar search box (SPEC §9 #4: make it functional).
	const shown = $derived(searchCards(liveCards, app.search));
</script>

<!-- QUEST SCREEN -->
<div class="quests-screen">
	<div class="sidebar">
		<div class="search">
			<Search class="search-icon" size={18} />
			<input class="search-input" placeholder="Search Quests..." bind:value={app.search} />
		</div>

		<!-- BUTTONS -->
		<button onclick={() => app.setView('binder')} class="action-btn emerald">
			<div class="badge emerald">
				<Coins size={18} />
			</div>Start Card Quest
		</button>
		<button onclick={() => app.openStandaloneQuest()} class="action-btn purple">
			<div class="badge purple">S</div>Start Standalone Quest
		</button>
		<button onclick={() => app.openModal('drawCard')} class="action-btn blue">
			<div class="badge blue">
				<Map size={18} />
			</div> Explore for Quests
		</button>

		<!-- Scroll Activity Log (Today's Scroll) -->
		<ScrollLog dailyLog={app.dailyLog} allLog={app.dailyLog} />
	</div>
	<div class="tray">
		<div class="tray-inner">
			<div class="quest-list">
				{#each shown as card (card.id)}
					<ClientCard {card} />
				{/each}
			</div>
			{#if shown.length === 0}
				<div class="empty">
					<Map size={64} class="empty-icon" />
					<h3 class="empty-title">No Active Quests</h3>
					<p>The realm is quiet... for now.</p>
				</div>
			{/if}
		</div>
	</div>
</div>

<style lang="postcss">
	.quests-screen {
		@apply relative h-full w-full;
	}

	/* Left sidebar wrapper — geometry recently tuned, preserved exactly. */
	.sidebar {
		@apply absolute left-0 top-0 w-1/4 h-full z-10 px-4 pt-8 pb-6 flex flex-col gap-6;
	}

	/* Search box */
	.search {
		@apply relative;
	}
	.search :global(.search-icon) {
		@apply absolute left-3 top-1/2 -translate-y-1/2 text-emerald-900;
	}
	.search-input {
		@apply w-full pl-10 pr-4 py-3 border-2 border-emerald-800 rounded-xl bg-emerald-50/90 shadow-lg font-bold text-emerald-900;
	}
	.search-input:focus {
		@apply outline-none border-emerald-600;
	}

	/* Action buttons (shared) */
	.action-btn {
		@apply w-full py-4 rounded-xl border-4 text-base px-2 flex items-center justify-center gap-2 transition-all shadow-metallic font-serif font-bold tracking-wide;
	}
	.action-btn:hover {
		filter: brightness(1.1);
	}
	.action-btn:active {
		transform: scale(0.95);
	}

	.action-btn.emerald {
		@apply text-emerald-100 border-emerald-950;
		background-image: linear-gradient(to bottom, #34d399, #047857, #064e3b);
	}
	.action-btn.purple {
		@apply text-white border-purple-950;
		background-image: linear-gradient(to bottom, #e879f9, #d946ef, #9333ea);
	}
	.action-btn.blue {
		@apply text-blue-100 border-blue-950;
		background-image: linear-gradient(to bottom, #60a5fa, #1e40af, #172554);
	}

	/* Icon badge circles */
	.badge {
		@apply rounded-full border transition-transform shadow-inner;
	}
	.badge.emerald {
		@apply p-1 bg-emerald-950 border-emerald-400;
	}
	.badge.purple {
		@apply w-8 h-8 bg-purple-900 border-purple-400 flex items-center justify-center font-serif italic text-xl shrink-0;
	}
	.badge.blue {
		@apply p-1 bg-blue-900 border-blue-400 shrink-0;
	}
	/* group-hover:scale-110 — badge grows when its button is hovered. */
	.action-btn:hover .badge {
		transform: scale(1.1);
	}

	/* Right quest tray wrapper — geometry recently tuned, preserved exactly. */
	.tray {
		@apply absolute left-1/4 right-4 top-4 bottom-0;
	}
	.tray-inner {
		@apply w-full h-full rounded-t-2xl bg-emerald-900/80 border-2 border-emerald-700/50 border-b-0 shadow-2xl backdrop-blur-sm p-6 overflow-y-auto;
	}
	.quest-list {
		@apply grid grid-cols-1 gap-4;
	}

	/* Empty state (Map) */
	.empty {
		@apply h-full flex flex-col items-center justify-center text-emerald-100/50;
	}
	.empty :global(.empty-icon) {
		@apply mb-4 opacity-50;
	}
	.empty-title {
		@apply text-2xl font-bold font-serif;
	}
</style>
