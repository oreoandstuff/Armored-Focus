<script lang="ts">
	// Quest Result modal (SPEC §2.5.5, §4.3/§4.4) — Complete or Continue a quest.
	// Driven by app.flowAction; visually matches the React prototype's
	// "Quest Completion / Quest Progression" modal.
	import { X, CheckCircle, ArrowRight, DollarSign } from '@lucide/svelte';
	import { app } from '$lib/state.svelte';
	import { todayISO, tomorrowISO, addDays } from '$lib/core/dates';
	import Modal from '$lib/components/Modal.svelte';
	import RPGButton from '$lib/components/RPGButton.svelte';

	let completionTypeId = $state('');
	let commission = $state(0);
	let note = $state('');
	let isCooldown = $state(false);
	let nextTypeId = $state('');
	let nextDueDate = $state(tomorrowISO());
	let cooldownDueDate = $state(addDays(todayISO(), 7));

	const completionTypes = $derived(app.rules.completionTypes ?? []);
	const isContinue = $derived(app.flowAction === 'Continue');

	const card = $derived(app.cards.find((c) => c.id === app.flowCardId));
	const nextQuestTypes = $derived(
		card?.isStandalone ? (app.rules.standaloneQuestTypes ?? []) : (app.rules.cardQuestTypes ?? [])
	);
	const nextSelected = $derived(nextQuestTypes.find((q) => q.id === nextTypeId));

	$effect(() => {
		if (app.modals.questResult) {
			completionTypeId = app.rules.completionTypes?.[0]?.id ?? '';
			commission = 0;
			note = '';
			isCooldown = false;
			nextTypeId = nextQuestTypes[0]?.id ?? '';
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

<Modal open={app.modals.questResult} ariaLabel="Quest Result">
	<div class="panel">
		<div class="panel-header" class:continue={isContinue} class:complete={!isContinue}>
			<h3 class="panel-title">
				{#if isContinue}
					<ArrowRight size={24} />
				{:else}
					<CheckCircle size={24} />
				{/if}
				{isContinue ? 'Quest Progression' : 'Quest Completion'}
			</h3>
			<button onclick={() => app.closeModals()} aria-label="Close"><X /></button>
		</div>

		<div class="panel-body">
			<!-- 1. Completion Type -->
			<div>
				<label for="quest-completion-type" class="field-label">Result / Completion Type</label>
				<select id="quest-completion-type" class="completion-select" bind:value={completionTypeId}>
					{#each completionTypes as ct (ct.id)}
						<option value={ct.id}>{ct.name} (+{ct.bonusPercent}%)</option>
					{/each}
				</select>
			</div>

			<!-- 2. Commission -->
			<div>
				<label for="quest-commission" class="field-label">Commission Earned</label>
				<div class="commission">
					<DollarSign
						class="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600"
						size={16}
					/>
					<input
						id="quest-commission"
						type="number"
						class="commission-input"
						bind:value={commission}
					/>
				</div>
			</div>

			<!-- 3. Continue Logic (Only if Continuing) -->
			{#if isContinue}
				<div class="continue-box">
					<h4 class="continue-title">Next Step</h4>

					<label class="cooldown-check">
						<input type="checkbox" bind:checked={isCooldown} />
						Put into Cooldown?
					</label>

					{#if !isCooldown}
						<div>
							<label for="quest-next-type" class="field-label-blue">Next Quest Type</label>
							<select id="quest-next-type" class="input-blue" bind:value={nextTypeId}>
								{#if card?.isStandalone}
									<optgroup label="Standalone Quests">
										{#each app.rules.standaloneQuestTypes ?? [] as qt (qt.id)}
											<option value={qt.id}>{qt.name}</option>
										{/each}
									</optgroup>
								{:else}
									<optgroup label="Card Quests">
										{#each app.rules.cardQuestTypes ?? [] as qt (qt.id)}
											<option value={qt.id}>{qt.name}</option>
										{/each}
									</optgroup>
								{/if}
							</select>
						</div>
					{/if}

					<div>
						<label for="quest-next-due" class="field-label-blue">New Due Date</label>
						<input
							id="quest-next-due"
							type="date"
							class="input-blue"
							value={isCooldown ? cooldownDueDate : nextDueDate}
							oninput={(e) => {
								if (isCooldown) cooldownDueDate = e.currentTarget.value;
								else nextDueDate = e.currentTarget.value;
							}}
						/>
					</div>
				</div>
			{/if}

			<!-- Notes Field -->
			<div>
				<label for="quest-note" class="field-label">Quest Note</label>
				<textarea
					id="quest-note"
					class="note-input"
					placeholder="Describe the outcome..."
					bind:value={note}
				></textarea>
			</div>

			<div class="footer">
				<button onclick={() => app.closeModals()} class="cancel-btn">Cancel</button>
				<RPGButton variant={isContinue ? 'primary' : 'action'} onclick={submit}>
					{isContinue ? 'Log Progress' : 'Complete Quest'}
				</RPGButton>
			</div>
		</div>
	</div>
</Modal>

<style lang="postcss">
	.panel {
		@apply w-full max-w-lg overflow-hidden rounded-lg border-4 border-[#d4c5a9] bg-[#fdfbf7] shadow-2xl;
	}
	.panel-header {
		@apply flex items-center justify-between border-b border-[#d4c5a9] p-4 text-white;
	}
	.panel-header.complete {
		@apply bg-[#14532d];
	}
	.panel-header.continue {
		@apply bg-[#1e3a8a];
	}
	.panel-title {
		@apply flex items-center gap-2 font-serif text-xl font-bold;
	}
	.panel-body {
		@apply space-y-6 p-6;
	}

	.field-label {
		@apply mb-1 block text-xs font-bold uppercase text-stone-500;
	}
	.field-label-blue {
		@apply mb-1 block text-xs font-bold uppercase text-blue-500;
	}

	.completion-select {
		@apply w-full rounded border-2 border-[#d4c5a9] bg-white p-2 font-bold text-[#2c241b];
	}

	.commission {
		@apply relative;
	}
	.commission-input {
		@apply w-full rounded border-2 border-[#d4c5a9] bg-white p-2 pl-9 font-mono;
	}

	.continue-box {
		@apply space-y-4 rounded border-2 border-blue-200 bg-blue-50 p-4;
	}
	.continue-title {
		@apply border-b border-blue-200 pb-1 text-sm font-bold text-blue-900;
	}
	.cooldown-check {
		@apply flex items-center gap-2 font-bold text-blue-800;
	}
	.input-blue {
		@apply w-full rounded border border-blue-300 bg-white p-2;
	}

	.note-input {
		@apply h-20 w-full rounded border border-[#d4c5a9] bg-white p-2 text-sm;
	}

	.footer {
		@apply flex justify-end gap-2 border-t border-[#d4c5a9] pt-4;
	}
	.cancel-btn {
		@apply px-4 py-2 font-bold text-stone-500 hover:text-stone-800;
	}
</style>
