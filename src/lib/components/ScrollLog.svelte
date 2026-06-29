<script lang="ts">
	// Activity scroll log (SPEC §3, §7). Markup mirrors the React prototype's
	// `ScrollLog` (parchment scroll panel).
	//   Collapsed = "Today's Scroll": dailyLog entries dated today.
	//   Expanded  = fullscreen "Grand Archive of Deeds": allLog with a search
	//               box filtering by clientName / questType / note.
	import type { LogEntry } from '$lib/core/types';
	import { formatDateStandard, isToday } from '$lib/core/dates';
	import { Scroll, X, ChevronUp } from '@lucide/svelte';

	let { dailyLog = [], allLog = [] }: { dailyLog?: LogEntry[]; allLog?: LogEntry[] } = $props();

	let isExpanded = $state(false);
	let filterText = $state('');

	// Parchment dot texture (copied verbatim from the prototype overlay).
	const textureUrl =
		`url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%238b4513' fill-opacity='0.2' fill-rule='evenodd'/%3E%3C/svg%3E")`;

	// Collapsed shows only today's entries; expanded shows the whole archive
	// filtered by the search box (mirrors the prototype's filter logic).
	const filteredLogs = $derived.by(() => {
		const source = isExpanded ? allLog : dailyLog;
		const q = filterText.toLowerCase();
		return source.filter((log) => {
			if (!isExpanded && !isToday(log.date)) return false;
			return (
				log.clientName.toLowerCase().includes(q) ||
				log.questType.toLowerCase().includes(q) ||
				(log.note?.toLowerCase().includes(q) ?? false)
			);
		});
	});
</script>

<div
	class={`mt-4 relative transition-all duration-500 ${isExpanded ? 'fixed inset-4 z-50 flex flex-col' : 'flex-1 flex flex-col min-h-0'}`}
>
	<!-- Backdrop for Expanded Mode -->
	{#if isExpanded}
		<button
			type="button"
			aria-label="Close archive"
			class="absolute inset-0 bg-black/60 -z-10 rounded-xl"
			onclick={() => (isExpanded = false)}
		></button>
	{/if}

	<div
		class={`flex flex-col bg-[#f5e6d3] border-[6px] border-[#8b4513] rounded-lg shadow-2xl relative overflow-hidden ${isExpanded ? 'w-full max-w-4xl mx-auto h-full' : 'h-full'}`}
	>
		<!-- Scroll Top Roll Effect -->
		<div
			class="h-4 bg-gradient-to-b from-[#5d4037] to-[#8d6e63] border-b border-[#3e2723] shadow-md relative z-10 shrink-0"
		></div>

		<!-- Header Area -->
		<div
			class="bg-[#e6d5c1] p-3 border-b border-[#d4c5a9] flex justify-between items-center shrink-0 shadow-sm"
		>
			<h3 class="font-serif font-bold text-[#3e2723] text-lg flex items-center gap-2">
				<Scroll size={20} class="text-[#8b4513]" />
				{isExpanded ? 'Grand Archive of Deeds' : "Today's Scroll"}
			</h3>
			<div class="flex gap-2">
				{#if isExpanded}
					<input
						class="px-2 py-1 text-sm bg-white border border-[#d4c5a9] rounded focus:outline-none focus:border-[#8b4513] font-serif"
						placeholder="Search archives..."
						bind:value={filterText}
					/>
				{/if}
				<button
					onclick={() => (isExpanded = !isExpanded)}
					class="text-[#8b4513] hover:bg-[#d7ccc8] p-1 rounded transition-colors"
				>
					{#if isExpanded}
						<X size={20} />
					{:else}
						<div class="flex items-center gap-1 text-xs font-bold uppercase">
							<ChevronUp size={16} /> Expand
						</div>
					{/if}
				</button>
			</div>
		</div>

		<!-- Log Content -->
		<div class="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f5e6d3] relative">
			<!-- Texture Overlay -->
			<div
				class="absolute inset-0 opacity-10 pointer-events-none"
				style={`background-image: ${textureUrl}`}
			></div>

			{#if filteredLogs.length === 0}
				<div class="text-center text-[#a1887f] italic py-4 relative z-10">The scroll is blank...</div>
			{:else}
				{#each filteredLogs as log (log.id)}
					<div class="border-b border-[#d7ccc8] pb-2 last:border-0 relative z-10">
						<div class="flex justify-between items-start">
							<div class="font-bold text-[#3e2723] font-serif">{log.clientName}</div>
							<div class="text-xs text-[#8d6e63] font-mono">{formatDateStandard(log.date)}</div>
						</div>
						<div class="flex justify-between text-sm items-center">
							<span class="text-[#5d4037] italic">{log.questType}</span>
							{#if log.exp > 0}
								<span
									class="font-bold text-[#2e7d32] bg-[#c8e6c9] px-1 rounded text-xs border border-[#81c784]"
									>+{log.exp} XP</span
								>
							{/if}
						</div>
						{#if log.note}
							<div class="text-xs text-[#5d4037] mt-1 bg-[#d7ccc8]/30 p-1 rounded italic">
								"{log.note}"
							</div>
						{/if}
					</div>
				{/each}
			{/if}
		</div>

		<!-- Scroll Bottom Roll Effect -->
		<div
			class="h-6 bg-gradient-to-t from-[#5d4037] to-[#8d6e63] border-t border-[#3e2723] shadow-[0_-4px_10px_rgba(0,0,0,0.3)] relative z-10 shrink-0"
		></div>
	</div>
</div>
