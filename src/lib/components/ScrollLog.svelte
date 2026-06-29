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

<div class="scroll-region" class:expanded={isExpanded}>
	<!-- Backdrop for Expanded Mode -->
	{#if isExpanded}
		<button
			type="button"
			aria-label="Close archive"
			class="backdrop"
			onclick={() => (isExpanded = false)}
		></button>
	{/if}

	<div class="scroll" class:expanded={isExpanded}>
		<!-- Scroll Top Roll Effect -->
		<div class="wood-top"></div>

		<!-- Header Area -->
		<div class="scroll-head">
			<h3 class="scroll-title">
				<Scroll size={20} class="text-[#8b4513]" />
				{isExpanded ? 'Grand Archive of Deeds' : "Today's Scroll"}
			</h3>
			<div class="head-actions">
				{#if isExpanded}
					<input class="search" placeholder="Search archives..." bind:value={filterText} />
				{/if}
				<button onclick={() => (isExpanded = !isExpanded)} class="expand-btn">
					{#if isExpanded}
						<X size={20} />
					{:else}
						<div class="expand-label">
							<ChevronUp size={16} /> Expand
						</div>
					{/if}
				</button>
			</div>
		</div>

		<!-- Log Content -->
		<div class="entries">
			<!-- Texture Overlay -->
			<div class="dot-texture" style={`background-image: ${textureUrl}`}></div>

			{#if filteredLogs.length === 0}
				<div class="empty">The scroll is blank...</div>
			{:else}
				{#each filteredLogs as log (log.id)}
					<div class="entry">
						<div class="entry-head">
							<div class="entry-name">{log.clientName}</div>
							<div class="entry-date">{formatDateStandard(log.date)}</div>
						</div>
						<div class="entry-meta">
							<span class="entry-type">{log.questType}</span>
							{#if log.exp > 0}
								<span class="xp-badge">+{log.exp} XP</span>
							{/if}
						</div>
						{#if log.note}
							<div class="entry-note">
								"{log.note}"
							</div>
						{/if}
					</div>
				{/each}
			{/if}
		</div>

		<!-- Scroll Bottom Roll Effect -->
		<div class="wood-bottom"></div>
	</div>
</div>

<style>
	.scroll-region {
		@apply mt-4 relative flex flex-col flex-1 min-h-0 transition-all duration-500;
	}
	.scroll-region.expanded {
		@apply fixed inset-4 z-50;
	}

	.backdrop {
		@apply absolute inset-0 -z-10 rounded-xl bg-black/60;
	}

	.scroll {
		@apply relative flex h-full flex-col overflow-hidden rounded-lg shadow-2xl;
		background-color: #f5e6d3;
		border: 6px solid #8b4513;
	}
	.scroll.expanded {
		@apply mx-auto w-full max-w-4xl;
	}

	.wood-top {
		@apply relative z-10 h-4 shrink-0 border-b border-[#3e2723] shadow-md;
		background-image: linear-gradient(to bottom, #5d4037, #8d6e63);
	}
	.wood-bottom {
		@apply relative z-10 h-6 shrink-0 border-t border-[#3e2723] shadow-[0_-4px_10px_rgba(0,0,0,0.3)];
		background-image: linear-gradient(to top, #5d4037, #8d6e63);
	}

	.scroll-head {
		@apply flex shrink-0 items-center justify-between border-b border-[#d4c5a9] bg-[#e6d5c1] p-3 shadow-sm;
	}
	.scroll-title {
		@apply flex items-center gap-2 font-serif text-lg font-bold text-[#3e2723];
	}
	.head-actions {
		@apply flex gap-2;
	}
	.search {
		@apply rounded border border-[#d4c5a9] bg-white px-2 py-1 font-serif text-sm focus:border-[#8b4513] focus:outline-none;
	}
	.expand-btn {
		@apply rounded p-1 text-[#8b4513] transition-colors hover:bg-[#d7ccc8];
	}
	.expand-label {
		@apply flex items-center gap-1 text-xs font-bold uppercase;
	}

	.entries {
		@apply relative flex-1 space-y-3 overflow-y-auto p-4;
		background-color: #f5e6d3;
	}
	.dot-texture {
		@apply pointer-events-none absolute inset-0 opacity-10;
	}

	.empty {
		@apply relative z-10 py-4 text-center italic text-[#a1887f];
	}

	.entry {
		@apply relative z-10 border-b border-[#d7ccc8] pb-2 last:border-0;
	}
	.entry-head {
		@apply flex items-start justify-between;
	}
	.entry-name {
		@apply font-serif font-bold text-[#3e2723];
	}
	.entry-date {
		@apply font-mono text-xs text-[#8d6e63];
	}
	.entry-meta {
		@apply flex items-center justify-between text-sm;
	}
	.entry-type {
		@apply italic text-[#5d4037];
	}
	.xp-badge {
		@apply rounded border border-[#81c784] bg-[#c8e6c9] px-1 text-xs font-bold text-[#2e7d32];
	}
	.entry-note {
		@apply mt-1 rounded bg-[#d7ccc8]/30 p-1 text-xs italic text-[#5d4037];
	}
</style>
