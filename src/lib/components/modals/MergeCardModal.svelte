<script lang="ts">
	// Merge Cards modal (SPEC §2.5.6) — merge another card (the source) into the
	// target (app.flowCardId). The source is combined in and then removed.
	import { X, Merge } from '@lucide/svelte';
	import { app } from '$lib/state.svelte';
	import { THEME } from '$lib/theme';
	import RPGButton from '$lib/components/RPGButton.svelte';

	const inputStyle = `background: ${THEME.inputBg}; border-color: ${THEME.border}; color: ${THEME.text};`;

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
	<div
		class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur"
		role="dialog"
		aria-modal="true"
		aria-label="Merge Cards"
	>
		<div
			class="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-lg border-2 shadow-2xl"
			style="background: {THEME.panel}; border-color: {THEME.border};"
		>
			<div
				class="flex items-center justify-between px-5 py-3"
				style="background: {THEME.headerBg}; color: {THEME.headerText};"
			>
				<h2 class="flex items-center gap-2 font-serif text-xl font-bold tracking-wide">
					<Merge size={20} /> Merge Cards
				</h2>
				<button onclick={() => app.closeModals()} aria-label="Close" class="hover:brightness-125">
					<X size={22} />
				</button>
			</div>

			<div class="overflow-y-auto p-5" style="color: {THEME.text};">
				<p class="mb-4 text-sm">
					Merging into <span class="font-serif font-bold">{target?.name ?? 'this card'}</span>.
				</p>

				<label class="mb-1 block text-sm font-bold">Card to merge in (source)</label>
				{#if candidates.length === 0}
					<p class="text-sm italic opacity-70">No other cards available to merge.</p>
				{:else}
					<select class="mb-4 w-full rounded border px-2 py-1" style={inputStyle} bind:value={sourceId}>
						<option value="" disabled>Select a card…</option>
						{#each candidates as c (c.id)}
							<option value={c.id}>{c.name} ({c.primarySide})</option>
						{/each}
					</select>
				{/if}

				<p
					class="rounded border p-3 text-sm"
					style="background: {THEME.inputBg}; border-color: {THEME.goldBorder};"
				>
					⚠ The selected card's quests, notes, logs, lines of business and carriers will be merged
					into <span class="font-bold">{target?.name ?? 'the target'}</span>, and the source card
					will be permanently removed.
				</p>
			</div>

			<div class="flex justify-end gap-2 border-t px-5 py-3" style="border-color: {THEME.border};">
				<RPGButton variant="primary" onclick={() => app.closeModals()}>Cancel</RPGButton>
				<RPGButton variant="danger" disabled={sourceId === ''} onclick={merge}>Merge</RPGButton>
			</div>
		</div>
	</div>
{/if}
