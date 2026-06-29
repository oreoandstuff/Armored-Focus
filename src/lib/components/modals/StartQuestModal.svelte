<script lang="ts">
	// Start Quest modal (SPEC §2.5.4, §4.4) — start a card quest, or a standalone
	// task when app.flowStandalone is set. Visually matches the React prototype's
	// "Start New Quest / Start Standalone Quest" modal.
	import { X } from '@lucide/svelte';
	import { app } from '$lib/state.svelte';
	import { todayISO } from '$lib/core/dates';
	import Modal from '$lib/components/Modal.svelte';
	import RPGButton from '$lib/components/RPGButton.svelte';

	let typeId = $state('');
	let dueDate = $state(todayISO());
	let note = $state('');

	const isStandalone = $derived(app.flowStandalone);
	const questTypes = $derived(
		isStandalone ? (app.rules.standaloneQuestTypes ?? []) : (app.rules.cardQuestTypes ?? [])
	);
	const selected = $derived(questTypes.find((q) => q.id === typeId));

	const card = $derived(app.cards.find((c) => c.id === app.flowCardId));
	const activeSide = $derived(app.flowSide === 'businessSide' ? 'Business' : 'Client');

	$effect(() => {
		if (app.modals.startQuest) {
			typeId = questTypes[0]?.id ?? '';
			dueDate = todayISO();
			note = '';
		}
	});

	const noteMissing = $derived(isStandalone && note.trim() === '');

	function start() {
		if (!selected) return;
		const type = selected.name;
		const baseExp = selected.exp;
		if (isStandalone) {
			if (!note.trim()) return;
			app.createStandaloneQuest({ type, baseExp, dueDate, note: note.trim() });
		} else if (app.flowCardId) {
			app.startQuest(app.flowCardId, app.flowSide, { type, baseExp, dueDate, note: note.trim() });
		}
	}
</script>

<Modal open={app.modals.startQuest} ariaLabel="Start Quest">
	<div class="panel">
		<header class="panel-header">
			<h3 class="panel-title">
				{isStandalone ? 'Start Standalone Quest' : 'Start New Quest'}
			</h3>
			<button onclick={() => app.closeModals()} aria-label="Close"><X /></button>
		</header>
		<div class="panel-body">
			<p class="context">
				{#if isStandalone}
					Create a temporary task separate from the binder.
				{:else}
					Client: <span class="context-name">{card?.name}</span> ({activeSide})
				{/if}
			</p>

			<div class="field">
				<label for="start-type" class="field-label">Quest Type</label>
				<select id="start-type" class="input" bind:value={typeId}>
					{#each questTypes as qt (qt.id)}
						<option value={qt.id}>{qt.name}</option>
					{/each}
				</select>
			</div>

			{#if isStandalone}
				<div class="field">
					<label for="start-standalone-note" class="field-label">Note (Required)</label>
					<textarea
						id="start-standalone-note"
						class="note-area standalone"
						placeholder="Describe this task..."
						bind:value={note}
					></textarea>
				</div>
			{/if}

			<div class="field-due">
				<label for="start-due" class="field-label">Due Date</label>
				<input id="start-due" type="date" class="input" bind:value={dueDate} />
			</div>

			<!-- Notes Field -->
			{#if !isStandalone}
				<div class="field">
					<label for="start-note" class="field-label">Quest Note</label>
					<textarea
						id="start-note"
						class="note-area quest"
						placeholder="Initial notes..."
						bind:value={note}
					></textarea>
				</div>
			{/if}

			<div class="footer">
				<button onclick={() => app.closeModals()} class="cancel-btn">Cancel</button>
				<RPGButton variant="action" disabled={noteMissing} onclick={start}>Begin Quest</RPGButton>
			</div>
		</div>
	</div>
</Modal>

<style>
	.panel {
		@apply w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border-4 border-[#d4c5a9] bg-[#fdfbf7] shadow-2xl;
	}
	.panel-header {
		@apply flex items-center justify-between border-b border-[#d4c5a9] bg-[#2c241b] p-4 text-[#f5deb3];
	}
	.panel-title {
		@apply font-serif text-xl font-bold;
	}
	.panel-body {
		@apply p-6;
	}

	.context {
		@apply mb-4 text-sm font-bold text-stone-600;
	}
	.context-name {
		@apply text-[#8b4513];
	}

	.field {
		@apply mb-4;
	}
	.field-due {
		@apply mb-6;
	}
	.field-label {
		@apply mb-1 block text-xs font-bold uppercase text-stone-500;
	}

	.input {
		@apply w-full rounded border border-[#d4c5a9] bg-white p-2;
	}
	.note-area {
		@apply w-full rounded border border-[#d4c5a9] bg-white p-2 text-sm;
	}
	.note-area.standalone {
		@apply h-24;
	}
	.note-area.quest {
		@apply h-20;
	}

	.footer {
		@apply flex justify-end gap-2;
	}
	.cancel-btn {
		@apply px-4 py-2 font-bold text-stone-500;
	}
</style>
