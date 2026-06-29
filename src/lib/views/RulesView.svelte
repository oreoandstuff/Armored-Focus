<script lang="ts">
	// Rules screen — matches the React prototype's RulesView. Two-column grid of
	// editable RuleSection cards (one per rule family) plus a Level Progression
	// table. All mutations go through the `app` store; the shell provides the
	// parchment background and the `p-6 max-w-7xl mx-auto` container.
	import { app } from '$lib/state.svelte';
	import RuleSection from '$lib/components/RuleSection.svelte';
</script>

<div class="grid grid-cols-2 gap-8 pb-20">
	<div class="col-span-2">
		<h2 class="text-3xl font-serif font-bold text-[#2c241b] mb-4 border-b-4 border-[#d4c5a9] pb-2">
			Game Rules & Configuration
		</h2>
	</div>

	<div class="col-span-1 space-y-6">
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

	<div class="col-span-1 space-y-6">
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
		<div class="bg-[#fdfbf7] border-2 border-[#d4c5a9] rounded-xl overflow-hidden shadow-md">
			<div class="bg-[#2c241b] text-[#f5deb3] p-3 flex justify-between items-center">
				<h3 class="font-serif font-bold text-lg">Level Progression</h3>
				<button
					onclick={() => app.openModal('levelTable')}
					class="text-xs bg-[#eebb4d] text-[#2c241b] px-2 py-1 rounded font-bold hover:brightness-110"
				>
					Edit Table
				</button>
			</div>
			<div class="p-4">
				<table class="w-full text-sm text-left">
					<thead class="text-stone-500 uppercase text-xs border-b">
						<tr><th>Lvl</th><th>Title</th><th>Exp</th><th>Reward</th></tr>
					</thead>
					<tbody>
						{#each app.rules.levels as l (l.id)}
							<tr class="border-b border-stone-100 last:border-0">
								<td class="py-2 font-bold">{l.level}</td>
								<td class="py-2 italic">{l.title}</td>
								<td class="py-2 font-mono">{l.exp}</td>
								<td class="py-2 text-[#8b4513]">{l.reward}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>
</div>
