<script lang="ts">
	// Hub screen — retro-blue "RPG file-select" dashboard. Markup mirrors the
	// React prototype's `view === 'hub'` block verbatim (translated JSX → Svelte).
	// The page shell already supplies the HUB_THEME background and the
	// `p-6 max-w-7xl mx-auto overflow-y-auto` container, so this renders only the
	// inner 12-col grid. All mutations go through the `app` store.
	import { app } from '$lib/state.svelte';
	import { getExpData } from '$lib/core/leveling';
	import { formatDateStandard } from '$lib/core/dates';
	import ClientCard from '$lib/components/ClientCard.svelte';
	import { Coins, Layers, Scroll, Award, Target, Pencil } from '@lucide/svelte';

	// HUB_THEME panel / bar-fill class strings (copied from the prototype).
	const PANEL = 'bg-blue-900/80 border-2 border-blue-400/40 shadow-lg backdrop-blur-sm';
	const BAR_FILL = 'bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-300';
	const METALLIC_SHADOW =
		'shadow-[0_4px_4px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.5)]';
	const METALLIC_FONT = 'font-serif font-bold tracking-wide';

	const ed = $derived(getExpData(app.userStats, app.rules.levels));

	// Cards with at least one live (Active/Cooldown) quest on either side.
	const liveCards = $derived(
		app.cards.filter((c) =>
			[c.clientSide, c.businessSide].some((s) =>
				s.quests.some((q) => q.status === 'Active' || q.status === 'Cooldown')
			)
		)
	);

	let isEditingName = $state(false);
	let nameDraft = $state('');

	function startEditName() {
		nameDraft = app.userStats.name;
		isEditingName = true;
	}
	function commitName() {
		if (!isEditingName) return;
		isEditingName = false;
		app.renameUser(nameDraft);
	}
</script>

