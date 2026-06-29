<script lang="ts">
	// Editable rule list section (matches the React prototype's RuleSection).
	// Presentational: parent owns the rules state and handles add/update/delete.
	import { Trash2, Plus } from '@lucide/svelte';
	import type { RulesKey } from '$lib/core/types';

	// A rule row always has id + name; the numeric field varies by rule type
	// (value | exp | bonusPercent | reward) — read dynamically via `valueField`.
	type RuleRow = { id: string; name: string };

	let {
		title,
		dataKey,
		rules = [],
		columns = ['Name', 'Value'],
		unit = '',
		valueField = 'value',
		onAdd,
		onUpdate,
		onDelete
	}: {
		title: string;
		dataKey: RulesKey;
		rules?: RuleRow[];
		columns?: string[];
		unit?: string;
		valueField?: string;
		onAdd?: (dataKey: RulesKey) => void;
		onUpdate?: (id: string, field: string, value: string | number) => void;
		onDelete?: (id: string) => void;
	} = $props();

	function numValue(r: RuleRow): number {
		const v = (r as Record<string, unknown>)[valueField];
		return typeof v === 'number' ? v : Number(v) || 0;
	}
</script>

<div class="section">
	<div class="section-head">
		<h3 class="section-title">{title}</h3>
		<button onclick={() => onAdd?.(dataKey)} class="add-btn">
			<Plus size={12} /> Add
		</button>
	</div>
	<div class="section-body">
		{#each rules as item (item.id)}
			<div class="rule-row">
				<input
					class="name-input"
					value={item.name}
					oninput={(e) => onUpdate?.(item.id, 'name', e.currentTarget.value)}
				/>
				{#if columns.includes('Value')}
					<div class="value-cell">
						<input
							type="number"
							class="value-input"
							value={numValue(item)}
							oninput={(e) => onUpdate?.(item.id, valueField, parseFloat(e.currentTarget.value))}
						/>
						<span class="unit">{unit || (valueField === 'exp' ? 'Exp' : '%')}</span>
					</div>
				{/if}
				<button onclick={() => onDelete?.(item.id)} class="del-btn">
					<Trash2 size={16} />
				</button>
			</div>
		{/each}
	</div>
</div>

<style>
	.section {
		@apply mb-8 bg-[#fdfbf7] border-2 border-[#d4c5a9] rounded-xl overflow-hidden shadow-md;
	}
	.section-head {
		@apply bg-[#2c241b] text-[#f5deb3] p-3 flex justify-between items-center;
	}
	.section-title {
		@apply font-serif font-bold text-lg;
	}
	.add-btn {
		@apply text-xs bg-[#eebb4d] text-[#2c241b] px-2 py-1 rounded font-bold hover:brightness-110 flex items-center gap-1;
	}
	.section-body {
		@apply p-4;
	}
	.rule-row {
		@apply flex items-center gap-4 mb-2 last:mb-0;
	}
	.name-input {
		@apply flex-1 border-b border-[#d4c5a9] bg-transparent py-1 px-2 focus:outline-none focus:border-[#8b4513];
	}
	.value-cell {
		@apply flex items-center w-32;
	}
	.value-input {
		@apply w-full border border-[#d4c5a9] rounded py-1 px-2 text-right;
	}
	.unit {
		@apply ml-2 text-xs font-bold text-stone-500 w-8;
	}
	.del-btn {
		@apply text-stone-400 hover:text-red-700;
	}
</style>
