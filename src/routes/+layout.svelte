<script lang="ts">
	import '../app.css';
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import { app } from '$lib/state.svelte';
	import type { View } from '$lib/core/types';
	import TabBar from '$lib/components/TabBar.svelte';
	import DrawCardModal from '$lib/components/modals/DrawCardModal.svelte';
	import BoosterModal from '$lib/components/modals/BoosterModal.svelte';
	import LevelTableModal from '$lib/components/modals/LevelTableModal.svelte';
	import StartQuestModal from '$lib/components/modals/StartQuestModal.svelte';
	import QuestResultModal from '$lib/components/modals/QuestResultModal.svelte';
	import MergeCardModal from '$lib/components/modals/MergeCardModal.svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	// Seed the client store from server-loaded state (idempotent, client-only).
	untrack(() => app.init(data));

	// The URL is the source of truth for the active view.
	const view = $derived((page.url.pathname.split('/')[1] || 'hub') as View);

	const bg = $derived(
		view === 'hub'
			? 'bg-gradient-to-b from-blue-800 to-slate-900'
			: view === 'quests'
				? 'bg-gradient-to-b from-emerald-900 via-[#5d534a] to-[#3e3730]'
				: view === 'binder'
					? 'bg-gradient-to-b from-pink-900 to-purple-950'
					: 'bg-[#e8e4d9]'
	);
</script>

<div class="flex h-screen flex-col font-sans">
	<TabBar active={view} onSelect={(v) => app.setView(v)} />

	<div class="flex-1 w-full relative overflow-hidden {bg}">
		<div class="h-full w-full {view === 'quests' ? '' : 'p-6 max-w-7xl mx-auto overflow-y-auto'}">
			{@render children()}
		</div>
	</div>

	<!-- Modals self-gate on app.modals.<flag> -->
	<DrawCardModal />
	<BoosterModal />
	<LevelTableModal />
	<StartQuestModal />
	<QuestResultModal />
	<MergeCardModal />
</div>
