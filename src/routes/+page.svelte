<script lang="ts">
	import { app } from '$lib/state.svelte';
	import TabBar from '$lib/components/TabBar.svelte';
	import HubView from '$lib/views/HubView.svelte';
	import QuestsView from '$lib/views/QuestsView.svelte';
	import BinderView from '$lib/views/BinderView.svelte';
	import RulesView from '$lib/views/RulesView.svelte';
	import DrawCardModal from '$lib/components/modals/DrawCardModal.svelte';
	import BoosterModal from '$lib/components/modals/BoosterModal.svelte';
	import LevelTableModal from '$lib/components/modals/LevelTableModal.svelte';
	import StartQuestModal from '$lib/components/modals/StartQuestModal.svelte';
	import QuestResultModal from '$lib/components/modals/QuestResultModal.svelte';
	import MergeCardModal from '$lib/components/modals/MergeCardModal.svelte';

	// Per-view full-height background gradient (matches the prototype shell).
	const bg = $derived(
		app.view === 'hub'
			? 'bg-gradient-to-b from-blue-800 to-slate-900'
			: app.view === 'quests'
				? 'bg-gradient-to-b from-emerald-900 via-[#5d534a] to-[#3e3730]'
				: app.view === 'binder'
					? 'bg-gradient-to-b from-pink-900 to-purple-950'
					: 'bg-[#e8e4d9]'
	);
</script>

<div class="flex h-screen flex-col font-sans">
	<TabBar active={app.view} onSelect={(v) => app.setView(v)} />

	<div class="flex-1 w-full relative overflow-hidden {bg}">
		<div class="h-full w-full {app.view === 'quests' ? '' : 'p-6 max-w-7xl mx-auto overflow-y-auto'}">
			{#if app.view === 'hub'}
				<HubView />
			{:else if app.view === 'quests'}
				<QuestsView />
			{:else if app.view === 'binder'}
				<BinderView />
			{:else if app.view === 'rules'}
				<RulesView />
			{/if}
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
