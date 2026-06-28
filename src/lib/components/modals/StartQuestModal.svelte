<script lang="ts">
	// Start Quest modal (SPEC §2.5.4, §4.4) — start a card quest, or a standalone
	// task when app.flowStandalone is set. Quest type drives baseExp.
	import { X } from '@lucide/svelte';
	import { app } from '$lib/state.svelte';
	import { THEME } from '$lib/theme';
	import { todayISO } from '$lib/core/dates';
	import RPGButton from '$lib/components/RPGButton.svelte';

	const inputStyle = `background: ${THEME.inputBg}; border-color: ${THEME.border}; color: ${THEME.text};`;

	let typeId = $state('');
	let dueDate = $state(todayISO());
	let note = $state('');

	const questTypes = $derived(
		app.flowStandalone ? (app.rules.standaloneQuestTypes ?? []) : (app.rules.cardQuestTypes ?? [])
	);
	const selected = $derived(questTypes.find((q) => q.id === typeId));

	$effect(() => {
		if (app.modals.startQuest) {
			typeId = questTypes[0]?.id ?? '';
			dueDate = todayISO();
			note = '';
		}
	});

	const noteMissing = $derived(app.flowStandalone && note.trim() === '');
	const canStart = $derived(!!selected && !noteMissing);

	function start() {
		if (!selected) return;
		const type = selected.name;
		const baseExp = selected.exp;
		if (app.flowStandalone) {
			app.createStandaloneQuest({ type, baseExp, dueDate, note: note.trim() });
		} else if (app.flowCardId) {
			app.startQuest(app.flowCardId, app.flowSide, { type, baseExp, dueDate, note: note.trim() });
		}
	}
</script>

{#if app.modals.startQuest}
	<div
		class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur"
		role="dialog"
		aria-modal="true"
		aria-label="Start Quest"
	>
		<div
			class="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-lg border-2 shadow-2xl"
			style="background: {THEME.panel}; border-color: {THEME.border};"
		>
			<div
				class="flex items-center justify-between px-5 py-3"
				style="background: {THEME.headerBg}; color: {THEME.headerText};"
			>
				<h2 class="font-serif text-xl font-bold tracking-wide">
					{app.flowStandalone ? 'New Standalone Task' : 'Start a Quest'}
				</h2>
				<button onclick={() => app.closeModals()} aria-label="Close" class="hover:brightness-125">
					<X size={22} />
				</button>
			</div>

			<div class="overflow-y-auto p-5" style="color: {THEME.text};">
				<label class="mb-1 block text-sm font-bold">Quest Type</label>
				<select class="mb-4 w-full rounded border px-2 py-1" style={inputStyle} bind:value={typeId}>
					{#each questTypes as q (q.id)}
						<option value={q.id}>{q.name} ({q.exp} XP)</option>
					{/each}
				</select>

				<label class="mb-1 block text-sm font-bold">Due Date</label>
				<input type="date" class="mb-4 w-full rounded border px-2 py-1" style={inputStyle} bind:value={dueDate} />

				<label class="mb-1 block text-sm font-bold">
					Note{#if app.flowStandalone}<span class="text-red-700"> (required)</span>{/if}
				</label>
				<textarea rows="3" class="w-full rounded border px-2 py-1" style={inputStyle} bind:value={note}></textarea>
				{#if noteMissing}
					<p class="mt-1 text-sm italic text-red-700">A note is required for standalone tasks.</p>
				{/if}
			</div>

			<div class="flex justify-end gap-2 border-t px-5 py-3" style="border-color: {THEME.border};">
				<RPGButton variant="primary" onclick={() => app.closeModals()}>Cancel</RPGButton>
				<RPGButton variant="action" disabled={!canStart} onclick={start}>Start Quest</RPGButton>
			</div>
		</div>
	</div>
{/if}
