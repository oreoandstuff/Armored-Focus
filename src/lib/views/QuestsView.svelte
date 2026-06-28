<script lang="ts">
	// Quests screen (SPEC §2.2). Fantasy-map / emerald theme (§7, QUEST_THEME).
	// Full-bleed two-column layout: left ~1/4 sidebar (search + actions + scroll),
	// right ~3/4 quest tray listing cards with a live (Active/Cooldown) quest.
	import { app } from '$lib/state.svelte';
	import { QUEST_THEME, METALLIC_FONT } from '$lib/theme';
	import { searchCards } from '$lib/core/sorting';
	import ScrollLog from '$lib/components/ScrollLog.svelte';
	import ClientCard from '$lib/components/ClientCard.svelte';
	import RPGButton from '$lib/components/RPGButton.svelte';
	import { Search, Map, Compass, ScrollText } from '@lucide/svelte';

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

<div class="min-h-screen w-full {QUEST_THEME.bg} {QUEST_THEME.text}">
	<div class="flex w-full flex-col gap-6 p-6 lg:flex-row">
		<!-- LEFT SIDEBAR (~1/4) -->
		<aside class="flex w-full flex-col gap-4 lg:w-1/4">
			<header class="flex items-center gap-2">
				<Map size={26} class={QUEST_THEME.accent} />
				<h1 class="{METALLIC_FONT} text-2xl text-emerald-50">Quest Map</h1>
			</header>

			<!-- Search box — actually filters the tray (SPEC §9 #4). -->
			<div
				class="flex items-center gap-2 rounded-md border {QUEST_THEME.border} bg-emerald-950/60 px-3 py-2"
			>
				<Search size={16} class="text-emerald-300" />
				<input
					bind:value={app.search}
					placeholder="Search Quests..."
					class="w-full bg-transparent text-emerald-50 placeholder-emerald-300/50 outline-none"
				/>
			</div>

			<!-- Actions -->
			<div class="flex flex-col gap-2">
				<!-- Start Card Quest: a card quest needs a specific card, so route to the
				     Binder where the user can pick a card and start a quest from it. -->
				<RPGButton variant="action" class="w-full" onclick={() => app.setView('binder')}>
					Start Card Quest
				</RPGButton>

				<!-- Standalone quest (one-off, not tied to a card). -->
				<RPGButton variant="primary" class="w-full" onclick={() => app.openStandaloneQuest()}>
					Start Standalone Quest
				</RPGButton>

				<!-- Explore for Quests: prototype dead button (SPEC §9 #5). Wired to open
				     the Draw Card modal — exploring brings a new card/lead into play. -->
				<button
					onclick={() => app.openModal('drawCard')}
					class="flex w-full items-center justify-center gap-2 rounded border border-blue-400/50 bg-gradient-to-b from-blue-500 to-blue-700 px-4 py-2 font-serif font-bold tracking-wide text-white shadow-[0_4px_4px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.4)] transition hover:brightness-110 active:scale-95"
				>
					<Compass size={16} /> Explore for Quests
				</button>
			</div>

			<!-- Today's Scroll -->
			<ScrollLog dailyLog={app.dailyLog} allLog={app.dailyLog} />
		</aside>

		<!-- RIGHT TRAY (~3/4) -->
		<section
			class="flex w-full flex-col rounded-lg border {QUEST_THEME.tray} p-4 lg:w-3/4"
		>
			<h2 class="mb-4 flex items-center gap-2 {METALLIC_FONT} text-xl text-emerald-100">
				<ScrollText size={20} class="text-emerald-300" /> Active Quests
			</h2>

			<div class="flex flex-col gap-3 overflow-y-auto">
				{#each shown as card (card.id)}
					<ClientCard {card} />
				{:else}
					<div class="flex flex-1 flex-col items-center justify-center py-20 text-center">
						<Map size={48} class="mb-4 text-emerald-300/60" />
						<p class="{METALLIC_FONT} text-2xl text-emerald-100">No Active Quests</p>
						<p class="mt-2 italic text-emerald-300/70">The realm is quiet... for now.</p>
					</div>
				{/each}
			</div>
		</section>
	</div>
</div>
