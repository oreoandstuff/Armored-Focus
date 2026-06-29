<script lang="ts">
	// Booster Pack modal (SPEC §2.5.2, §8) — CSV import wizard.
	// Markup mirrors the React prototype's Booster Pack Modal (App.jsx 1865–1969):
	// define the CSV structure (column count + per-column type), paste/drop rows,
	// then import via the `app` store.
	import { X, Database, FileText, FilePlus, Upload } from '@lucide/svelte';
	import { app } from '$lib/state.svelte';
	import { BOOSTER_COLUMN_TYPES } from '$lib/core/rules';
	import RPGButton from '$lib/components/RPGButton.svelte';

	const DEFAULTS = ['Name', 'Phone', 'Address'];

	let rawText = $state('');
	let colCount = $state(3);
	let columns = $state<string[]>([...DEFAULTS]);
	let fileInput = $state<HTMLInputElement>();

	$effect(() => {
		if (app.modals.boosterPack) {
			rawText = '';
			colCount = 3;
			columns = [...DEFAULTS];
		}
	});

	// Resize the column-mapping array, keeping existing selections and
	// defaulting any new columns to 'Ignore'.
	function updateColCount(value: string | number) {
		const count = Math.max(1, Math.min(20, Math.floor(Number(value)) || 1));
		colCount = count;
		const next = columns.slice(0, count);
		while (next.length < count) next.push('Ignore');
		columns = next;
	}

	function readFile(file: File) {
		const reader = new FileReader();
		reader.onload = () => {
			rawText = String(reader.result ?? '');
		};
		reader.readAsText(file);
	}

	function handleFileUpload(e: Event) {
		const file = (e.currentTarget as HTMLInputElement).files?.[0];
		if (file) readFile(file);
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		const file = e.dataTransfer?.files?.[0];
		if (file) readFile(file);
	}

	function processBoosterImport() {
		app.importBooster(rawText, columns); // closes the modal itself
	}
</script>

{#if app.modals.boosterPack}
	<div
		class="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]"
		role="dialog"
		aria-modal="true"
		aria-label="Open Booster Pack"
	>
		<div
			class="bg-[#fdfbf7] rounded-lg shadow-xl border-4 border-[#d4c5a9] w-[90%] max-w-6xl flex flex-col max-h-[90vh]"
		>
			<div
				class="bg-[#2c241b] text-[#f5deb3] p-4 border-b border-[#d4c5a9] flex justify-between items-center"
			>
				<h3 class="font-serif font-bold text-xl">Open Booster Pack (Import)</h3>
				<button onclick={() => app.closeModals()} class="hover:text-white" aria-label="Close"><X /></button>
			</div>

			<div class="p-6 overflow-y-auto flex-1">
				<!-- Section 1: Define Structure -->
				<div class="mb-6 border-b border-[#d4c5a9] pb-6">
					<h4 class="font-bold text-[#8b4513] mb-4 flex items-center gap-2">
						<Database size={18} /> 1. Define CSV Structure
					</h4>

					<div class="flex items-center gap-4 mb-4">
						<label class="text-sm font-bold text-stone-600" for="booster-colcount"
							>How many columns in your file?</label
						>
						<input
							id="booster-colcount"
							type="number"
							min="1"
							max="20"
							class="w-16 p-2 border border-[#d4c5a9] rounded text-center font-bold"
							value={colCount}
							oninput={(e) => updateColCount(e.currentTarget.value)}
						/>
					</div>

					<div class="grid grid-cols-6 gap-4">
						{#each columns as _, idx (idx)}
							<div class="bg-white p-2 rounded border border-[#d4c5a9]">
								<div class="text-[10px] font-bold text-stone-400 uppercase mb-1">Column {idx + 1}</div>
								<select
									class="w-full p-1 text-sm border-none focus:ring-0 bg-transparent font-bold text-[#2c241b]"
									aria-label="Column {idx + 1} type"
									bind:value={columns[idx]}
								>
									{#each BOOSTER_COLUMN_TYPES as type}
										<option value={type}>{type === 'Ignore' ? 'Ignore Column' : type}</option>
									{/each}
								</select>
							</div>
						{/each}
					</div>
				</div>

				<!-- Section 2: Paste Data -->
				<div>
					<h4 class="font-bold text-[#8b4513] mb-2 flex items-center gap-2">
						<FileText size={18} /> 2. Paste CSV Data
					</h4>
					<p class="text-xs text-stone-500 mb-2">Drag &amp; Drop file below.</p>

					<!-- Drag & Drop Zone -->
					<div
						class="border-2 border-dashed border-[#d4c5a9] bg-stone-50 rounded-lg p-6 mb-3 text-center cursor-pointer hover:bg-stone-100 transition-colors"
						role="button"
						tabindex="0"
						onclick={() => fileInput?.click()}
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								fileInput?.click();
							}
						}}
						ondrop={handleDrop}
						ondragover={(e) => e.preventDefault()}
					>
						<input
							type="file"
							bind:this={fileInput}
							class="hidden"
							accept=".csv,.txt"
							onchange={handleFileUpload}
						/>
						<FilePlus size={32} class="mx-auto text-stone-400 mb-2" />
						<p class="text-sm font-bold text-stone-600">Drag &amp; Drop CSV file here</p>
						<p class="text-xs text-stone-400">or click to browse computer</p>
					</div>

					<textarea
						class="w-full h-32 border border-[#d4c5a9] p-3 text-xs font-mono bg-white rounded focus:border-[#8b4513] focus:outline-none resize-none shadow-inner"
						placeholder="Example Row: Andrew Leui, 555-0199, 123 Maple Dr"
						bind:value={rawText}
					></textarea>
				</div>
			</div>

			<div class="p-4 bg-[#e8e4d9] border-t border-[#d4c5a9] flex justify-end gap-3">
				<button
					onclick={() => app.closeModals()}
					class="px-4 py-2 text-stone-600 font-bold hover:text-stone-800"
				>
					Cancel
				</button>
				<RPGButton variant="action" onclick={processBoosterImport} disabled={!rawText.trim()}>
					<Upload size={16} class="inline mr-2" /> Import Data
				</RPGButton>
			</div>
		</div>
	</div>
{/if}
