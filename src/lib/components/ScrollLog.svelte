<script lang="ts">
	// Activity scroll log (SPEC §3, §7).
	// Collapsed = "Today's Scroll" (dailyLog, already filtered to today by parent).
	// Expanded = fullscreen "Grand Archive of Deeds" with search over
	// clientName / questType / note.
	import type { LogEntry } from '$lib/core/types';
	import { formatDateStandard } from '$lib/core/dates';
	import { Scroll, Search, X } from '@lucide/svelte';

	let { dailyLog = [], allLog = [] }: { dailyLog?: LogEntry[]; allLog?: LogEntry[] } = $props();

	let expanded = $state(false);
	let query = $state('');

	const filtered = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return allLog;
		return allLog.filter((e) => {
			const name = (e.clientName ?? '').toLowerCase();
			const type = (e.questType ?? '').toLowerCase();
			const note = (e.note ?? '').toLowerCase();
			return name.includes(q) || type.includes(q) || note.includes(q);
		});
	});

	function open() {
		expanded = true;
	}
	function close() {
		expanded = false;
	}
</script>

{#snippet entry(e: LogEntry)}
	<div class="rounded border border-[#8b4513]/30 bg-[#fffdf5]/70 p-3">
		<div class="flex items-start justify-between gap-2">
			<span class="font-serif font-bold text-[#5a3a1a]">{e.clientName}</span>
			<span class="font-mono text-xs text-[#8b4513]/70">{formatDateStandard(e.date)}</span>
		</div>
		<div class="mt-1 flex items-center gap-2">
			<span class="italic text-[#6b4a2a]">{e.questType}</span>
			{#if e.exp > 0}
				<span class="rounded-full bg-[#daa520] px-2 py-0.5 font-mono text-xs font-bold text-[#2c241b]"
					>+{e.exp} XP</span
				>
			{/if}
		</div>
		{#if e.note}
			<p class="mt-1 text-sm italic text-[#6b4a2a]">"{e.note}"</p>
		{/if}
	</div>
{/snippet}

<!-- Collapsed: Today's Scroll -->
<div
	class="rounded-md border-[6px] border-[#8b4513] bg-[#f5e6d3] shadow-inner"
	style="background-image: radial-gradient(rgba(139,69,19,0.1) 1px, transparent 1px); background-size: 12px 12px;"
>
	<!-- Wood roll top bar -->
	<div class="h-3 rounded-t bg-gradient-to-b from-[#a0672e] to-[#5a3a1a]"></div>

	<div class="p-3">
		<div class="mb-2 flex items-center justify-between">
			<h3 class="flex items-center gap-2 font-serif text-lg font-bold text-[#5a3a1a]">
				<Scroll size={18} /> Today's Scroll
			</h3>
			<button
				onclick={open}
				class="rounded border border-[#8b4513] bg-[#e8d3b5] px-2 py-1 font-serif text-xs font-bold text-[#5a3a1a] hover:brightness-105"
			>
				Grand Archive
			</button>
		</div>

		<div class="flex max-h-64 flex-col gap-2 overflow-y-auto">
			{#each dailyLog as e (e.id)}
				{@render entry(e)}
			{:else}
				<p class="py-4 text-center italic text-[#8b4513]/70">The scroll is blank...</p>
			{/each}
		</div>
	</div>

	<!-- Wood roll bottom bar -->
	<div class="h-3 rounded-b bg-gradient-to-t from-[#a0672e] to-[#5a3a1a]"></div>
</div>

<!-- Expanded: Grand Archive of Deeds (fullscreen overlay) -->
{#if expanded}
	<div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur">
		<div
			class="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-md border-[6px] border-[#8b4513] bg-[#f5e6d3]"
			style="background-image: radial-gradient(rgba(139,69,19,0.1) 1px, transparent 1px); background-size: 12px 12px;"
		>
			<div class="h-3 rounded-t bg-gradient-to-b from-[#a0672e] to-[#5a3a1a]"></div>

			<div class="flex items-center justify-between gap-2 px-4 pt-3">
				<h2 class="flex items-center gap-2 font-serif text-2xl font-bold text-[#5a3a1a]">
					<Scroll size={24} /> Grand Archive of Deeds
				</h2>
				<button
					onclick={close}
					aria-label="Close archive"
					class="rounded border border-[#8b4513] bg-[#e8d3b5] p-1 text-[#5a3a1a] hover:brightness-105"
				>
					<X size={18} />
				</button>
			</div>

			<div class="px-4 pt-3">
				<div
					class="flex items-center gap-2 rounded border border-[#8b4513] bg-[#fffef8] px-2 py-1"
				>
					<Search size={16} class="text-[#8b4513]" />
					<input
						bind:value={query}
						placeholder="Search deeds..."
						class="w-full bg-transparent text-[#5a3a1a] placeholder-[#8b4513]/50 outline-none"
					/>
				</div>
			</div>

			<div class="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
				{#each filtered as e (e.id)}
					{@render entry(e)}
				{:else}
					<p class="py-8 text-center italic text-[#8b4513]/70">The scroll is blank...</p>
				{/each}
			</div>

			<div class="h-3 rounded-b bg-gradient-to-t from-[#a0672e] to-[#5a3a1a]"></div>
		</div>
	</div>
{/if}
