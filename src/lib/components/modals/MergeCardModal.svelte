<script lang="ts">
	// Merge Cards modal (SPEC §2.5.6) — merge another card (the source) into the
	// target (app.flowCardId). The source is combined in and then removed.
	// Markup matches the React prototype's "Merge Cards" modal 1:1.
	import { app } from '$lib/state.svelte';
	import RPGButton from '$lib/components/RPGButton.svelte';

	let sourceId = $state('');

	const target = $derived(app.cards.find((c) => c.id === app.flowCardId));
	const candidates = $derived(
		app.cards.filter(
			(c) => c.id !== app.flowCardId && !c.isStandalone && c.primarySide !== 'Standalone'
		)
	);

	$effect(() => {
		if (app.modals.mergeCard) {
			sourceId = '';
		}
	});

	function merge() {
		if (!app.flowCardId || !sourceId) return;
		app.mergeCards(app.flowCardId, sourceId); // closes the modal itself
	}
</script>

{#if app.modals.mergeCard}
	<div class="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]">
		<div class="bg-[#fdfbf7] rounded-lg shadow-xl border-4 border-[#d4c5a9] w-[90%] max-w-lg p-6">
			<h3 class="font-serif font-bold text-xl mb-4 text-[#2c241b]">Merge Cards</h3>
			<p class="text-sm text-stone-600 mb-4">
				Select a card to merge INTO <span class="font-bold text-[#8b4513]"
					>{target?.name || 'Current Card'}</span
				>. The selected card below will be deleted, and its data (Logs, Notes, Quests) will be moved
				to the current card.
			</p>

			<div class="mb-4">
				<label for="merge-source" class="block text-xs font-bold text-stone-500 uppercase mb-1"
					>Select Card to Absorb</label
				>
				<select
					id="merge-source"
					class="w-full p-2 border border-[#d4c5a9] rounded bg-white"
					bind:value={sourceId}
				>
					<option value="">-- Select Card --</option>
					{#each candidates as c (c.id)}
						<option value={c.id}>
							{c.name}
							{c.businessSide?.businessName ? `(${c.businessSide.businessName})` : ''}
						</option>
					{/each}
				</select>
			</div>

			<div class="flex justify-end gap-3 pt-4 border-t border-[#d4c5a9]">
				<button
					onclick={() => app.closeModals()}
					class="px-4 py-2 text-stone-600 font-bold hover:text-stone-800"
				>
					Cancel
				</button>
				<RPGButton variant="danger" onclick={merge} disabled={!sourceId}>
					Merge & Delete Source
				</RPGButton>
			</div>
		</div>
	</div>
{/if}
