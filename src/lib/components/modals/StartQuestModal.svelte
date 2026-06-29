<script lang="ts">
	// Start Quest modal (SPEC §2.5.4, §4.4) — start a card quest, or a standalone
	// task when app.flowStandalone is set. Visually matches the React prototype's
	// "Start New Quest / Start Standalone Quest" modal.
	import { X } from '@lucide/svelte';
	import { app } from '$lib/state.svelte';
	import { todayISO } from '$lib/core/dates';
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

{#if app.modals.startQuest}
	<div
		class="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
		aria-label="Start Quest"
	>
		<div
			class="bg-[#fdfbf7] w-full max-w-lg rounded-lg shadow-2xl border-4 border-[#d4c5a9] max-h-[90vh] overflow-y-auto"
		>
			<div
				class="bg-[#2c241b] text-[#f5deb3] p-4 border-b border-[#d4c5a9] flex justify-between items-center"
			>
				<h3 class="font-serif font-bold text-xl">
					{isStandalone ? 'Start Standalone Quest' : 'Start New Quest'}
				</h3>
				<button onclick={() => app.closeModals()} aria-label="Close"><X /></button>
			</div>
			<div class="p-6">
				<p class="text-sm text-stone-600 mb-4 font-bold">
					{#if isStandalone}
						Create a temporary task separate from the binder.
					{:else}
						Client: <span class="text-[#8b4513]">{card?.name}</span> ({activeSide})
					{/if}
				</p>

				<div class="mb-4">
					<label for="start-type" class="block text-xs font-bold text-stone-500 uppercase mb-1"
						>Quest Type</label
					>
					<select
						id="start-type"
						class="w-full p-2 border border-[#d4c5a9] rounded bg-white"
						bind:value={typeId}
					>
						{#each questTypes as qt (qt.id)}
							<option value={qt.id}>{qt.name}</option>
						{/each}
					</select>
				</div>

				{#if isStandalone}
					<div class="mb-4">
						<label for="start-standalone-note" class="block text-xs font-bold text-stone-500 uppercase mb-1"
							>Note (Required)</label
						>
						<textarea
							id="start-standalone-note"
							class="w-full p-2 border border-[#d4c5a9] rounded bg-white h-24 text-sm"
							placeholder="Describe this task..."
							bind:value={note}
						></textarea>
					</div>
				{/if}

				<div class="mb-6">
					<label for="start-due" class="block text-xs font-bold text-stone-500 uppercase mb-1"
						>Due Date</label
					>
					<input
						id="start-due"
						type="date"
						class="w-full p-2 border border-[#d4c5a9] rounded bg-white"
						bind:value={dueDate}
					/>
				</div>

				<!-- Notes Field -->
				{#if !isStandalone}
					<div class="mb-4">
						<label for="start-note" class="block text-xs font-bold text-stone-500 uppercase mb-1"
							>Quest Note</label
						>
						<textarea
							id="start-note"
							class="w-full p-2 border border-[#d4c5a9] rounded bg-white h-20 text-sm"
							placeholder="Initial notes..."
							bind:value={note}
						></textarea>
					</div>
				{/if}

				<div class="flex justify-end gap-2">
					<button onclick={() => app.closeModals()} class="px-4 py-2 text-stone-500 font-bold"
						>Cancel</button
					>
					<RPGButton variant="action" disabled={noteMissing} onclick={start}>Begin Quest</RPGButton>
				</div>
			</div>
		</div>
	</div>
{/if}
