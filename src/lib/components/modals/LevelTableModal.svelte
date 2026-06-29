<script lang="ts">
	// Level Table modal (SPEC §2.5.3, §4.1) — edit level progression and the
	// universal level rewards. Reads/writes app.rules via the rule editor API.
	// Markup matches the React prototype's "Level Progression" modal 1:1.
	import { X, Trash2 } from '@lucide/svelte';
	import { app } from '$lib/state.svelte';
	import Modal from '$lib/components/Modal.svelte';
</script>

<Modal open={app.modals.levelTable} ariaLabel="Level Progression" blur={false}>
	<div class="panel">
		<header class="modal-head">
			<h3 class="modal-title">Level Progression</h3>
			<button onclick={() => app.closeModals()} aria-label="Close"><X /></button>
		</header>

		<!-- Universal Rewards -->
		<div class="rewards-box">
			<div class="rewards-head">
				<h4 class="rewards-title">Universal Level Up Rewards</h4>
				<button class="add-btn" onclick={() => app.addRule('universalLevelRewards')}>+ Add</button>
			</div>
			<div class="rewards-list">
				{#each app.rules.universalLevelRewards ?? [] as r (r.id)}
					<div class="reward-row">
						<span class="reward-name">{r.name}</span>
						<button
							class="reward-del"
							onclick={() => app.deleteRule('universalLevelRewards', r.id)}
							aria-label="Delete reward"><Trash2 size={14} /></button
						>
					</div>
				{/each}
			</div>
		</div>

		<table class="level-table">
			<thead class="table-head">
				<tr>
					<th>Level</th>
					<th>Title</th>
					<th>Exp Required</th>
					<th>Reward</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each app.rules.levels ?? [] as l (l.id)}
					<tr class="level-row">
						<td class="cell-level">{l.level}</td>
						<td>
							<input
								class="title-input"
								aria-label="Level {l.level} title"
								value={l.title}
								oninput={(e) => app.updateRule('levels', l.id, 'title', e.currentTarget.value)}
							/>
						</td>
						<td>
							<input
								class="exp-input"
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
						<td>
							<input
								class="reward-input"
								aria-label="Level {l.level} reward"
								value={l.reward}
								oninput={(e) => app.updateRule('levels', l.id, 'reward', e.currentTarget.value)}
							/>
						</td>
						<td class="cell-action">
							<button
								class="del-btn"
								onclick={() => app.deleteRule('levels', l.id)}
								aria-label="Delete level {l.level}"><Trash2 size={14} /></button
							>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>

		<button class="add-level" onclick={() => app.addRule('levels')}>+ Add Level</button>
	</div>
</Modal>

<style lang="postcss">
	.panel {
		@apply w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border-4 border-[#d4c5a9] bg-[#fdfbf7] p-8 shadow-2xl;
	}

	.modal-head {
		@apply mb-6 flex items-center justify-between border-b border-[#d4c5a9] pb-4;
	}
	.modal-title {
		@apply font-serif text-2xl font-bold text-[#2c241b];
	}

	.rewards-box {
		@apply mb-8 rounded border border-[#d4c5a9] bg-[#e8e4d9] p-4;
	}
	.rewards-head {
		@apply mb-2 flex items-center justify-between;
	}
	.rewards-title {
		@apply text-sm font-bold uppercase text-[#8b4513];
	}
	.add-btn {
		@apply rounded bg-[#2c241b] px-2 py-1 text-xs text-[#f5deb3];
	}
	.rewards-list {
		@apply space-y-2;
	}
	.reward-row {
		@apply flex items-center justify-between rounded border border-[#d4c5a9] bg-white p-2;
	}
	.reward-name {
		@apply text-sm font-bold text-[#2c241b];
	}
	.reward-del {
		@apply text-red-800;
	}

	.level-table {
		@apply mb-4 w-full text-left text-sm;
	}
	.table-head {
		@apply bg-[#e8e4d9] font-bold;
	}
	.level-table th {
		@apply p-2;
	}
	.level-table td {
		@apply p-2;
	}
	.level-row {
		@apply border-b border-stone-200;
	}
	.cell-level {
		@apply font-bold;
	}
	.cell-action {
		@apply text-right;
	}

	.title-input {
		@apply w-full border-b border-stone-300 bg-transparent italic text-[#5d4037] focus:outline-none;
	}
	.exp-input {
		@apply w-16 border-b border-stone-300 bg-transparent focus:outline-none;
	}
	.reward-input {
		@apply w-full border-b border-stone-300 bg-transparent font-bold text-[#8b4513] focus:outline-none;
	}

	.del-btn {
		@apply text-stone-400 hover:text-red-800;
	}
	.add-level {
		@apply w-full rounded bg-[#2c241b] py-2 font-bold text-[#f5deb3] hover:bg-[#3e3226];
	}
</style>
