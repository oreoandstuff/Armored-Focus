<script lang="ts">
	// The Binder screen (SPEC §2.3). Markup mirrors the React prototype's
	// `view === 'binder'` block 1:1: decorative 3-ring spine, header, the pink
	// "Add Booster Pack" + gold "Draw New Card" buttons, the search + sort bar,
	// the card list and the empty state. The shell supplies the per-view
	// pink→purple background and the `p-6 max-w-7xl mx-auto` container, so this
	// view renders only the inner content. All state lives in the `app` store.
	import { app } from '$lib/state.svelte';
	import { SORT_OPTIONS } from '$lib/core/rules';
	import { searchCards, sortCards } from '$lib/core/sorting';
	import ClientCard from '$lib/components/ClientCard.svelte';
	import { Upload, Layers, Search, List, Book, CheckCircle } from '@lucide/svelte';

	// Standalone task cards never live in the Binder.
	const binderCards = $derived(app.cards.filter((c) => !c.isStandalone));
	const shown = $derived(sortCards(searchCards(binderCards, app.search), app.sort));

	let isSortMenuOpen = $state(false);
</script>

<div>
	<div class="binder-head">
		<div class="head-left">
			<div class="spine">
				{#each [0, 1, 2] as i (i)}
					<div class="ring"></div>
				{/each}
			</div>
			<div>
				<h2 class="title">The Binder</h2>
				<p class="subtitle">Repository of Known Associates</p>
			</div>
		</div>
		<div class="head-actions">
			<button class="btn-booster" onclick={() => app.openModal('boosterPack')}>
				<div class="badge booster">
					<Upload size={14} />
				</div>
				Add Booster Pack
			</button>
			<button class="btn-draw" onclick={() => app.openModal('drawCard')}>
				<div class="badge draw">
					<Layers size={14} />
				</div>
				Draw New Card
			</button>
		</div>
	</div>

	<div class="search-bar">
		<div class="search">
			<Search class="search-icon" size={18} />
			<input
				class="search-input"
				placeholder="Search by Name, Phone, Address..."
				bind:value={app.search}
			/>
		</div>
		<div class="sort">
			<button class="sort-btn" onclick={() => (isSortMenuOpen = !isSortMenuOpen)}>
				<List size={14} /> Organize By: {app.sort}
			</button>
			{#if isSortMenuOpen}
				<div class="sort-menu">
					{#each SORT_OPTIONS as opt (opt)}
						<button
							class="sort-option"
							class:active={app.sort === opt}
							onclick={() => {
								app.sort = opt;
								isSortMenuOpen = false;
							}}
						>
							{opt}
							{#if app.sort === opt}
								<CheckCircle size={12} class="check-icon" />
							{/if}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<div class="card-list">
		{#each shown as card (card.id)}
			<ClientCard {card} />
		{/each}
		{#if binderCards.length === 0}
			<div class="empty">
				<Book size={64} class="empty-icon" />
				<h3 class="empty-title">Binder Empty</h3>
				<p>No cards collected yet.</p>
			</div>
		{/if}
	</div>
</div>

<style lang="postcss">
	/* Header */
	.binder-head {
		@apply mb-6 flex flex-col gap-4 border-b-4 border-purple-900/30 pb-4 lg:flex-row lg:items-end lg:justify-between lg:gap-0;
	}
	.head-left {
		@apply flex items-center gap-4;
	}

	/* Decorative 3-ring spine */
	.spine {
		@apply flex flex-col gap-2 rounded-l-lg border-r-4 border-stone-400 bg-[#4c1d95] p-2 pr-4;
	}
	.ring {
		@apply h-4 w-4 rounded-full border border-stone-500 bg-gradient-to-b from-stone-300 via-white to-stone-400 shadow-sm;
	}

	.title {
		@apply font-serif text-4xl font-bold text-purple-100 drop-shadow-md;
	}
	.subtitle {
		@apply italic text-purple-200/80;
	}

	/* Header action buttons */
	.head-actions {
		@apply flex flex-wrap gap-2;
	}
	.btn-booster,
	.btn-draw {
		@apply flex items-center rounded-xl border-4 px-4 py-2 font-serif font-bold tracking-wide shadow-metallic transition-all hover:brightness-110 active:scale-95;
	}
	.btn-booster {
		@apply border-pink-900 text-white;
		background-image: linear-gradient(to bottom, #f472b6, #db2777, #9d174d);
	}
	.btn-draw {
		@apply border-[#5c3a1e] text-[#3e2723];
		background-image: linear-gradient(to bottom, #faeebf, #eebb4d, #aa7e22);
	}

	/* Icon badge circles */
	.badge {
		@apply mr-2 rounded-full border p-1 shadow-inner transition-transform;
	}
	.badge.booster {
		@apply border-pink-400 bg-pink-950;
	}
	.badge.draw {
		@apply border-[#faeebf] bg-[#5c3a1e] text-[#faeebf];
	}
	.btn-booster:hover .badge,
	.btn-draw:hover .badge {
		transform: scale(1.1);
	}

	/* Search + sort bar */
	.search-bar {
		@apply mb-6 flex flex-col gap-4 rounded-xl border-2 border-purple-500/30 bg-purple-900/30 p-4 backdrop-blur-sm sm:flex-row sm:items-center;
	}
	.search {
		@apply relative flex-1;
	}
	.search :global(.search-icon) {
		@apply absolute left-3 top-1/2 -translate-y-1/2 text-stone-400;
	}
	.search-input {
		@apply w-full rounded border border-stone-300 bg-white py-2 pl-10 pr-4 text-stone-900 placeholder-stone-400 focus:border-purple-500 focus:outline-none;
	}

	.sort {
		@apply relative;
	}
	.sort-btn {
		@apply flex items-center gap-2 rounded-xl border-4 border-red-900 px-3 py-2 font-serif font-bold tracking-wide text-white shadow-metallic transition-all hover:brightness-110;
		background-image: linear-gradient(to bottom, #fb923c, #ea580c, #b91c1c);
	}
	.sort-menu {
		@apply absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-lg border-2 border-[#d4c5a9] bg-[#fdfbf7] shadow-xl;
	}
	.sort-option {
		@apply flex w-full items-center justify-between border-b border-stone-100 px-4 py-2 text-left font-serif text-sm font-bold text-[#2c241b] last:border-0 hover:bg-[#e8e4d9];
	}
	.sort-option.active {
		@apply bg-[#e8e4d9] text-[#8b4513];
	}
	.sort-option :global(.check-icon) {
		@apply text-emerald-600;
	}

	/* Card list + empty state */
	/* Card spacing comes from each ClientCard's own bottom margin; an @apply
	   space-y here can't reach the child component (different style scope). */
	.empty {
		@apply py-12 text-center text-purple-200 opacity-50;
	}
	.empty :global(.empty-icon) {
		@apply mx-auto mb-4 opacity-80;
	}
	.empty-title {
		@apply text-xl font-bold;
	}
</style>
