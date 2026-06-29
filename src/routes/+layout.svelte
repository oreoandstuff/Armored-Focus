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
</script>

<div class="app-shell">
	<TabBar active={view} onSelect={(v) => app.setView(v)} />

	<div
		class="view-bg"
		class:hub={view === 'hub'}
		class:quests={view === 'quests'}
		class:binder={view === 'binder'}
		class:rules={view === 'rules'}
	>
		<!-- Quests is full-bleed; the other views get the centered, padded container. -->
		<div class="view-container" class:padded={view !== 'quests'}>
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

<style lang="postcss">
	.app-shell {
		@apply flex h-screen flex-col font-sans;
	}
	.view-bg {
		@apply relative w-full flex-1 overflow-hidden;
	}
	.view-bg.hub {
		@apply bg-gradient-to-b from-blue-800 to-slate-900;
	}
	.view-bg.quests {
		@apply bg-gradient-to-b from-emerald-900 via-[#5d534a] to-[#3e3730];
	}
	.view-bg.binder {
		@apply bg-gradient-to-b from-pink-900 to-purple-950;
	}
	.view-bg.rules {
		@apply bg-[#e8e4d9];
	}
	.view-container {
		@apply h-full w-full;
	}
	.view-container.padded {
		@apply mx-auto max-w-7xl overflow-y-auto p-6;
	}
</style>
