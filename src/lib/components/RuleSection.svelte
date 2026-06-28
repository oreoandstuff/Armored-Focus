<script lang="ts">
	// Editable rule list section (SPEC §3, §7 parchment / dark-header card).
	// Presentational: parent owns the rules state and handles add/update/delete.
	import { Trash2, Plus } from '@lucide/svelte';
	import { THEME } from '$lib/theme';
	import type { RulesKey } from '$lib/core/types';

	// A rule row always has id + name; the numeric field varies by rule type
	// (value | exp | bonusPercent | reward | required) — selected via `valueField`.
	type RuleRow = { id: string; name: string; [key: string]: unknown };

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
		const v = r[valueField];
		return typeof v === 'number' ? v : Number(v) || 0;
	}
</script>

<div class="overflow-hidden rounded-lg border-2" style="border-color: {THEME.border};">
	<!-- Dark header -->
	<div
		class="flex items-center justify-between px-4 py-2"
		style="background: {THEME.headerBg}; color: {THEME.headerText};"
	>
		<h3 class="font-serif text-lg font-bold tracking-wide">{title}</h3>
		<button
			onclick={() => onAdd?.(dataKey)}
			class="flex items-center gap-1 rounded border px-2 py-1 font-serif text-sm font-bold hover:brightness-110"
			style="border-color: {THEME.goldBorder}; color: {THEME.headerText};"
		>
			<Plus size={14} /> Add
		</button>
	</div>

	<!-- Body -->
	<div style="background: {THEME.panel}; color: {THEME.text};">
		<!-- Column labels -->
		<div
			class="grid grid-cols-[1fr_8rem_auto] gap-2 px-4 py-1 text-xs font-bold uppercase tracking-wide opacity-70"
		>
			<span>{columns[0] ?? 'Name'}</span>
			<span>{columns[1] ?? 'Value'}</span>
			<span class="sr-only">Actions</span>
		</div>

		<div class="flex flex-col">
			{#each rules as r (r.id)}
				<div class="grid grid-cols-[1fr_8rem_auto] items-center gap-2 px-4 py-1.5">
					<input
						type="text"
						value={r.name}
						oninput={(e) => onUpdate?.(r.id, 'name', e.currentTarget.value)}
						class="rounded border px-2 py-1 text-sm"
						style="background: {THEME.inputBg}; border-color: {THEME.border}; color: {THEME.text};"
					/>
					<div class="flex items-center gap-1">
						<input
							type="number"
							value={numValue(r)}
							oninput={(e) =>
								onUpdate?.(r.id, valueField, e.currentTarget.value === '' ? 0 : Number(e.currentTarget.value))}
							class="w-20 rounded border px-2 py-1 text-right font-mono text-sm"
							style="background: {THEME.inputBg}; border-color: {THEME.border}; color: {THEME.text};"
						/>
						{#if unit}
							<span class="text-xs opacity-70">{unit}</span>
						{/if}
					</div>
					<button
						onclick={() => onDelete?.(r.id)}
						aria-label="Delete {r.name}"
						class="rounded p-1 text-red-700 hover:bg-red-100"
					>
						<Trash2 size={16} />
					</button>
				</div>
			{:else}
				<p class="px-4 py-3 text-sm italic opacity-60">No rules yet.</p>
			{/each}
		</div>
	</div>
</div>
