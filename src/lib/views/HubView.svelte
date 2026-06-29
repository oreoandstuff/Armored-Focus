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

<div class="hub-grid">
	<!-- Left Column (Stats & Actions & Log) -->
	<div class="left-col">
		<!-- Retro File Select Header -->
		<div class="panel file-select">
			<div class="level-header">
				<div class="level-box">
					<div class="level-text">
						<span class="level-caption">Level</span>
						<span class="level-number">{ed.level}</span>
					</div>
				</div>
				<div class="name-area">
					{#if isEditingName}
						<!-- svelte-ignore a11y_autofocus -->
						<input
							class="name-input"
							bind:value={nameDraft}
							onblur={commitName}
							onkeydown={(e) => e.key === 'Enter' && commitName()}
							autofocus
						/>
					{:else}
						<div
							class="name-display"
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
							<span class="name-line">{app.userStats.name}</span>
							<Pencil size={14} class="pencil-icon" />
						</div>
					{/if}
				</div>
			</div>
			<div class="exp-section">
				<div class="exp-labels">
					<span>{ed.currentExp} Exp</span><span>Next: {ed.maxExp}</span>
				</div>
				<div class="exp-bar">
					<div class="exp-fill" style="width: {ed.percent}%"></div>
					<div class="exp-gloss"></div>
				</div>
				<div class="exp-footer">
					{ed.remaining} Exp UNTIL LEVEL UP
				</div>
			</div>
		</div>

		<div class="actions">
			<button onclick={() => app.setView('quests')} class="action-btn card">
				<div class="badge card">
					<Coins size={16} />
				</div>Start Card Quest
			</button>
			<button onclick={() => app.openStandaloneQuest()} class="action-btn standalone">
				<div class="badge standalone">S</div>Start Standalone Quest
			</button>
			<button onclick={() => app.openModal('drawCard')} class="action-btn draw">
				<div class="badge draw">
					<Layers size={18} />
				</div>Draw New Card
			</button>
		</div>

		<div class="panel hit-rate">
			<h3 class="board-title">
				<Target size={14} class="target-icon" /> Per Hit Rate
			</h3>
			<div class="rate-row targeted">
				<span class="rate-label">Targeted</span><span class="rate-value targeted">$0</span>
			</div>
			<div class="rate-row">
				<span class="rate-label">Idle</span><span class="rate-value idle">$0</span>
			</div>
		</div>

		<!-- MOVED BONUS BOARD HERE -->
		<div class="panel bonus-board">
			<h3 class="board-title">
				<Award size={14} class="award-icon" /> Bonus Board
			</h3>
			<div class="bonus-list">
				{#each app.rules.bonuses ?? [] as bonus (bonus.id)}
					{@const current = app.bonusProgress[bonus.id] ?? 0}
					{@const required = bonus.required || 1}
					{@const percent = Math.min(100, (current / required) * 100)}
					<div class="bonus">
						<div class="bonus-name">{bonus.name}</div>
						<div class="bonus-row">
							<div class="bonus-bar">
								<div class="bonus-fill" style="width: {percent}%"></div>
							</div>
							<div class="bonus-count">
								{current}/{required}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<div class="right-col">
		<div class="quests-header">
			<h2 class="quests-title">
				<Scroll size={24} class="scroll-icon" /> Active Quests
			</h2>
			<div class="date-pill">
				{formatDateStandard(new Date())}
			</div>
		</div>
		<div class="quest-list">
			{#each liveCards as card (card.id)}
				<ClientCard {card} />
			{/each}
			{#if liveCards.length === 0}
				<div class="empty-board">
					<h3 class="empty-title">The Quest Board is Empty</h3>
					<p class="empty-text">
						Your adventure awaits! Start a new quest or draw a new card to get started.
					</p>
				</div>
			{/if}
		</div>
	</div>
</div>

<style lang="postcss">
	.hub-grid {
		@apply grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-8;
	}
	.left-col {
		@apply space-y-6 lg:col-span-4;
	}
	.right-col {
		@apply lg:col-span-8;
	}

	/* HUB_THEME panel base + per-instance modifiers */
	.panel {
		@apply border-2 border-blue-400/40 bg-blue-900/80 shadow-lg backdrop-blur-sm;
	}
	.file-select {
		@apply overflow-hidden rounded-xl p-1;
	}
	.hit-rate {
		@apply rounded-xl p-3;
	}
	.bonus-board {
		@apply overflow-hidden rounded-xl p-4;
	}

	/* ---- File-select header (Level + name) ---- */
	.level-header {
		@apply flex flex-wrap items-center gap-2 border-b border-blue-500/30 bg-blue-950/50 p-3 lg:flex-nowrap lg:gap-0;
	}
	.level-box {
		@apply flex min-w-[80px] items-center justify-center rounded border-2 border-blue-400 bg-blue-900 px-3 py-1 shadow-inner;
	}
	.level-text {
		@apply flex items-baseline gap-2 font-serif font-bold text-blue-200;
	}
	.level-caption {
		@apply text-sm uppercase tracking-widest text-blue-300;
	}
	.level-number {
		@apply text-3xl text-blue-100;
	}
	.name-area {
		@apply flex-1 pr-2 text-right;
	}
	.name-input {
		@apply w-full border-b border-cyan-500 bg-transparent text-right font-bold text-cyan-100 focus:outline-none;
	}
	.name-display {
		@apply flex cursor-pointer items-center justify-end gap-2 font-serif text-lg font-bold text-blue-50 drop-shadow-md;
	}
	.name-display:hover {
		@apply text-cyan-200;
	}
	.name-line {
		@apply border-b border-dashed border-blue-500/50;
	}
	.name-display:hover .name-line {
		@apply border-cyan-400;
	}
	.name-display :global(.pencil-icon) {
		@apply text-cyan-500;
		opacity: 0.7;
		transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.name-display:hover :global(.pencil-icon) {
		@apply text-cyan-400;
		opacity: 1;
	}

	/* ---- Exp bar ---- */
	.exp-section {
		@apply bg-slate-900/40 p-4;
	}
	.exp-labels {
		@apply mb-1 flex justify-between font-mono text-[10px] font-bold uppercase text-cyan-200/70;
	}
	.exp-bar {
		@apply relative h-5 w-full overflow-hidden rounded-full border border-blue-600/50 bg-slate-950 shadow-inner;
	}
	.exp-fill {
		@apply absolute left-0 top-0 h-full;
		background: linear-gradient(to right, #3b82f6 0%, #22d3ee 50%, #93c5fd 100%);
		box-shadow: 0 0 15px cyan;
		transition: all 700ms cubic-bezier(0, 0, 0.2, 1);
	}
	.exp-gloss {
		@apply absolute left-0 top-0 h-1/2 w-full bg-white/10;
	}
	.exp-footer {
		@apply mt-2 text-center font-mono text-[9px] text-blue-300;
	}

	/* ---- Action buttons ---- */
	.actions {
		@apply space-y-3;
	}
	.action-btn {
		@apply flex w-full items-center justify-center gap-2 rounded-xl border-4 py-4 font-serif text-lg font-bold tracking-wide;
		box-shadow:
			0 4px 4px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.5);
		transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.action-btn:hover {
		filter: brightness(1.1);
	}
	.action-btn:active {
		transform: scale(0.95);
	}
	.action-btn.card {
		@apply border-emerald-950 text-emerald-100;
		background: linear-gradient(to bottom, #34d399 0%, #047857 50%, #064e3b 100%);
	}
	.action-btn.standalone {
		@apply border-purple-950 text-white;
		background: linear-gradient(to bottom, #e879f9 0%, #d946ef 50%, #9333ea 100%);
	}
	.action-btn.draw {
		border-color: #5c3a1e;
		color: #3e2723;
		background: linear-gradient(to bottom, #faeebf 0%, #eebb4d 50%, #aa7e22 100%);
	}

	.badge {
		@apply rounded-full border shadow-inner;
		transition: transform 150ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.action-btn:hover .badge {
		transform: scale(1.1);
	}
	.badge.card {
		@apply border-emerald-400 bg-emerald-950 p-1;
	}
	.badge.standalone {
		@apply flex h-8 w-8 shrink-0 items-center justify-center bg-purple-900 font-serif text-xl italic;
		border-color: #c084fc;
	}
	.badge.draw {
		@apply p-1.5;
		border-color: #faeebf;
		background: #5c3a1e;
		color: #faeebf;
	}

	/* ---- Per Hit Rate + Bonus Board shared title ---- */
	.board-title {
		@apply mb-2 flex items-center gap-2 border-b border-blue-500/30 pb-1 text-xs font-bold uppercase tracking-wider text-blue-200;
	}
	.board-title :global(.target-icon) {
		@apply text-cyan-400;
	}
	.board-title :global(.award-icon) {
		@apply text-yellow-400;
	}

	.rate-row {
		@apply flex items-end justify-between;
	}
	.rate-row.targeted {
		@apply mb-1;
	}
	.rate-label {
		@apply font-mono text-sm text-blue-300/70;
	}
	.rate-value {
		@apply font-mono text-xl font-bold;
	}
	.rate-value.targeted {
		@apply text-emerald-400;
		filter: drop-shadow(0 0 5px rgba(52, 211, 153, 0.5));
	}
	.rate-value.idle {
		@apply text-blue-300;
	}

	/* ---- Bonus Board ---- */
	.bonus-list {
		@apply space-y-3;
	}
	.bonus {
		@apply rounded border border-blue-800 bg-blue-950/50 p-2;
	}
	.bonus-name {
		@apply mb-1 truncate text-[10px] font-bold text-blue-200;
	}
	.bonus-row {
		@apply flex items-center gap-2;
	}
	.bonus-bar {
		@apply relative h-3 flex-1 overflow-hidden rounded-full border border-blue-600 bg-blue-950;
	}
	.bonus-fill {
		@apply absolute left-0 top-0 h-full;
		background: linear-gradient(to right, #3b82f6, #22d3ee);
		transition: all 500ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.bonus-count {
		@apply font-mono text-[9px] font-bold text-cyan-300;
	}

	/* ---- Active Quests column ---- */
	.quests-header {
		@apply mb-4 flex flex-wrap items-center justify-between gap-2 lg:flex-nowrap lg:gap-0;
	}
	.quests-title {
		@apply flex items-center gap-2 font-sans text-2xl font-bold text-blue-50 drop-shadow-md;
	}
	.quests-title :global(.scroll-icon) {
		@apply text-cyan-400;
	}
	.date-pill {
		@apply rounded border border-blue-500/50 bg-blue-900/50 px-3 py-1 font-mono text-sm font-bold text-cyan-100 backdrop-blur-md;
	}
	/* Card spacing comes from each ClientCard's own bottom margin; an @apply
	   space-y here can't reach the child component (different style scope). */
	.empty-board {
		@apply rounded-2xl border-4 border-dashed border-blue-500/20 bg-blue-950/40 p-12 text-center backdrop-blur-sm;
	}
	.empty-title {
		@apply mb-2 text-xl font-bold text-cyan-200;
	}
	.empty-text {
		@apply mb-6 text-blue-300/60;
	}
</style>
