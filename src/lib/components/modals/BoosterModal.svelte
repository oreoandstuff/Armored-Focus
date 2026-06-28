<script lang="ts">
	// Booster Pack modal (SPEC §2.5.2, §8) — CSV import wizard.
	// Paste rows, choose a column count, map each column to a field type, import.
	import { X } from '@lucide/svelte';
	import { app } from '$lib/state.svelte';
	import { THEME } from '$lib/theme';
	import { BOOSTER_COLUMN_TYPES } from '$lib/core/rules';
	import RPGButton from '$lib/components/RPGButton.svelte';

	const inputStyle = `background: ${THEME.inputBg}; border-color: ${THEME.border}; color: ${THEME.text};`;
	const DEFAULTS = ['Name', 'Phone', 'Address'];

	let rawText = $state('');
	let columnCount = $state(3);
	let columns = $state<string[]>([...DEFAULTS]);

	$effect(() => {
		if (app.modals.boosterPack) {
			rawText = '';
			columnCount = 3;
			columns = [...DEFAULTS];
		}
	});

	// Resize the column-mapping array whenever the count changes, keeping
	// existing selections and defaulting new columns to 'Ignore'.
	function setCount(n: number) {
		const count = Math.max(1, Math.min(20, Math.floor(n) || 1));
		columnCount = count;
		const next = columns.slice(0, count);
		while (next.length < count) next.push('Ignore');
		columns = next;
	}

	// Live preview of the first non-empty parsed row.
	const previewRow = $derived.by(() => {
		const line = rawText.split('\n').map((l) => l.trim()).find((l) => l !== '');
		if (!line) return [];
		const fields = line.split(',').map((f) => f.trim());
		return columns.map((type, i) => ({ type, value: fields[i] ?? '' }));
	});

	function importPack() {
		app.importBooster(rawText, columns); // closes the modal itself
	}
</script>

{#if app.modals.boosterPack}
	<div
		class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur"
		role="dialog"
		aria-modal="true"
		aria-label="Booster Pack Import"
	>
		<div
			class="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border-2 shadow-2xl"
			style="background: {THEME.panel}; border-color: {THEME.border};"
		>
			<div
				class="flex items-center justify-between px-5 py-3"
				style="background: {THEME.headerBg}; color: {THEME.headerText};"
			>
				<h2 class="font-serif text-xl font-bold tracking-wide">Open a Booster Pack</h2>
				<button onclick={() => app.closeModals()} aria-label="Close" class="hover:brightness-125">
					<X size={22} />
				</button>
			</div>

			<div class="overflow-y-auto p-5" style="color: {THEME.text};">
				<label for="booster-raw" class="mb-1 block text-sm font-bold">Paste rows (one card per line, comma-separated)</label>
				<textarea
					id="booster-raw"
					rows="5"
					class="w-full rounded border px-2 py-1 font-mono text-sm"
					style={inputStyle}
					placeholder="Andrew Leui, 555-0199, 123 Maple Dr"
					bind:value={rawText}
				></textarea>

				<label for="booster-cols" class="mb-1 mt-4 block text-sm font-bold">Number of columns</label>
				<input
					id="booster-cols"
					type="number"
					min="1"
					max="20"
					class="w-24 rounded border px-2 py-1"
					style={inputStyle}
					value={columnCount}
					oninput={(e) => setCount(Number(e.currentTarget.value))}
				/>

				<p class="mb-2 mt-4 text-sm font-bold">Map each column</p>
				<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
					{#each columns as _, i (i)}
						<label class="flex items-center gap-2 text-sm">
							<span class="w-16 shrink-0 opacity-70">Col {i + 1}</span>
							<select class="flex-1 rounded border px-2 py-1" style={inputStyle} bind:value={columns[i]}>
								{#each BOOSTER_COLUMN_TYPES as t}
									<option value={t}>{t}</option>
								{/each}
							</select>
						</label>
					{/each}
				</div>

				{#if previewRow.length > 0}
					<p class="mb-1 mt-4 text-sm font-bold">Preview (first row)</p>
					<div
						class="rounded border p-3 text-sm"
						style="background: {THEME.inputBg}; border-color: {THEME.border};"
					>
						{#each previewRow as cell}
							{#if cell.type !== 'Ignore'}
								<div><span class="font-bold">{cell.type}:</span> {cell.value || '—'}</div>
							{/if}
						{/each}
					</div>
				{/if}
			</div>

			<div class="flex justify-end gap-2 border-t px-5 py-3" style="border-color: {THEME.border};">
				<RPGButton variant="primary" onclick={() => app.closeModals()}>Cancel</RPGButton>
				<RPGButton variant="action" disabled={rawText.trim() === ''} onclick={importPack}>Import</RPGButton>
			</div>
		</div>
	</div>
{/if}