<div class="grid grid-cols-12 gap-8">
	<!-- Left Column (Stats & Actions & Log) -->
	<div class="col-span-4 space-y-6">
		<!-- Retro File Select Header -->
		<div class="{PANEL} p-1 rounded-xl overflow-hidden">
			<div class="flex items-center bg-blue-950/50 p-3 border-b border-blue-500/30">
				<div
					class="bg-blue-900 border-2 border-blue-400 rounded shadow-inner px-3 py-1 flex items-center justify-center min-w-[80px]"
				>
					<div class="text-blue-200 font-serif font-bold flex items-baseline gap-2">
						<span class="text-sm uppercase tracking-widest text-blue-300">Level</span>
						<span class="text-3xl text-blue-100">{ed.level}</span>
					</div>
				</div>
				<div class="flex-1 text-right pr-2">
					{#if isEditingName}
						<!-- svelte-ignore a11y_autofocus -->
						<input
							class="bg-transparent border-b border-cyan-500 text-cyan-100 font-bold text-right w-full focus:outline-none"
							bind:value={nameDraft}
							onblur={commitName}
							onkeydown={(e) => e.key === 'Enter' && commitName()}
							autofocus
						/>
					{:else}
						<div
							class="text-blue-50 font-serif drop-shadow-md text-lg font-bold cursor-pointer hover:text-cyan-200 flex items-center justify-end gap-2 group"
							role="button"
							tabindex="0"
							onclick={startEditName}
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									startEditName();
								}
							}}
						>
							<span class="border-b border-dashed border-blue-500/50 hover:border-cyan-400"
								>{app.userStats.name}</span
							>
							<Pencil
								size={14}
								class="text-cyan-500 opacity-70 group-hover:opacity-100 group-hover:text-cyan-400 transition-all"
							/>
						</div>
					{/if}
				</div>
			</div>
			<div class="p-4 bg-slate-900/40">
				<div
					class="flex justify-between text-[10px] font-bold text-cyan-200/70 mb-1 font-mono uppercase"
				>
					<span>{ed.currentExp} Exp</span><span>Next: {ed.maxExp}</span>
				</div>
				<div
					class="w-full h-5 bg-slate-950 rounded-full border border-blue-600/50 relative overflow-hidden shadow-inner"
				>
					<div
						class="absolute top-0 left-0 h-full {BAR_FILL} shadow-[0_0_15px_cyan] transition-all duration-700 ease-out"
						style="width: {ed.percent}%"
					></div>
					<div class="absolute top-0 left-0 w-full h-1/2 bg-white/10"></div>
				</div>
				<div class="text-center text-[9px] text-blue-300 mt-2 font-mono">
					{ed.remaining} Exp UNTIL LEVEL UP
				</div>
			</div>
		</div>

		<div class="space-y-3">
			<button
				onclick={() => app.setView('quests')}
				class="w-full py-4 rounded-xl bg-gradient-to-b from-emerald-400 via-emerald-700 to-emerald-900 text-emerald-100 border-4 border-emerald-950 text-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 group {METALLIC_SHADOW} {METALLIC_FONT}"
			>
				<div
					class="p-1 bg-emerald-950 rounded-full border border-emerald-400 group-hover:scale-110 transition-transform shadow-inner"
				>
					<Coins size={16} />
				</div>Start Card Quest
			</button>
			<button
				onclick={() => app.openStandaloneQuest()}
				class="w-full py-4 rounded-xl bg-gradient-to-b from-[#e879f9] via-[#d946ef] to-[#9333ea] text-white border-4 border-purple-950 text-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 group {METALLIC_SHADOW} {METALLIC_FONT}"
			>
				<div
					class="w-8 h-8 bg-purple-900 rounded-full border border-purple-400 flex items-center justify-center font-serif italic text-xl group-hover:scale-110 transition-transform shadow-inner shrink-0"
				>
					S
				</div>Start Standalone Quest
			</button>
			<button
				onclick={() => app.openModal('drawCard')}
				class="w-full py-3 rounded-xl bg-gradient-to-b from-[#faeebf] via-[#eebb4d] to-[#aa7e22] text-[#3e2723] border-4 border-[#5c3a1e] text-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 group {METALLIC_SHADOW} {METALLIC_FONT}"
			>
				<div
					class="p-1.5 bg-[#5c3a1e] rounded-full border border-[#faeebf] group-hover:scale-110 transition-transform shadow-inner text-[#faeebf]"
				>
					<Layers size={18} />
				</div>Draw New Card
			</button>
		</div>

		<div class="{PANEL} p-3 rounded-xl">
			<h3
				class="text-blue-200 font-bold border-b border-blue-500/30 pb-1 mb-2 text-xs uppercase tracking-wider flex items-center gap-2"
			>
				<Target size={14} class="text-cyan-400" /> Per Hit Rate
			</h3>
			<div class="flex justify-between items-end mb-1">
				<span class="text-sm text-blue-300/70 font-mono">Targeted</span><span
					class="text-xl font-mono font-bold text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]"
					>$0</span
				>
			</div>
			<div class="flex justify-between items-end">
				<span class="text-sm text-blue-300/70 font-mono">Idle</span><span
					class="text-xl font-mono font-bold text-blue-300">$0</span
				>
			</div>
		</div>

		<!-- MOVED BONUS BOARD HERE -->
		<div class="{PANEL} p-4 rounded-xl overflow-hidden">
			<h3
				class="text-blue-200 font-bold border-b border-blue-500/30 pb-1 mb-2 text-xs uppercase tracking-wider flex items-center gap-2"
			>
				<Award size={14} class="text-yellow-400" /> Bonus Board
			</h3>
			<div class="space-y-3">
				{#each app.rules.bonuses ?? [] as bonus (bonus.id)}
					{@const current = app.bonusProgress[bonus.id] ?? 0}
					{@const required = bonus.required || 1}
					{@const percent = Math.min(100, (current / required) * 100)}
					<div class="bg-blue-950/50 p-2 rounded border border-blue-800">
						<div class="text-[10px] font-bold text-blue-200 mb-1 truncate">{bonus.name}</div>
						<div class="flex items-center gap-2">
							<div
								class="flex-1 h-3 bg-blue-950 rounded-full border border-blue-600 relative overflow-hidden"
							>
								<div
									class="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
									style="width: {percent}%"
								></div>
							</div>
							<div class="text-[9px] font-mono text-cyan-300 font-bold">
								{current}/{required}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<div class="col-span-8">
		<div class="flex justify-between items-center mb-4">
			<h2 class="text-2xl font-bold text-blue-50 font-sans drop-shadow-md flex items-center gap-2">
				<Scroll size={24} class="text-cyan-400" /> Active Quests
			</h2>
			<div
				class="text-sm font-bold text-cyan-100 bg-blue-900/50 border border-blue-500/50 px-3 py-1 rounded backdrop-blur-md font-mono"
			>
				{formatDateStandard(new Date())}
			</div>
		</div>
		<div class="space-y-2">
			{#each liveCards as card (card.id)}
				<ClientCard {card} />
			{/each}
			{#if liveCards.length === 0}
				<div
					class="p-12 border-4 border-dashed border-blue-500/20 rounded-2xl bg-blue-950/40 text-center backdrop-blur-sm"
				>
					<h3 class="text-xl font-bold text-cyan-200 mb-2">The Quest Board is Empty</h3>
					<p class="text-blue-300/60 mb-6">
						Your adventure awaits! Start a new quest or draw a new card to get started.
					</p>
				</div>
			{/if}
		</div>
	</div>
</div>
