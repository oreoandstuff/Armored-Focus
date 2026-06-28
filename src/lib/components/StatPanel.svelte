<script lang="ts">
	// Hub "File-Select Header" panel (SPEC §2.1, §7 HUB_THEME).
	// Presentational: expData is computed by the parent (core/leveling).
	import { HUB_THEME } from '$lib/theme';

	interface ExpData {
		currentExp: number;
		maxExp: number;
		percent: number;
		remaining: number;
	}

	let {
		level,
		name,
		expData,
		onRename
	}: {
		level: number;
		name: string;
		expData: ExpData;
		onRename?: (name: string) => void;
	} = $props();

	let editing = $state(false);
	let draft = $state('');

	function startEdit() {
		draft = name;
		editing = true;
	}
	function commit() {
		if (!editing) return;
		editing = false;
		const next = draft.trim();
		if (next && next !== name) onRename?.(next);
	}
	function onKey(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			(e.currentTarget as HTMLInputElement).blur();
		} else if (e.key === 'Escape') {
			editing = false;
		}
	}
</script>

<div class="rounded-xl border p-4 {HUB_THEME.panel} {HUB_THEME.text}">
	<div class="flex items-center gap-4">
		<!-- Big level number box -->
		<div
			class="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-lg border-2 border-cyan-300/60 bg-slate-950/60"
		>
			<span class="text-[10px] font-bold uppercase tracking-widest text-cyan-300">Lvl</span>
			<span class="font-mono text-3xl font-bold text-cyan-200">{level}</span>
		</div>

		<div class="min-w-0 flex-1">
			<!-- Editable name -->
			{#if editing}
				<!-- svelte-ignore a11y_autofocus -->
				<input
					bind:value={draft}
					onblur={commit}
					onkeydown={onKey}
					autofocus
					class="w-full rounded border border-cyan-300/60 bg-slate-950/60 px-2 py-1 font-serif text-2xl font-bold text-blue-50 outline-none"
				/>
			{:else}
				<button
					onclick={startEdit}
					class="truncate text-left font-serif text-2xl font-bold tracking-wide hover:text-cyan-200"
					title="Click to rename"
				>
					{name}
				</button>
			{/if}

			<!-- Exp bar -->
			<div class="mt-2">
				<div class="mb-1 flex items-center justify-between font-mono text-xs text-blue-100">
					<span>{expData.currentExp} Exp</span>
					<span>Next: {expData.maxExp}</span>
				</div>
				<div
					class="relative h-3 w-full overflow-hidden rounded-full border border-cyan-300/40 bg-slate-950/60"
				>
					<div
						class="h-full rounded-full {HUB_THEME.bar} {HUB_THEME.barGlow}"
						style="width: {Math.max(0, Math.min(100, expData.percent))}%;"
					></div>
				</div>
				<p class="mt-1 text-right font-mono text-[11px] font-bold uppercase tracking-wide text-cyan-300">
					{expData.remaining} Exp UNTIL LEVEL UP
				</p>
			</div>
		</div>
	</div>
</div>
