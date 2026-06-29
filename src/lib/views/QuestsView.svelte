<script lang="ts">
	// Quests screen (SPEC §2.2). Fantasy-map / emerald theme (QUEST_THEME).
	// Full-bleed two-column layout matching the React prototype's `view === 'quests'`
	// block: an absolute 1/4 left sidebar (search + 3 action buttons + scroll log)
	// over a 3/4 right quest tray. The shell renders this view in a padding-less
	// `h-full w-full` container, so this component owns the full-bleed split.
	import { app } from '$lib/state.svelte';
	import { METALLIC_SHADOW, METALLIC_FONT } from '$lib/theme';
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
<div class="relative h-full w-full">
	<div class="absolute left-0 top-0 w-1/4 h-full z-10 p-6 pt-8 flex flex-col gap-5">
		<div class="relative">
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-900" size={18} />
			<input
				class="w-full pl-10 pr-4 py-3 border-2 border-emerald-800 rounded-xl bg-emerald-50/90 shadow-lg focus:outline-none focus:border-emerald-600 font-bold text-emerald-900"
				placeholder="Search Quests..."
				bind:value={app.search}
			/>
		</div>

		<!-- BUTTONS -->
		<button
			onclick={() => app.setView('binder')}
			class="w-full py-4 rounded-xl bg-gradient-to-b from-emerald-400 via-emerald-700 to-emerald-900 text-emerald-100 border-4 border-emerald-950 text-base px-2 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 group {METALLIC_SHADOW} {METALLIC_FONT}"
		>
			<div
				class="p-1 bg-emerald-950 rounded-full border border-emerald-400 group-hover:scale-110 transition-transform shadow-inner"
			>
				<Coins size={18} />
			</div>Start Card Quest
		</button>
		<button
			onclick={() => app.openStandaloneQuest()}
			class="w-full py-4 rounded-xl bg-gradient-to-b from-[#e879f9] via-[#d946ef] to-[#9333ea] text-white border-4 border-purple-950 text-base px-2 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 group {METALLIC_SHADOW} {METALLIC_FONT}"
		>
			<div
				class="w-8 h-8 bg-purple-900 rounded-full border border-purple-400 flex items-center justify-center font-serif italic text-xl group-hover:scale-110 transition-transform shadow-inner shrink-0"
			>
				S
			</div>Start Standalone Quest
		</button>
		<button
			onclick={() => app.openModal('drawCard')}
			class="w-full py-4 rounded-xl bg-gradient-to-b from-blue-400 via-blue-800 to-[#172554] text-blue-100 border-4 border-blue-950 text-base px-2 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 group {METALLIC_SHADOW} {METALLIC_FONT}"
		>
			<div
				class="p-1 bg-blue-900 rounded-full border border-blue-400 group-hover:scale-110 transition-transform shadow-inner shrink-0"
			>
				<Map size={18} />
			</div> Explore for Quests
		</button>

		<!-- Scroll Activity Log (Today's Scroll) -->
		<ScrollLog dailyLog={app.dailyLog} allLog={app.dailyLog} />
	</div>
	<div class="absolute right-4 top-4 bottom-0 w-3/4">
		<div
			class="w-full h-full rounded-t-2xl border-b-0 bg-emerald-900/80 border-2 border-emerald-700/50 shadow-2xl backdrop-blur-sm p-6 overflow-y-auto"
		>
			<div class="grid grid-cols-1 gap-4">
				{#each shown as card (card.id)}
					<ClientCard {card} />
				{/each}
			</div>
			{#if shown.length === 0}
				<div class="h-full flex flex-col items-center justify-center text-emerald-100/50">
					<Map size={64} class="mb-4 opacity-50" />
					<h3 class="text-2xl font-bold font-serif">No Active Quests</h3>
					<p>The realm is quiet... for now.</p>
				</div>
			{/if}
		</div>
	</div>
</div>
