<script lang="ts">
	// Rules screen — matches the React prototype's RulesView. Two-column grid of
	// editable RuleSection cards (one per rule family) plus a Level Progression
	// table. All mutations go through the `app` store; the shell provides the
	// parchment background and the `p-6 max-w-7xl mx-auto` container.
	import { app } from '$lib/state.svelte';
	import RuleSection from '$lib/components/RuleSection.svelte';
</script>

<div class="rules-page">
	<div class="title-col">
		<h2 class="page-title">Game Rules & Configuration</h2>
	</div>

	<div class="col">
		<RuleSection
			title="General Rules"
			dataKey="general"
			rules={app.rules.general}
			unit=" "
			valueField="value"
			onAdd={() => app.addRule('general')}
			onUpdate={(id, field, val) => app.updateRule('general', id, field, val)}
			onDelete={(id) => app.deleteRule('general', id)}
		/>
		<RuleSection
			title="Card Quest Types"
			dataKey="cardQuestTypes"
			rules={app.rules.cardQuestTypes}
			unit="Exp"
			valueField="exp"
			onAdd={() => app.addRule('cardQuestTypes')}
			onUpdate={(id, field, val) => app.updateRule('cardQuestTypes', id, field, val)}
			onDelete={(id) => app.deleteRule('cardQuestTypes', id)}
		/>
		<RuleSection
			title="Standalone Quest Types"
			dataKey="standaloneQuestTypes"
			rules={app.rules.standaloneQuestTypes}
			unit="Exp"
			valueField="exp"
			onAdd={() => app.addRule('standaloneQuestTypes')}
			onUpdate={(id, field, val) => app.updateRule('standaloneQuestTypes', id, field, val)}
			onDelete={(id) => app.deleteRule('standaloneQuestTypes', id)}
		/>
	</div>

	<div class="col">
		<RuleSection
			title="Completion Types"
			dataKey="completionTypes"
			rules={app.rules.completionTypes}
			unit="%"
			valueField="bonusPercent"
			onAdd={() => app.addRule('completionTypes')}
			onUpdate={(id, field, val) => app.updateRule('completionTypes', id, field, val)}
			onDelete={(id) => app.deleteRule('completionTypes', id)}
		/>
		<RuleSection
			title="Multipliers"
			dataKey="multipliers"
			rules={app.rules.multipliers}
			unit="%"
			valueField="bonusPercent"
			onAdd={() => app.addRule('multipliers')}
			onUpdate={(id, field, val) => app.updateRule('multipliers', id, field, val)}
			onDelete={(id) => app.deleteRule('multipliers', id)}
		/>
		<RuleSection
			title="Bonuses"
			dataKey="bonuses"
			rules={app.rules.bonuses}
			unit="Exp"
			valueField="reward"
			onAdd={() => app.addRule('bonuses')}
			onUpdate={(id, field, val) => app.updateRule('bonuses', id, field, val)}
			onDelete={(id) => app.deleteRule('bonuses', id)}
		/>

		<!-- Level Table (Custom) -->
		<div class="level-panel">
			<div class="level-head">
				<h3 class="level-title">Level Progression</h3>
				<button onclick={() => app.openModal('levelTable')} class="edit-btn">Edit Table</button>
			</div>
			<div class="level-body">
				<table class="level-table">
					<thead class="level-head-row">
						<tr><th>Lvl</th><th>Title</th><th>Exp</th><th>Reward</th></tr>
					</thead>
					<tbody>
						{#each app.rules.levels as l (l.id)}
							<tr class="level-row">
								<td class="cell-level">{l.level}</td>
								<td class="cell-title">{l.title}</td>
								<td class="cell-exp">{l.exp}</td>
								<td class="cell-reward">{l.reward}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>
</div>

<style>
	.rules-page {
		@apply grid grid-cols-2 gap-8 pb-20;
	}
	.title-col {
		@apply col-span-2;
	}
	.page-title {
		@apply text-3xl font-serif font-bold text-[#2c241b] mb-4 border-b-4 border-[#d4c5a9] pb-2;
	}
	.col {
		@apply col-span-1;
	}
	/* Replicate Tailwind's `space-y-6` across the RuleSection children. @apply
	   can't reach them (they render in a different component's style scope), so
	   target them with :global — margin-top 1.5rem + margin-bottom 0 on every
	   section after the first, exactly like the original utility did. */
	.col > :global(:not(:first-child)) {
		margin-top: 1.5rem;
		margin-bottom: 0;
	}

	.level-panel {
		@apply bg-[#fdfbf7] border-2 border-[#d4c5a9] rounded-xl overflow-hidden shadow-md;
	}
	.level-head {
		@apply bg-[#2c241b] text-[#f5deb3] p-3 flex justify-between items-center;
	}
	.level-title {
		@apply font-serif font-bold text-lg;
	}
	.edit-btn {
		@apply text-xs bg-[#eebb4d] text-[#2c241b] px-2 py-1 rounded font-bold hover:brightness-110;
	}
	.level-body {
		@apply p-4;
	}
	.level-table {
		@apply w-full text-sm text-left;
	}
	.level-head-row {
		@apply text-stone-500 uppercase text-xs border-b;
	}
	.level-row {
		@apply border-b border-stone-100 last:border-0;
	}
	.cell-level {
		@apply py-2 font-bold;
	}
	.cell-title {
		@apply py-2 italic;
	}
	.cell-exp {
		@apply py-2 font-mono;
	}
	.cell-reward {
		@apply py-2 text-[#8b4513];
	}
</style>
