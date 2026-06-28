<script lang="ts">
	// Level Table modal (SPEC §2.5.3, §4.1) — edit level progression and the
	// universal level rewards. Reads/writes app.rules via the rule editor API.
	import { X, Plus, Trash2 } from '@lucide/svelte';
	import { app } from '$lib/state.svelte';
	import { THEME } from '$lib/theme';
	import RPGButton from '$lib/components/RPGButton.svelte';

	const inputStyle = `background: ${THEME.inputBg}; border-color: ${THEME.border}; color: ${THEME.text};`;
</script>

{#if app.modals.levelTable}
	<div
		class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur"
		role="dialog"
		aria-modal="true"
		aria-label="Level Table"
	>
		<div
			class="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border-2 shadow-2xl"
			style="background: {THEME.panel}; border-color: {THEME.border};"
		>
			<div
				class="flex items-center justify-between px-5 py-3"
				style="background: {THEME.headerBg}; color: {THEME.headerText};"
			>
				<h2 class="font-serif text-xl font-bold tracking-wide">Level Progression</h2>
				<button onclick={() => app.closeModals()} aria-label="Close" class="hover:brightness-125">
					<X size={22} />
				</button>
			</div>

			<div class="overflow-y-auto p-5" style="color: {THEME.text};">
				<!-- Levels table -->
				<div class="mb-2 flex items-center justify-between">
					<h3 class="font-serif text-lg font-bold" style="color: {THEME.accent};">Levels</h3>
					<button
						onclick={() => app.addRule('levels')}
						class="flex items-center gap-1 rounded border px-2 py-1 font-serif text-sm font-bold hover:brightness-110"
						style="border-color: {THEME.goldBorder}; color: {THEME.accent};"
					>
						<Plus size={14} /> Add Level
					</button>
				</div>

				<div
					class="grid grid-cols-[4rem_6rem_1fr_1fr_auto] gap-2 px-1 pb-1 text-xs font-bold uppercase tracking-wide opacity-70"
				>
					<span>Level</span>
					<span>Exp</span>
					<span>Title</span>
					<span>Reward</span>
					<span class="sr-only">Actions</span>
				</div>

				{#each app.rules.levels ?? [] as lvl (lvl.id)}
					<div class="grid grid-cols-[4rem_6rem_1fr_1fr_auto] items-center gap-2 px-1 py-1">
						<input
							type="number"
							class="w-full rounded border px-2 py-1 text-right font-mono text-sm"
							style={inputStyle}
							value={lvl.level}
							oninput={(e) =>
								app.updateRule('levels', lvl.id, 'level', e.currentTarget.value === '' ? 0 : Number(e.currentTarget.value))}
						/>
						<input
							type="number"
							class="w-full rounded border px-2 py-1 text-right font-mono text-sm"
							style={inputStyle}
							value={lvl.exp}
							oninput={(e) =>
								app.updateRule('levels', lvl.id, 'exp', e.currentTarget.value === '' ? 0 : Number(e.currentTarget.value))}
						/>
						<input
							type="text"
							class="w-full rounded border px-2 py-1 text-sm"
							style={inputStyle}
							value={lvl.title}
							oninput={(e) => app.updateRule('levels', lvl.id, 'title', e.currentTarget.value)}
						/>
						<input
							type="text"
							class="w-full rounded border px-2 py-1 text-sm"
							style={inputStyle}
							value={lvl.reward}
							oninput={(e) => app.updateRule('levels', lvl.id, 'reward', e.currentTarget.value)}
						/>
						<button
							onclick={() => app.deleteRule('levels', lvl.id)}
							aria-label="Delete level {lvl.level}"
							class="rounded p-1 text-red-700 hover:bg-red-100"
						>
							<Trash2 size={16} />
						</button>
					</div>
				{/each}

				<!-- Universal rewards -->
				<div class="mb-2 mt-6 flex items-center justify-between">
					<h3 class="font-serif text-lg font-bold" style="color: {THEME.accent};">Universal Level Rewards</h3>
					<button
						onclick={() => app.addRule('universalLevelRewards')}
						class="flex items-center gap-1 rounded border px-2 py-1 font-serif text-sm font-bold hover:brightness-110"
						style="border-color: {THEME.goldBorder}; color: {THEME.accent};"
					>
						<Plus size={14} /> Add Reward
					</button>
				</div>

				{#each app.rules.universalLevelRewards ?? [] as rew (rew.id)}
					<div class="grid grid-cols-[1fr_auto] items-center gap-2 px-1 py-1">
						<input
							type="text"
							class="w-full rounded border px-2 py-1 text-sm"
							style={inputStyle}
							value={rew.name}
							oninput={(e) => app.updateRule('universalLevelRewards', rew.id, 'name', e.currentTarget.value)}
						/>
						<button
							onclick={() => app.deleteRule('universalLevelRewards', rew.id)}
							aria-label="Delete reward {rew.name}"
							class="rounded p-1 text-red-700 hover:bg-red-100"
						>
							<Trash2 size={16} />
						</button>
					</div>
				{/each}
			</div>

			<div class="flex justify-end gap-2 border-t px-5 py-3" style="border-color: {THEME.border};">
				<RPGButton variant="primary" onclick={() => app.closeModals()}>Done</RPGButton>
			</div>
		</div>
	</div>
{/if}
