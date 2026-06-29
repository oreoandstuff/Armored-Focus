<script lang="ts">
	// Merge Cards modal (SPEC §2.5.6) — merge another card (the source) into the
	// target (app.flowCardId). The source is combined in and then removed.
	// Markup matches the React prototype's "Merge Cards" modal 1:1.
	import { app } from '$lib/state.svelte';
	import Modal from '$lib/components/Modal.svelte';
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

<Modal open={app.modals.mergeCard} ariaLabel="Merge Cards" blur={false}>
	<div class="panel">
		<h3 class="title">Merge Cards</h3>
		<p class="warning">
			Select a card to merge INTO <span class="target-name">{target?.name || 'Current Card'}</span>.
			The selected card below will be deleted, and its data (Logs, Notes, Quests) will be moved to the
			current card.
		</p>

		<div class="field">
			<label for="merge-source" class="field-label">Select Card to Absorb</label>
			<select id="merge-source" class="select" bind:value={sourceId}>
				<option value="">-- Select Card --</option>
				{#each candidates as c (c.id)}
					<option value={c.id}>
						{c.name}
						{c.businessSide?.businessName ? `(${c.businessSide.businessName})` : ''}
					</option>
				{/each}
			</select>
		</div>

		<div class="footer">
			<button onclick={() => app.closeModals()} class="cancel-btn"> Cancel </button>
			<RPGButton variant="danger" onclick={merge} disabled={!sourceId}>
				Merge & Delete Source
			</RPGButton>
		</div>
	</div>
</Modal>

<style lang="postcss">
	.panel {
		@apply w-[90%] max-w-lg rounded-lg border-4 border-[#d4c5a9] bg-[#fdfbf7] p-6 shadow-xl;
	}
	.title {
		@apply mb-4 font-serif text-xl font-bold text-[#2c241b];
	}
	.warning {
		@apply mb-4 text-sm text-stone-600;
	}
	.target-name {
		@apply font-bold text-[#8b4513];
	}
	.field {
		@apply mb-4;
	}
	.field-label {
		@apply mb-1 block text-xs font-bold uppercase text-stone-500;
	}
	.select {
		@apply w-full rounded border border-[#d4c5a9] bg-white p-2;
	}
	.footer {
		@apply flex justify-end gap-3 border-t border-[#d4c5a9] pt-4;
	}
	.cancel-btn {
		@apply px-4 py-2 font-bold text-stone-600;
	}
	.cancel-btn:hover {
		@apply text-stone-800;
	}
</style>
