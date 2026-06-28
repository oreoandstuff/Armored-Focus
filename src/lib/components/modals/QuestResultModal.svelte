<script lang="ts">
	// Quest Result modal (SPEC §2.5.5, §4.3/§4.4) — Complete or Continue a quest.
	// Driven by app.flowAction; the quest is looked up for display only.
	import { X } from '@lucide/svelte';
	import { app } from '$lib/state.svelte';
	import { THEME } from '$lib/theme';
	import { todayISO, tomorrowISO, addDays } from '$lib/core/dates';
	import RPGButton from '$lib/components/RPGButton.svelte';

	const inputStyle = `background: ${THEME.inputBg}; border-color: ${THEME.border}; color: ${THEME.text};`;

	let completionTypeId = $state('');
	let commission = $state(0);
	let note = $state('');
	let isCooldown = $state(false);
	let nextTypeId = $state('');
	let nextDueDate = $state(tomorrowISO());
	let cooldownDueDate = $state(addDays(todayISO(), 7));

	const completionTypes = $derived(app.rules.completionTypes ?? []);
	const cardQuestTypes = $derived(app.rules.cardQuestTypes ?? []);
	const isContinue = $derived(app.flowAction === 'Continue');

	const card = $derived(app.cards.find((c) => c.id === app.flowCardId));
	const quest = $derived(
		card?.[app.flowSide]?.quests.find((q) => q.id === app.flowQuestId)
	);
	const nextSelected = $derived(cardQuestTypes.find((q) => q.id === nextTypeId));

	$effect(() => {
		if (app.modals.questResult) {
			completionTypeId = app.rules.completionTypes?.[0]?.id ?? '';
			commission = 0;
			note = '';
			isCooldown = false;
			nextTypeId = app.rules.cardQuestTypes?.[0]?.id ?? '';
			nextDueDate = tomorrowISO();
			cooldownDueDate = addDays(todayISO(), 7);
		}
	});

	function submit() {
		const cardId = app.flowCardId;
		const questId = app.flowQuestId;
		if (!cardId || !questId) return;
		if (isContinue) {
			app.continueQuest(cardId, app.flowSide, questId, {
				completionTypeId,
				commission,
				isCooldown,
				nextType: isCooldown ? '' : (nextSelected?.name ?? ''),
				nextBaseExp: isCooldown ? 0 : (nextSelected?.exp ?? 0),
				nextDueDate: isCooldown ? cooldownDueDate : nextDueDate,
				note: note.trim()
			});
		} else {
			app.completeQuest(cardId, app.flowSide, questId, {
				completionTypeId,
				commission,
				note: note.trim()
			});
		}
	}
</script>

{#if app.modals.questResult}
	<div
		class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur"
		role="dialog"
		aria-modal="true"
		aria-label="Quest Result"
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
					{isContinue ? 'Continue Quest' : 'Complete Quest'}
				</h2>
				<button onclick={() => app.closeModals()} aria-label="Close" class="hover:brightness-125">
					<X size={22} />
				</button>
			</div>

			<div class="overflow-y-auto p-5" style="color: {THEME.text};">
				{#if quest}
					<p class="mb-4 text-sm">
						<span class="opacity-70">{card?.name}</span> —
						<span class="font-serif font-bold">{quest.type}</span>
					</p>
				{/if}

				<label class="mb-1 block text-sm font-bold">Completion Type</label>
				<select class="mb-4 w-full rounded border px-2 py-1" style={inputStyle} bind:value={completionTypeId}>
					{#each completionTypes as ct (ct.id)}
						<option value={ct.id}>{ct.name} (+{ct.bonusPercent}%)</option>
					{/each}
				</select>

				<label class="mb-1 block text-sm font-bold">Commission ($)</label>
				<input type="number" min="0" class="mb-4 w-full rounded border px-2 py-1 font-mono" style={inputStyle} bind:value={commission} />

				{#if isContinue}
					<label class="mb-3 flex items-center gap-2 text-sm font-bold">
						<input type="checkbox" bind:checked={isCooldown} />
						Put into Cooldown
					</label>

					{#if isCooldown}
						<label class="mb-1 block text-sm font-bold">Cooldown Due Date</label>
						<input type="date" class="mb-4 w-full rounded border px-2 py-1" style={inputStyle} bind:value={cooldownDueDate} />
					{:else}
						<label class="mb-1 block text-sm font-bold">Next Quest Type</label>
						<select class="mb-4 w-full rounded border px-2 py-1" style={inputStyle} bind:value={nextTypeId}>
							{#each cardQuestTypes as q (q.id)}
								<option value={q.id}>{q.name} ({q.exp} XP)</option>
							{/each}
						</select>
						<label class="mb-1 block text-sm font-bold">Next Due Date</label>
						<input type="date" class="mb-4 w-full rounded border px-2 py-1" style={inputStyle} bind:value={nextDueDate} />
					{/if}
				{/if}

				<label class="mb-1 block text-sm font-bold">Note</label>
				<textarea rows="3" class="w-full rounded border px-2 py-1" style={inputStyle} bind:value={note}></textarea>
			</div>

			<div class="flex justify-end gap-2 border-t px-5 py-3" style="border-color: {THEME.border};">
				<RPGButton variant="primary" onclick={() => app.closeModals()}>Cancel</RPGButton>
				<RPGButton variant="action" onclick={submit}>{isContinue ? 'Continue' : 'Complete'}</RPGButton>
			</div>
		</div>
	</div>
{/if}
