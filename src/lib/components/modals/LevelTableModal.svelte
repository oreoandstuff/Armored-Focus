<script lang="ts">
	// Level Table modal (SPEC §2.5.3, §4.1) — edit level progression and the
	// universal level rewards. Reads/writes app.rules via the rule editor API.
	// Markup matches the React prototype's "Level Progression" modal 1:1.
	import { X, Trash2 } from '@lucide/svelte';
	import { app } from '$lib/state.svelte';
</script>

{#if app.modals.levelTable}
	<div class="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] z-50">
		<div
			class="bg-[#fdfbf7] p-8 rounded-lg shadow-2xl border-4 border-[#d4c5a9] max-w-2xl w-full max-h-[90vh] overflow-y-auto"
		>
			<div class="flex justify-between items-center mb-6 border-b border-[#d4c5a9] pb-4">
				<h3 class="font-serif font-bold text-2xl text-[#2c241b]">Level Progression</h3>
				<button onclick={() => app.closeModals()} aria-label="Close"><X /></button>
			</div>

			<!-- Universal Rewards -->
			<div class="mb-8 bg-[#e8e4d9] p-4 rounded border border-[#d4c5a9]">
				<div class="flex justify-between items-center mb-2">
					<h4 class="font-bold text-[#8b4513] uppercase text-sm">Universal Level Up Rewards</h4>
					<button
						onclick={() => app.addRule('universalLevelRewards')}
						class="text-xs bg-[#2c241b] text-[#f5deb3] px-2 py-1 rounded">+ Add</button
					>
				</div>
				<div class="space-y-2">
					{#each app.rules.universalLevelRewards ?? [] as r (r.id)}
						<div
							class="flex justify-between items-center bg-white p-2 rounded border border-[#d4c5a9]"
						>
							<span class="text-sm font-bold text-[#2c241b]">{r.name}</span>
							<button
								onclick={() => app.deleteRule('universalLevelRewards', r.id)}
								aria-label="Delete reward"
								class="text-red-800"><Trash2 size={14} /></button
							>
						</div>
					{/each}
				</div>
			</div>

			<table class="w-full text-sm text-left mb-4">
				<thead class="bg-[#e8e4d9] font-bold">
					<tr>
						<th class="p-2">Level</th>
						<th class="p-2">Title</th>
						<th class="p-2">Exp Required</th>
						<th class="p-2">Reward</th>
						<th class="p-2"></th>
					</tr>
				</thead>
				<tbody>
					{#each app.rules.levels ?? [] as l (l.id)}
						<tr class="border-b border-stone-200">
							<td class="p-2 font-bold">{l.level}</td>
							<td class="p-2">
								<input
									class="w-full bg-transparent border-b border-stone-300 focus:outline-none italic text-[#5d4037]"
									aria-label="Level {l.level} title"
									value={l.title}
									oninput={(e) => app.updateRule('levels', l.id, 'title', e.currentTarget.value)}
								/>
							</td>
							<td class="p-2">
								<input
									class="w-16 bg-transparent border-b border-stone-300 focus:outline-none"
									aria-label="Level {l.level} exp required"
									value={l.exp}
									oninput={(e) =>
										app.updateRule(
											'levels',
											l.id,
											'exp',
											e.currentTarget.value === '' ? 0 : Number(e.currentTarget.value)
										)}
								/>
							</td>
							<td class="p-2">
								<input
									class="w-full bg-transparent border-b border-stone-300 focus:outline-none font-bold text-[#8b4513]"
									aria-label="Level {l.level} reward"
									value={l.reward}
									oninput={(e) => app.updateRule('levels', l.id, 'reward', e.currentTarget.value)}
								/>
							</td>
							<td class="p-2 text-right">
								<button
									onclick={() => app.deleteRule('levels', l.id)}
									aria-label="Delete level {l.level}"
									class="text-stone-400 hover:text-red-800"><Trash2 size={14} /></button
								>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>

			<button
				onclick={() => app.addRule('levels')}
				class="w-full py-2 bg-[#2c241b] text-[#f5deb3] rounded font-bold hover:bg-[#3e3226]"
				>+ Add Level</button
			>
		</div>
	</div>
{/if}
