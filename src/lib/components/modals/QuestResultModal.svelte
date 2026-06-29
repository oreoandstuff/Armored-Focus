<script lang="ts">
	// Quest Result modal (SPEC §2.5.5, §4.3/§4.4) — Complete or Continue a quest.
	// Driven by app.flowAction; visually matches the React prototype's
	// "Quest Completion / Quest Progression" modal.
	import { X, CheckCircle, ArrowRight, DollarSign } from '@lucide/svelte';
	import { app } from '$lib/state.svelte';
	import { todayISO, tomorrowISO, addDays } from '$lib/core/dates';
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

{#if app.modals.questResult}
	<div
		class="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
		aria-label="Quest Result"
	>
		<div
			class="bg-[#fdfbf7] w-full max-w-lg rounded-lg shadow-2xl border-4 border-[#d4c5a9] overflow-hidden"
		>
			<div
				class="p-4 border-b border-[#d4c5a9] flex justify-between items-center {isContinue
					? 'bg-[#1e3a8a] text-white'
					: 'bg-[#14532d] text-white'}"
			>
				<h3 class="font-serif font-bold text-xl flex items-center gap-2">
					{#if isContinue}
						<ArrowRight size={24} />
					{:else}
						<CheckCircle size={24} />
					{/if}
					{isContinue ? 'Quest Progression' : 'Quest Completion'}
				</h3>
				<button onclick={() => app.closeModals()} aria-label="Close"><X /></button>
			</div>

			<div class="p-6 space-y-6">
				<!-- 1. Completion Type -->
				<div>
					<label
						for="quest-completion-type"
						class="block text-xs font-bold text-stone-500 uppercase mb-1">Result / Completion Type</label
					>
					<select
						id="quest-completion-type"
						class="w-full p-2 border-2 border-[#d4c5a9] rounded bg-white font-bold text-[#2c241b]"
						bind:value={completionTypeId}
					>
						{#each completionTypes as ct (ct.id)}
							<option value={ct.id}>{ct.name} (+{ct.bonusPercent}%)</option>
						{/each}
					</select>
				</div>

				<!-- 2. Commission -->
				<div>
					<label for="quest-commission" class="block text-xs font-bold text-stone-500 uppercase mb-1"
						>Commission Earned</label
					>
					<div class="relative">
						<DollarSign
							class="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600"
							size={16}
						/>
						<input
							id="quest-commission"
							type="number"
							class="w-full pl-9 p-2 border-2 border-[#d4c5a9] rounded bg-white font-mono"
							bind:value={commission}
						/>
					</div>
				</div>

				<!-- 3. Continue Logic (Only if Continuing) -->
				{#if isContinue}
					<div class="bg-blue-50 p-4 rounded border-2 border-blue-200 space-y-4">
						<h4 class="font-bold text-blue-900 text-sm border-b border-blue-200 pb-1">Next Step</h4>

						<label class="flex items-center gap-2 font-bold text-blue-800">
							<input type="checkbox" bind:checked={isCooldown} />
							Put into Cooldown?
						</label>

						{#if !isCooldown}
							<div>
								<label
									for="quest-next-type"
									class="block text-xs font-bold text-blue-500 uppercase mb-1">Next Quest Type</label
								>
								<select
									id="quest-next-type"
									class="w-full p-2 border border-blue-300 rounded bg-white"
									bind:value={nextTypeId}
								>
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
							<label for="quest-next-due" class="block text-xs font-bold text-blue-500 uppercase mb-1"
								>New Due Date</label
							>
							<input
								id="quest-next-due"
								type="date"
								class="w-full p-2 border border-blue-300 rounded bg-white"
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
					<label for="quest-note" class="block text-xs font-bold text-stone-500 uppercase mb-1"
						>Quest Note</label
					>
					<textarea
						id="quest-note"
						class="w-full p-2 border border-[#d4c5a9] rounded bg-white h-20 text-sm"
						placeholder="Describe the outcome..."
						bind:value={note}
					></textarea>
				</div>

				<div class="flex justify-end gap-2 pt-4 border-t border-[#d4c5a9]">
					<button
						onclick={() => app.closeModals()}
						class="px-4 py-2 text-stone-500 font-bold hover:text-stone-800">Cancel</button
					>
					<RPGButton variant={isContinue ? 'primary' : 'action'} onclick={submit}>
						{isContinue ? 'Log Progress' : 'Complete Quest'}
					</RPGButton>
				</div>
			</div>
		</div>
	</div>
{/if}
