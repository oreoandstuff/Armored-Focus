<script lang="ts">
	// Booster Pack modal (SPEC §2.5.2, §8) — CSV import wizard.
	// Markup mirrors the React prototype's Booster Pack Modal (App.jsx 1865–1969):
	// define the CSV structure (column count + per-column type), paste/drop rows,
	// then import via the `app` store.
	import { X, Database, FileText, FilePlus, Upload } from '@lucide/svelte';
	import { app } from '$lib/state.svelte';
	import { BOOSTER_COLUMN_TYPES } from '$lib/core/rules';
	import Modal from '$lib/components/Modal.svelte';
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

<Modal open={app.modals.boosterPack} ariaLabel="Open Booster Pack" blur={false}>
	<div class="panel">
		<header class="panel-header">
			<h3 class="panel-title">Open Booster Pack (Import)</h3>
			<button class="close-btn" onclick={() => app.closeModals()} aria-label="Close"><X /></button>
		</header>

		<div class="panel-body">
			<!-- Section 1: Define Structure -->
			<div class="section-structure">
				<h4 class="section-title">
					<Database size={18} /> 1. Define CSV Structure
				</h4>

				<div class="colcount-row">
					<label class="colcount-label" for="booster-colcount"
						>How many columns in your file?</label
					>
					<input
						id="booster-colcount"
						type="number"
						min="1"
						max="20"
						class="colcount-input"
						value={colCount}
						oninput={(e) => updateColCount(e.currentTarget.value)}
					/>
				</div>

				<div class="col-grid">
					{#each columns as _, idx (idx)}
						<div class="col-map">
							<div class="col-map-label">Column {idx + 1}</div>
							<select
								class="col-map-select"
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
				<h4 class="section-title tight">
					<FileText size={18} /> 2. Paste CSV Data
				</h4>
				<p class="paste-hint">Drag &amp; Drop file below.</p>

				<!-- Drag & Drop Zone -->
				<div
					class="dropzone"
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
						class="file-input"
						accept=".csv,.txt"
						onchange={handleFileUpload}
					/>
					<FilePlus size={32} class="mx-auto text-stone-400 mb-2" />
					<p class="dropzone-title">Drag &amp; Drop CSV file here</p>
					<p class="dropzone-sub">or click to browse computer</p>
				</div>

				<textarea
					class="csv-input"
					placeholder="Example Row: Andrew Leui, 555-0199, 123 Maple Dr"
					bind:value={rawText}
				></textarea>
			</div>
		</div>

		<div class="footer">
			<button class="cancel-btn" onclick={() => app.closeModals()}> Cancel </button>
			<RPGButton variant="action" onclick={processBoosterImport} disabled={!rawText.trim()}>
				<Upload size={16} class="inline mr-2" /> Import Data
			</RPGButton>
		</div>
	</div>
</Modal>

<style>
	.panel {
		@apply flex max-h-[90vh] w-[90%] max-w-6xl flex-col rounded-lg border-4 border-[#d4c5a9] bg-[#fdfbf7] shadow-xl;
	}
	.panel-header {
		@apply flex items-center justify-between border-b border-[#d4c5a9] bg-[#2c241b] p-4 text-[#f5deb3];
	}
	.panel-title {
		@apply font-serif text-xl font-bold;
	}
	.close-btn {
		@apply hover:text-white;
	}
	.panel-body {
		@apply flex-1 overflow-y-auto p-6;
	}

	.section-structure {
		@apply mb-6 border-b border-[#d4c5a9] pb-6;
	}
	.section-title {
		@apply mb-4 flex items-center gap-2 font-bold text-[#8b4513];
	}
	.section-title.tight {
		@apply mb-2;
	}

	.colcount-row {
		@apply mb-4 flex items-center gap-4;
	}
	.colcount-label {
		@apply text-sm font-bold text-stone-600;
	}
	.colcount-input {
		@apply w-16 rounded border border-[#d4c5a9] p-2 text-center font-bold;
	}

	.col-grid {
		@apply grid grid-cols-6 gap-4;
	}
	.col-map {
		@apply rounded border border-[#d4c5a9] bg-white p-2;
	}
	.col-map-label {
		@apply mb-1 text-[10px] font-bold uppercase text-stone-400;
	}
	.col-map-select {
		@apply w-full border-none bg-transparent p-1 text-sm font-bold text-[#2c241b] focus:ring-0;
	}

	.paste-hint {
		@apply mb-2 text-xs text-stone-500;
	}

	.dropzone {
		@apply mb-3 cursor-pointer rounded-lg border-2 border-dashed border-[#d4c5a9] bg-stone-50 p-6 text-center transition-colors hover:bg-stone-100;
	}
	.file-input {
		@apply hidden;
	}
	.dropzone-title {
		@apply text-sm font-bold text-stone-600;
	}
	.dropzone-sub {
		@apply text-xs text-stone-400;
	}

	.csv-input {
		@apply h-32 w-full resize-none rounded border border-[#d4c5a9] bg-white p-3 font-mono text-xs shadow-inner focus:border-[#8b4513] focus:outline-none;
	}

	.footer {
		@apply flex justify-end gap-3 border-t border-[#d4c5a9] bg-[#e8e4d9] p-4;
	}
	.cancel-btn {
		@apply px-4 py-2 font-bold text-stone-600 hover:text-stone-800;
	}
</style>
