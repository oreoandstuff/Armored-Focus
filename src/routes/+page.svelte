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
</script>

<div class="min-h-screen">
	<TabBar active={app.view} onSelect={(v) => app.setView(v)} />

	{#if app.view === 'hub'}
		<HubView />
	{:else if app.view === 'quests'}
		<QuestsView />
	{:else if app.view === 'binder'}
		<BinderView />
	{:else if app.view === 'rules'}
		<RulesView />
	{/if}

	<!-- Modals self-gate on app.modals.<flag> -->
	<DrawCardModal />
	<BoosterModal />
	<LevelTableModal />
	<StartQuestModal />
	<QuestResultModal />
	<MergeCardModal />
</div>
