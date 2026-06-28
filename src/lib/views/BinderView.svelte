<script lang="ts">
	// The Binder screen (SPEC §2.3): pink→purple binder with a decorative 3-ring
	// spine. Lists every non-standalone card, with working search + sort (the
	// prototype's search was dead — SPEC §9 #3). All state lives in the `app`
	// store; this view only reads/filters and opens modals.
	import { app } from '$lib/state.svelte';
	import { BINDER_THEME } from '$lib/theme';
	import { SORT_OPTIONS } from '$lib/core/rules';
	import { searchCards, sortCards } from '$lib/core/sorting';
	import ClientCard from '$lib/components/ClientCard.svelte';
	import RPGButton from '$lib/components/RPGButton.svelte';

	// Standalone task cards never live in the Binder.
	const binderCards = $derived(app.cards.filter((c) => !c.isStandalone));
	const shown = $derived(sortCards(searchCards(binderCards, app.search), app.sort));
</script>

<div class="min-h-screen {BINDER_THEME.bg} {BINDER_THEME.text}">
	<div class="max-w-7xl mx-auto p-6">
		<!-- Header + action buttons -->
		<header class="flex flex-wrap items-end justify-between gap-4 mb-6">
			<div>
				<h1 class="font-serif font-bold tracking-wide text-3xl" style="color: {BINDER_THEME.accent};">
					The Binder
				</h1>
				<p class="font-sans text-sm opacity-80">Repository of Known Associates</p>
			</div>
			<div class="flex flex-wrap gap-3">
				<RPGButton variant="primary" onclick={() => app.openModal('boosterPack')}>
					Add Booster Pack
				</RPGButton>
				<RPGButton variant="gold" onclick={() => app.openModal('drawCard')}>
					Draw New Card
				</RPGButton>
			</div>
		</header>

		<!-- Search + Sort bar -->
		<div class="flex flex-wrap gap-3 mb-6">
			<input
				type="text"
				bind:value={app.search}
				placeholder="Search by Name, Phone, Address..."
				class="flex-1 min-w-[16rem] px-4 py-2 rounded font-sans text-purple-950 placeholder:text-purple-400 border-2 border-purple-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
				style="background-color: {BINDER_THEME.page};"
			/>
			<select
				bind:value={app.sort}
				class="px-4 py-2 rounded font-sans text-purple-950 border-2 border-purple-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
				style="background-color: {BINDER_THEME.page};"
			>
				{#each SORT_OPTIONS as option (option)}
					<option value={option}>{option}</option>
				{/each}
			</select>
		</div>

		<!-- Binder "page" with decorative 3-ring spine -->
		<div
			class="relative rounded-lg shadow-2xl pl-16 pr-6 py-6 min-h-[24rem]"
			style="background-color: {BINDER_THEME.page};"
		>
			<!-- Decorative spine (purely visual) -->
			<div
				class="absolute left-0 top-0 bottom-0 w-12 rounded-l-lg flex flex-col items-center justify-around py-10"
				style="background-color: {BINDER_THEME.spine};"
				aria-hidden="true"
			>
				{#each [0, 1, 2] as ring (ring)}
					<div
						class="w-7 h-7 rounded-full border-2 border-purple-950/40"
						style="background: radial-gradient(circle at 35% 30%, #f5f5f5, {BINDER_THEME.ring} 55%, #6b6b6b 100%); box-shadow: inset 0 1px 2px rgba(255,255,255,0.6), 0 1px 2px rgba(0,0,0,0.4);"
					></div>
				{/each}
			</div>

			{#if shown.length === 0}
				<div class="flex flex-col items-center justify-center text-center py-20 text-purple-900">
					<h2 class="font-serif font-bold text-2xl mb-1">Binder Empty</h2>
					<p class="font-sans text-sm opacity-70">No cards collected yet.</p>
				</div>
			{:else}
				<div class="flex flex-col gap-4">
					{#each shown as card (card.id)}
						<ClientCard {card} />
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
