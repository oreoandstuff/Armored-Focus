<script lang="ts">
	// Rules screen — parchment-themed config (SPEC §2.4, §4, §7 THEME).
	// Two-column grid of editable RuleSection cards (one per rule family) plus a
	// read-only Level Progression table. All mutations go through the `app` store.
	import { app } from '$lib/state.svelte';
	import { THEME } from '$lib/theme';
	import type { RulesKey } from '$lib/core/types';
	import RuleSection from '$lib/components/RuleSection.svelte';
	import RPGButton from '$lib/components/RPGButton.svelte';

	const rules = $derived(app.rules);

	// Wiring helpers shared by every RuleSection: the component calls
	// onAdd(dataKey) / onUpdate(id, field, value) / onDelete(id), and we forward
	// to the store's keyed rule actions.
	const onUpdate = (key: RulesKey) => (id: string, field: string, value: string | number) =>
		app.updateRule(key, id, field, value);
	const onDelete = (key: RulesKey) => (id: string) => app.deleteRule(key, id);

	const levels = $derived(rules.levels ?? []);
</script>

<div class="min-h-full" style="background: {THEME.bg}; color: {THEME.text};">
	<div class="mx-auto max-w-7xl p-6">
		<!-- Header -->
		<header class="mb-6 text-center">
			<h1
				class="font-serif text-4xl font-bold tracking-wide"
				style="color: {THEME.accent};"
			>
				The Sacred Rules
			</h1>
			<p class="mt-1 font-serif text-sm italic opacity-70">
				Tune the laws that govern Exp, quests, and bonuses.
			</p>
		</header>

		<!-- Two-column responsive grid of editable rule families -->
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			<RuleSection
				title="General"
				dataKey="general"
				rules={rules.general}
				columns={['Name', 'Exp']}
				unit="Exp"
				valueField="value"
				onAdd={() => app.addRule('general')}
				onUpdate={onUpdate('general')}
				onDelete={onDelete('general')}
			/>

			<RuleSection
				title="Card Quest Types"
				dataKey="cardQuestTypes"
				rules={rules.cardQuestTypes}
				columns={['Quest', 'Exp']}
				unit="Exp"
				valueField="exp"
				onAdd={() => app.addRule('cardQuestTypes')}
				onUpdate={onUpdate('cardQuestTypes')}
				onDelete={onDelete('cardQuestTypes')}
			/>

			<RuleSection
				title="Standalone Quest Types"
				dataKey="standaloneQuestTypes"
				rules={rules.standaloneQuestTypes}
				columns={['Quest', 'Exp']}
				unit="Exp"
				valueField="exp"
				onAdd={() => app.addRule('standaloneQuestTypes')}
				onUpdate={onUpdate('standaloneQuestTypes')}
				onDelete={onDelete('standaloneQuestTypes')}
			/>

			<RuleSection
				title="Completion Types"
				dataKey="completionTypes"
				rules={rules.completionTypes}
				columns={['Outcome', 'Bonus']}
				unit="%"
				valueField="bonusPercent"
				onAdd={() => app.addRule('completionTypes')}
				onUpdate={onUpdate('completionTypes')}
				onDelete={onDelete('completionTypes')}
			/>

			<RuleSection
				title="Multipliers"
				dataKey="multipliers"
				rules={rules.multipliers}
				columns={['Multiplier', 'Bonus']}
				unit="%"
				valueField="bonusPercent"
				onAdd={() => app.addRule('multipliers')}
				onUpdate={onUpdate('multipliers')}
				onDelete={onDelete('multipliers')}
			/>

			<RuleSection
				title="Bonuses"
				dataKey="bonuses"
				rules={rules.bonuses}
				columns={['Bonus', 'Reward']}
				unit="Exp"
				valueField="reward"
				onAdd={() => app.addRule('bonuses')}
				onUpdate={onUpdate('bonuses')}
				onDelete={onDelete('bonuses')}
			/>
		</div>

		<!-- Level Progression (read-only table) -->
		<section
			class="mt-6 overflow-hidden rounded-lg border-2"
			style="border-color: {THEME.border};"
		>
			<div
				class="flex items-center justify-between px-4 py-2"
				style="background: {THEME.headerBg}; color: {THEME.headerText};"
			>
				<h3 class="font-serif text-lg font-bold tracking-wide">Level Progression</h3>
				<RPGButton variant="gold" onclick={() => app.openModal('levelTable')}>
					Edit Table
				</RPGButton>
			</div>

			<div style="background: {THEME.panel}; color: {THEME.text};">
				<table class="w-full border-collapse text-sm">
					<thead>
						<tr class="text-xs font-bold uppercase tracking-wide opacity-70">
							<th class="px-4 py-2 text-left">Level</th>
							<th class="px-4 py-2 text-right">Exp</th>
							<th class="px-4 py-2 text-left">Title</th>
							<th class="px-4 py-2 text-left">Reward</th>
						</tr>
					</thead>
					<tbody>
						{#each levels as lvl (lvl.id)}
							<tr class="border-t" style="border-color: {THEME.border};">
								<td class="px-4 py-2 font-mono">{lvl.level}</td>
								<td class="px-4 py-2 text-right font-mono">{lvl.exp}</td>
								<td class="px-4 py-2 font-serif font-bold">{lvl.title}</td>
								<td class="px-4 py-2">{lvl.reward}</td>
							</tr>
						{:else}
							<tr>
								<td class="px-4 py-3 text-sm italic opacity-60" colspan="4">
									No levels configured.
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
	</div>
</div>
