<script lang="ts">
	// Hub screen — retro-blue "RPG file-select" dashboard (SPEC §2.1, §7 HUB_THEME).
	// 12-col grid: left col-span-4 (stats / actions / hit rate / bonus board),
	// right col-span-8 (active quests). All mutations go through the `app` store.
	import { app } from '$lib/state.svelte';
	import { HUB_THEME } from '$lib/theme';
	import { getExpData } from '$lib/core/leveling';
	import { formatDateStandard } from '$lib/core/dates';
	import StatPanel from '$lib/components/StatPanel.svelte';
	import ClientCard from '$lib/components/ClientCard.svelte';
	import RPGButton from '$lib/components/RPGButton.svelte';

	const ed = $derived(getExpData(app.userStats, app.rules.levels));

	// Per Hit Rate — real totals from the daily log (SPEC §9 #7).
	const totalExp = $derived(app.dailyLog.reduce((sum, l) => sum + l.exp, 0));
	const totalCommission = $derived(app.dailyLog.reduce((sum, l) => sum + (l.commission ?? 0), 0));

	// Cards with at least one live (Active/Cooldown) quest on either side.
	const liveCards = $derived(
		app.cards.filter((c) =>
			[c.clientSide, c.businessSide].some((s) =>
				s.quests.some((q) => q.status === 'Active' || q.status === 'Cooldown')
			)
		)
	);

	const today = $derived(formatDateStandard(new Date()));

	function bonusPercent(id: string, required: number): number {
		return Math.min(100, ((app.bonusProgress[id] ?? 0) / required) * 100);
	}
</script>

<div class="min-h-full {HUB_THEME.root}">
	<div class="{HUB_THEME.bg} min-h-full {HUB_THEME.text}">
		<div class="mx-auto grid max-w-7xl grid-cols-12 gap-6 p-6">
			<!-- LEFT COLUMN -->
			<div class="col-span-12 flex flex-col gap-6 lg:col-span-4">
				<StatPanel
					level={ed.level}
					name={app.userStats.name}
					expData={ed}
					onRename={(n) => app.renameUser(n)}
				/>

				<!-- Action buttons -->
				<div class="flex flex-col gap-3">
					<RPGButton variant="action" class="w-full" onclick={() => app.setView('quests')}>
						Start Card Quest
					</RPGButton>
					<button
						onclick={() => app.openStandaloneQuest()}
						class="w-full rounded px-4 py-2 font-serif font-bold tracking-wide text-white shadow-[0_4px_4px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.5)] transition hover:brightness-110 active:scale-95"
						style="background-image: linear-gradient(to bottom, #a78bfa, #7c3aed, #4c1d95);"
					>
						Start Standalone Quest
					</button>
					<RPGButton variant="gold" class="w-full" onclick={() => app.openModal('drawCard')}>
						Draw New Card
					</RPGButton>
				</div>

				<!-- Per Hit Rate -->
				<div class="rounded-xl border p-4 {HUB_THEME.panel}">
					<h2 class="mb-3 font-serif text-lg font-bold tracking-wide {HUB_THEME.accent}">
						Per Hit Rate
					</h2>
					<div class="grid grid-cols-2 gap-3">
						<div class="rounded-lg border border-cyan-300/30 bg-slate-950/40 p-3 text-center">
							<p class="text-[10px] font-bold uppercase tracking-widest text-cyan-300">Total Exp</p>
							<p class="font-mono text-2xl font-bold text-blue-50">{totalExp}</p>
						</div>
						<div class="rounded-lg border border-cyan-300/30 bg-slate-950/40 p-3 text-center">
							<p class="text-[10px] font-bold uppercase tracking-widest text-cyan-300">Commission $</p>
							<p class="font-mono text-2xl font-bold text-blue-50">
								${totalCommission.toLocaleString()}
							</p>
						</div>
					</div>
				</div>

				<!-- Bonus Board -->
				<div class="rounded-xl border p-4 {HUB_THEME.panel}">
					<h2 class="mb-3 font-serif text-lg font-bold tracking-wide {HUB_THEME.accent}">
						Bonus Board
					</h2>
					{#if app.rules.bonuses && app.rules.bonuses.length > 0}
						<div class="flex flex-col gap-4">
							{#each app.rules.bonuses as b (b.id)}
								{@const current = app.bonusProgress[b.id] ?? 0}
								<div>
									<div class="mb-1 flex items-center justify-between">
										<span class="font-serif text-sm font-bold tracking-wide text-blue-50">{b.name}</span>
										<span class="font-mono text-xs text-cyan-200">{current}/{b.required}</span>
									</div>
									<div
										class="relative h-3 w-full overflow-hidden rounded-full border border-cyan-300/40 bg-slate-950/60"
									>
										<div
											class="h-full rounded-full {HUB_THEME.bar} {HUB_THEME.barGlow}"
											style="width: {bonusPercent(b.id, b.required)}%;"
										></div>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<p class="font-mono text-sm text-blue-200/70">No bonuses configured.</p>
					{/if}
				</div>
			</div>

			<!-- RIGHT COLUMN -->
			<div class="col-span-12 lg:col-span-8">
				<div class="mb-4 flex items-center justify-between">
					<h2 class="font-serif text-2xl font-bold tracking-wide {HUB_THEME.accent}">
						Active Quests
					</h2>
					<span
						class="rounded-full border border-cyan-300/40 bg-slate-950/50 px-3 py-1 font-mono text-sm text-cyan-200"
					>
						{today}
					</span>
				</div>

				{#if liveCards.length > 0}
					<div class="flex flex-col gap-4">
						{#each liveCards as card (card.id)}
							<ClientCard {card} />
						{/each}
					</div>
				{:else}
					<div
						class="flex min-h-48 items-center justify-center rounded-xl border p-10 {HUB_THEME.panel}"
					>
						<p class="font-serif text-xl font-bold tracking-wide text-blue-200/70">
							The Quest Board is Empty
						</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
