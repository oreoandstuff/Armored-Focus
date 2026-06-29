<script lang="ts">
	// The Binder screen (SPEC §2.3). Markup mirrors the React prototype's
	// `view === 'binder'` block 1:1: decorative 3-ring spine, header, the pink
	// "Add Booster Pack" + gold "Draw New Card" buttons, the search + sort bar,
	// the card list and the empty state. The shell supplies the per-view
	// pink→purple background and the `p-6 max-w-7xl mx-auto` container, so this
	// view renders only the inner content. All state lives in the `app` store.
	import { app } from '$lib/state.svelte';
	import { METALLIC_SHADOW, METALLIC_FONT } from '$lib/theme';
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
	<div class="flex justify-between items-end mb-6 border-b-4 border-purple-900/30 pb-4">
		<div class="flex items-center gap-4">
			<div class="flex flex-col gap-2 border-r-4 border-stone-400 pr-4 bg-[#4c1d95] p-2 rounded-l-lg">
				{#each [0, 1, 2] as i (i)}
					<div class="w-4 h-4 rounded-full bg-gradient-to-b from-stone-300 via-white to-stone-400 shadow-sm border border-stone-500"></div>
				{/each}
			</div>
			<div>
				<h2 class="text-4xl font-serif font-bold text-purple-100 drop-shadow-md">The Binder</h2>
				<p class="text-purple-200/80 italic">Repository of Known Associates</p>
			</div>
		</div>
		<div class="flex gap-2">
			<button
				onclick={() => app.openModal('boosterPack')}
				class="group flex items-center px-4 py-2 rounded-xl bg-gradient-to-b from-pink-400 via-pink-600 to-pink-800 text-white border-4 border-pink-900 hover:brightness-110 active:scale-95 transition-all {METALLIC_SHADOW} {METALLIC_FONT}"
			>
				<div class="p-1 bg-pink-950 rounded-full border border-pink-400 group-hover:scale-110 transition-transform mr-2 shadow-inner">
					<Upload size={14} />
				</div>
				Add Booster Pack
			</button>
			<button
				onclick={() => app.openModal('drawCard')}
				class="group flex items-center px-4 py-2 rounded-xl bg-gradient-to-b from-[#faeebf] via-[#eebb4d] to-[#aa7e22] text-[#3e2723] border-4 border-[#5c3a1e] hover:brightness-110 active:scale-95 transition-all {METALLIC_SHADOW} {METALLIC_FONT}"
			>
				<div class="p-1 bg-[#5c3a1e] rounded-full border border-[#faeebf] group-hover:scale-110 transition-transform mr-2 text-[#faeebf] shadow-inner">
					<Layers size={14} />
				</div>
				Draw New Card
			</button>
		</div>
	</div>

	<div class="mb-6 flex gap-4 bg-purple-900/30 p-4 rounded-xl border-2 border-purple-500/30 backdrop-blur-sm items-center">
		<div class="relative flex-1">
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
			<input
				class="w-full pl-10 pr-4 py-2 bg-white border border-stone-300 rounded focus:outline-none focus:border-purple-500 text-stone-900 placeholder-stone-400"
				placeholder="Search by Name, Phone, Address..."
				bind:value={app.search}
			/>
		</div>
		<div class="relative">
			<button
				onclick={() => (isSortMenuOpen = !isSortMenuOpen)}
				class="flex items-center gap-2 bg-gradient-to-b from-orange-400 via-orange-600 to-red-700 text-white border-4 border-red-900 px-3 py-2 rounded-xl hover:brightness-110 transition-all shadow-sm {METALLIC_SHADOW} {METALLIC_FONT}"
			>
				<List size={14} /> Organize By: {app.sort}
			</button>
			{#if isSortMenuOpen}
				<div class="absolute right-0 top-full mt-2 w-64 bg-[#fdfbf7] border-2 border-[#d4c5a9] rounded-lg shadow-xl z-50 overflow-hidden">
					{#each SORT_OPTIONS as opt (opt)}
						<button
							onclick={() => {
								app.sort = opt;
								isSortMenuOpen = false;
							}}
							class="w-full text-left px-4 py-2 hover:bg-[#e8e4d9] text-[#2c241b] text-sm font-serif font-bold border-b border-stone-100 last:border-0 flex justify-between items-center {app.sort ===
							opt
								? 'bg-[#e8e4d9] text-[#8b4513]'
								: ''}"
						>
							{opt}
							{#if app.sort === opt}
								<CheckCircle size={12} class="text-emerald-600" />
							{/if}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<div class="space-y-2">
		{#each shown as card (card.id)}
			<ClientCard {card} />
		{/each}
		{#if binderCards.length === 0}
			<div class="text-center py-12 opacity-50 text-purple-200">
				<Book size={64} class="mx-auto mb-4 opacity-80" />
				<h3 class="text-xl font-bold">Binder Empty</h3>
				<p>No cards collected yet.</p>
			</div>
		{/if}
	</div>
</div>
