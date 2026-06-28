<script lang="ts">
	// The central, complex client card (SPEC §3.1).
	// Collapsed = compact 12-col row; expanded = full editable card with quest
	// actions. All persistence/mutations go through the `app` store; the only
	// prop is the card itself.
	import { app } from '$lib/state.svelte';
	import type { Card, SideKey, Quest } from '$lib/core/types';
	import { getCardColors, METALLIC_FONT } from '$lib/theme';
	import RelationshipBar from '$lib/components/RelationshipBar.svelte';
	import CooldownBar from '$lib/components/CooldownBar.svelte';
	import RPGButton from '$lib/components/RPGButton.svelte';
	import { getQuestColorClass, getDueBadge, URGENCY_CLASSES } from '$lib/core/urgency';
	import { getDaysOut, formatDisplayDate, formatDateStandard } from '$lib/core/dates';
	import {
		CLIENT_LOB_OPTIONS,
		CLIENT_CARRIER_OPTIONS,
		BUSINESS_LOB_OPTIONS,
		BUSINESS_CARRIER_OPTIONS,
		RESIDENCE_OPTIONS,
		OCCUPANCY_OPTIONS
	} from '$lib/core/rules';
	import {
		Pencil,
		X,
		Check,
		Merge,
		FlipHorizontal2,
		Crown,
		Plus,
		Star,
		Target
	} from '@lucide/svelte';

	let { card }: { card: Card } = $props();

	// ---- local UI state ----
	let visibleFace = $state<'Client' | 'Business'>(
		card.primarySide === 'Business' ? 'Business' : 'Client'
	);
	let isEditing = $state(false);
	let editData = $state<Card | null>(null);
	let questTab = $state(0);

	// ---- derived ----
	const expanded = $derived(app.expandedCardId === card.id);
	const colors = $derived(getCardColors(card));
	const isStandalone = $derived(card.isStandalone === true || card.primarySide === 'Standalone');

	const sideKey = $derived<SideKey>(visibleFace === 'Business' ? 'businessSide' : 'clientSide');
	const side = $derived(card[sideKey]);

	const typeLabel = $derived(
		isStandalone ? 'Standalone Quest' : card.primarySide === 'Business' ? 'Business Card' : 'Client Card'
	);

	// Collapsed-row data is sourced from the card's primary side.
	const primaryKey = $derived<SideKey>(card.primarySide === 'Business' ? 'businessSide' : 'clientSide');
	const collapsedSide = $derived(card[primaryKey]);
	const trackedQuest = $derived(
		collapsedSide.quests.find((q) => q.tracked && (q.status === 'Active' || q.status === 'Cooldown'))
	);
	const latestNote = $derived.by(() => {
		const tq = trackedQuest;
		if (tq && tq.notes.length) return tq.notes[tq.notes.length - 1].text;
		if (collapsedSide.notes.length) return collapsedSide.notes[collapsedSide.notes.length - 1].text;
		return '';
	});

	// Every live quest across both sides → floating "!" indicator dots.
	const allLiveQuests = $derived(
		[...card.clientSide.quests, ...card.businessSide.quests].filter(
			(q) => q.status === 'Active' || q.status === 'Cooldown'
		)
	);

	// Live quests for the currently visible face (tabbed, max 3).
	const liveQuests = $derived(
		side.quests.filter((q) => q.status === 'Active' || q.status === 'Cooldown').slice(0, 3)
	);
	const activeTab = $derived(liveQuests.length ? Math.min(questTab, liveQuests.length - 1) : 0);
	const selectedQuest = $derived<Quest | undefined>(liveQuests[activeTab]);

	// ---- helpers ----
	function formatPhone(p: string): string {
		const d = (p ?? '').replace(/\D/g, '');
		if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
		if (d.length === 11 && d[0] === '1')
			return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
		return p ?? '';
	}

	function toggleArr(arr: string[], val: string) {
		const i = arr.indexOf(val);
		if (i >= 0) arr.splice(i, 1);
		else arr.push(val);
	}

	function startEdit() {
		editData = structuredClone($state.snapshot(card)) as Card;
		isEditing = true;
	}
	function cancelEdit() {
		isEditing = false;
		editData = null;
	}
	function saveEdit() {
		if (editData) app.saveCard($state.snapshot(editData) as Card);
		isEditing = false;
		editData = null;
	}

	function flipFace() {
		visibleFace = visibleFace === 'Business' ? 'Client' : 'Business';
		questTab = 0;
	}

	function rate(value: number) {
		app.applyRating(card.id, value);
	}

	// Auto-scroll the expanded card into view (~300ms, SPEC §3.1).
	function autoScroll(node: HTMLElement) {
		const t = setTimeout(() => node.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
		return {
			destroy() {
				clearTimeout(t);
			}
		};
	}
</script>

<!-- ===================== view-mode snippets ===================== -->
{#snippet viewField(label: string, value: string)}
	<div class="flex items-baseline justify-between gap-2 border-b border-black/5 py-1">
		<span class="text-xs font-bold uppercase tracking-wide text-black/50">{label}</span>
		<span class="font-mono text-sm text-black/80">{value || '—'}</span>
	</div>
{/snippet}

{#snippet tagBadges(items: string[])}
	{#if items.length}
		<div class="flex flex-wrap gap-1">
			{#each items as it}
				<span class="rounded-full bg-black/10 px-2 py-0.5 text-xs font-bold text-black/70">{it}</span>
			{/each}
		</div>
	{:else}
		<span class="text-xs italic text-black/40">None</span>
	{/if}
{/snippet}

{#snippet checkGroup(options: readonly string[], arr: string[])}
	<div class="flex flex-wrap gap-1">
		{#each options as opt}
			<label
				class="flex cursor-pointer items-center gap-1 rounded border border-black/20 bg-white/60 px-2 py-0.5 text-xs"
			>
				<input
					type="checkbox"
					checked={arr.includes(opt)}
					onchange={() => toggleArr(arr, opt)}
				/>
				{opt}
			</label>
		{/each}
	</div>
{/snippet}

{#if !expanded}
	<!-- ============================ COLLAPSED ROW ============================ -->
	<div class="relative">
		<!-- Floating quest-indicator dots -->
		{#if allLiveQuests.length}
			<div class="pointer-events-none absolute -top-1 left-2 z-10 flex gap-1">
				{#each allLiveQuests as q (q.id)}
					<span
						class="flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white shadow {URGENCY_CLASSES[
							getQuestColorClass(q)
						]}"
						title={q.type}>!</span
					>
				{/each}
			</div>
		{/if}

		<button
			type="button"
			onclick={() => app.toggleCard(card.id)}
			class="grid w-full grid-cols-12 items-center gap-2 rounded-lg border-2 px-3 py-2 text-left font-serif transition hover:brightness-105 {colors.bg} {colors.border}"
		>
			<span class="col-span-3 truncate font-bold text-black/80">{card.name || 'Unnamed'}</span>
			<span class="col-span-2 truncate font-mono text-sm text-black/70">{formatPhone(card.phone)}</span>
			<span class="col-span-3 truncate text-sm italic text-black/60">{latestNote || '—'}</span>
			<span class="col-span-2 truncate text-sm text-black/70">{trackedQuest?.type ?? '—'}</span>
			<span class="col-span-1 text-center font-mono text-sm font-bold text-black/70"
				>{isStandalone ? '-' : card.relationshipScore}</span
			>
			<span class="col-span-1 text-center">
				{#if trackedQuest}
					<span
						class="inline-block rounded-full px-2 py-0.5 text-xs font-bold text-white {URGENCY_CLASSES[
							getQuestColorClass(trackedQuest)
						]}">{getDueBadge(trackedQuest)}</span
					>
				{:else}
					<span class="text-xs text-black/40">—</span>
				{/if}
			</span>
		</button>
	</div>
{:else}
	<!-- ============================== EXPANDED ============================== -->
	<div
		use:autoScroll
		class="rounded-xl border-2 p-4 shadow-lg {colors.bg} {colors.border}"
	>
		<!-- Header bar -->
		<div class="mb-4 flex flex-wrap items-center justify-between gap-2">
			<h3 class="{METALLIC_FONT} text-xl text-black/80">{typeLabel}</h3>

			<div class="flex flex-wrap items-center gap-2">
				{#if !isStandalone}
					<button
						type="button"
						onclick={flipFace}
						class="flex items-center gap-1 rounded border border-black/30 bg-white/70 px-2 py-1 text-xs font-bold text-black/70 hover:brightness-105"
					>
						<FlipHorizontal2 size={14} /> Flip Card
					</button>

					{#if card.primarySide === visibleFace}
						<span
							class="flex items-center gap-1 rounded border border-yellow-600 bg-yellow-100 px-2 py-1 text-xs font-bold text-yellow-800"
						>
							<Crown size={14} /> Primary
						</span>
					{:else}
						<button
							type="button"
							onclick={() => app.setPrimary(card.id, visibleFace)}
							class="flex items-center gap-1 rounded border border-black/30 bg-white/70 px-2 py-1 text-xs font-bold text-black/70 hover:brightness-105"
						>
							<Crown size={14} /> Set as Primary?
						</button>
					{/if}

					<button
						type="button"
						onclick={() => app.openMerge(card.id)}
						class="flex items-center gap-1 rounded border border-black/30 bg-white/70 px-2 py-1 text-xs font-bold text-black/70 hover:brightness-105"
					>
						<Merge size={14} /> Merge
					</button>
				{/if}

				{#if isEditing}
					<button
						type="button"
						onclick={cancelEdit}
						aria-label="Cancel edits"
						class="rounded border border-black/30 bg-white/70 p-1.5 text-black/70 hover:brightness-105"
					>
						<X size={16} />
					</button>
					<button
						type="button"
						onclick={saveEdit}
						aria-label="Save edits"
						class="rounded border border-green-700 bg-green-600 p-1.5 text-white hover:brightness-110"
					>
						<Check size={16} />
					</button>
				{:else}
					<button
						type="button"
						onclick={startEdit}
						aria-label="Edit card"
						class="rounded border border-black/30 bg-white/70 p-1.5 text-black/70 hover:brightness-105"
					>
						<Pencil size={16} />
					</button>
					<button
						type="button"
						onclick={() => app.toggleCard(card.id)}
						aria-label="Close card"
						class="rounded border border-black/30 bg-white/70 p-1.5 text-black/70 hover:brightness-105"
					>
						<X size={16} />
					</button>
				{/if}
			</div>
		</div>

		<div class="grid grid-cols-12 gap-4">
			<!-- ===================== LEFT COLUMN (details) ===================== -->
			<div class="col-span-12 flex flex-col gap-4 md:col-span-5">
				<div class="rounded-lg border border-black/10 bg-white/50 p-3">
					<h4 class="mb-2 font-serif text-sm font-bold uppercase tracking-wide text-black/60">
						{visibleFace} Details
					</h4>

					{#if isEditing && editData}
						<!-- ---------------- EDIT MODE ---------------- -->
						{#if visibleFace === 'Business'}
							<div class="flex flex-col gap-2 text-sm">
								<label class="flex flex-col gap-0.5">
									<span class="text-xs font-bold text-black/50">Phone</span>
									<input bind:value={editData.businessSide.phone} class="rounded border border-black/20 bg-[#fffef8] px-2 py-1" />
								</label>
								<label class="flex flex-col gap-0.5">
									<span class="text-xs font-bold text-black/50">EIN</span>
									<input bind:value={editData.businessSide.ein} class="rounded border border-black/20 bg-[#fffef8] px-2 py-1" />
								</label>
								<label class="flex flex-col gap-0.5">
									<span class="text-xs font-bold text-black/50">Established</span>
									<input bind:value={editData.businessSide.established} class="rounded border border-black/20 bg-[#fffef8] px-2 py-1" />
								</label>
								<label class="flex flex-col gap-0.5">
									<span class="text-xs font-bold text-black/50">Occupancy</span>
									<select bind:value={editData.businessSide.occupancy} class="rounded border border-black/20 bg-[#fffef8] px-2 py-1">
										{#each OCCUPANCY_OPTIONS as o}<option value={o}>{o}</option>{/each}
									</select>
								</label>
								<div class="flex flex-col gap-1">
									<span class="text-xs font-bold text-black/50">Business Lines</span>
									{@render checkGroup(BUSINESS_LOB_OPTIONS, editData.businessSide.lob)}
								</div>
								<div class="flex flex-col gap-1">
									<span class="text-xs font-bold text-black/50">Business Carriers</span>
									{@render checkGroup(BUSINESS_CARRIER_OPTIONS, editData.businessSide.carriers)}
								</div>
							</div>
						{:else}
							<div class="flex flex-col gap-2 text-sm">
								<label class="flex flex-col gap-0.5">
									<span class="text-xs font-bold text-black/50">Phone</span>
									<input bind:value={editData.phone} class="rounded border border-black/20 bg-[#fffef8] px-2 py-1" />
								</label>
								<label class="flex flex-col gap-0.5">
									<span class="text-xs font-bold text-black/50">DOB</span>
									<input bind:value={editData.dob} class="rounded border border-black/20 bg-[#fffef8] px-2 py-1" />
								</label>
								<label class="flex flex-col gap-0.5">
									<span class="text-xs font-bold text-black/50">Email</span>
									<input bind:value={editData.email} class="rounded border border-black/20 bg-[#fffef8] px-2 py-1" />
								</label>
								<label class="flex flex-col gap-0.5">
									<span class="text-xs font-bold text-black/50">Address</span>
									<input bind:value={editData.address} class="rounded border border-black/20 bg-[#fffef8] px-2 py-1" />
								</label>
								<label class="flex flex-col gap-0.5">
									<span class="text-xs font-bold text-black/50">Residence</span>
									<select bind:value={editData.residenceType} class="rounded border border-black/20 bg-[#fffef8] px-2 py-1">
										{#each RESIDENCE_OPTIONS as r}<option value={r}>{r}</option>{/each}
									</select>
								</label>
								<div class="flex flex-col gap-1">
									<span class="text-xs font-bold text-black/50">Line of Business</span>
									{@render checkGroup(CLIENT_LOB_OPTIONS, editData.clientSide.lob)}
								</div>
								<div class="flex flex-col gap-1">
									<span class="text-xs font-bold text-black/50">Carriers</span>
									{@render checkGroup(CLIENT_CARRIER_OPTIONS, editData.clientSide.carriers)}
								</div>
							</div>
						{/if}
					{:else if visibleFace === 'Business'}
						<!-- ---------------- VIEW MODE (business) ---------------- -->
						{@render viewField('Phone', formatPhone(side.phone ?? ''))}
						{@render viewField('EIN', side.ein ?? '')}
						{@render viewField('Established', side.established ?? '')}
						{@render viewField('Occupancy', side.occupancy ?? '')}
						<div class="mt-2">
							<span class="text-xs font-bold uppercase tracking-wide text-black/50">Business Lines</span>
							<div class="mt-1">{@render tagBadges(side.lob)}</div>
						</div>
						<div class="mt-2">
							<span class="text-xs font-bold uppercase tracking-wide text-black/50">Business Carriers</span>
							<div class="mt-1">{@render tagBadges(side.carriers)}</div>
						</div>
					{:else}
						<!-- ---------------- VIEW MODE (client) ---------------- -->
						{@render viewField('Phone', formatPhone(card.phone))}
						{@render viewField('DOB', card.dob)}
						{@render viewField('Email', card.email)}
						{@render viewField('Address', card.address)}
						{@render viewField('Residence', card.residenceType)}
						<div class="mt-2">
							<span class="text-xs font-bold uppercase tracking-wide text-black/50">Line of Business</span>
							<div class="mt-1">{@render tagBadges(side.lob)}</div>
						</div>
						<div class="mt-2">
							<span class="text-xs font-bold uppercase tracking-wide text-black/50">Carriers</span>
							<div class="mt-1">{@render tagBadges(side.carriers)}</div>
						</div>
					{/if}
				</div>

				<!-- COI / BNI -->
				<div class="rounded-lg border border-black/10 bg-white/50 p-3">
					{#if isEditing && editData}
						<div class="flex gap-4 text-sm">
							<label class="flex cursor-pointer items-center gap-1">
								<input type="checkbox" bind:checked={editData.isCOI} /> COI
							</label>
							<label class="flex cursor-pointer items-center gap-1">
								<input type="checkbox" bind:checked={editData.isBNI} /> BNI
							</label>
						</div>
					{:else}
						<div class="flex gap-2">
							{#if card.isCOI}
								<span class="rounded-full border-2 border-slate-700 bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">COI</span>
							{/if}
							{#if card.isBNI}
								<span class="rounded-full border-2 border-yellow-500 bg-yellow-100 px-2 py-0.5 text-xs font-bold text-yellow-700">BNI</span>
							{/if}
							{#if !card.isCOI && !card.isBNI}
								<span class="text-xs italic text-black/40">No COI / BNI flags</span>
							{/if}
						</div>
					{/if}
				</div>

				<!-- Relationship -->
				<div class="rounded-lg border border-black/10 bg-white/50 p-3">
					<h4 class="mb-2 font-serif text-sm font-bold uppercase tracking-wide text-black/60">
						Relationship
					</h4>
					{#if isStandalone}
						<span class="font-mono text-2xl font-bold text-black/40">-</span>
					{:else}
						<RelationshipBar score={card.relationshipScore} />
						{#if isEditing}
							<label class="mt-2 flex items-center gap-2 text-sm">
								<Star size={14} class="text-yellow-500" />
								<span class="text-xs font-bold text-black/50">User Rating</span>
								<input
									type="range"
									min="0"
									max="5"
									step="1"
									value={card.userRating}
									onchange={(e) => rate(+e.currentTarget.value)}
									class="flex-1"
								/>
								<span class="w-4 text-center font-mono font-bold text-black/70">{card.userRating}</span>
							</label>
						{/if}
					{/if}
				</div>

				<!-- Activity Log -->
				<div class="rounded-lg border border-black/10 bg-white/50 p-3">
					<h4 class="mb-2 font-serif text-sm font-bold uppercase tracking-wide text-black/60">
						Activity Log
					</h4>
					<div class="flex max-h-48 flex-col gap-1 overflow-y-auto">
						{#each side.logs as log (log.id)}
							<div class="flex items-center justify-between gap-2 border-b border-black/5 py-1 text-sm">
								<span class="truncate italic text-black/70">{log.questType}</span>
								<span class="shrink-0 font-mono text-xs text-black/50">{formatDateStandard(log.date)}</span>
								{#if log.exp > 0}
									<span class="shrink-0 rounded-full bg-[#daa520] px-2 py-0.5 font-mono text-xs font-bold text-[#2c241b]">+{log.exp}</span>
								{/if}
							</div>
						{:else}
							<span class="py-2 text-center text-xs italic text-black/40">No activity yet.</span>
						{/each}
					</div>
				</div>
			</div>

			<!-- ===================== RIGHT COLUMN (quests) ===================== -->
			<div class="col-span-12 md:col-span-7">
				<div class="rounded-lg border border-black/10 bg-white/50 p-3">
					<h4 class="mb-2 font-serif text-sm font-bold uppercase tracking-wide text-black/60">
						Quest Actions
					</h4>

					{#if liveQuests.length === 0}
						<!-- Empty state -->
						<div class="flex flex-col items-center gap-3 py-6">
							<p class="text-sm italic text-black/50">No active quests…</p>
							<RPGButton variant="action" onclick={() => app.openStartQuest(card.id, sideKey)}>
								Start Quest
							</RPGButton>
						</div>
					{:else}
						<!-- Tabs across live quests (max 3) -->
						<div class="mb-3 flex gap-1">
							{#each liveQuests as q, i (q.id)}
								<button
									type="button"
									onclick={() => (questTab = i)}
									class="flex items-center gap-1 rounded-t border-b-2 px-3 py-1 text-xs font-bold transition {i ===
									activeTab
										? 'border-amber-600 bg-white/80 text-black/80'
										: 'border-transparent bg-white/30 text-black/50 hover:bg-white/50'}"
								>
									<span
										class="inline-block h-2 w-2 rounded-full {URGENCY_CLASSES[getQuestColorClass(q)]}"
									></span>
									{['1st', '2nd', '3rd'][i]} Quest
								</button>
							{/each}
						</div>

						{#if selectedQuest}
							{@const quest = selectedQuest}
							<div class="rounded-lg border border-black/10 bg-white/70 p-3">
								<div class="mb-2 flex items-start justify-between gap-2">
									<div>
										<p class="font-serif text-base font-bold text-black/80">{quest.type}</p>
										<p class="font-mono text-xs text-black/50">
											{quest.status === 'Cooldown'
												? 'On Cooldown'
												: formatDisplayDate(quest.dueDate)}
										</p>
									</div>
									<button
										type="button"
										onclick={() => app.trackQuest(card.id, sideKey, quest.id)}
										class="flex items-center gap-1 rounded border px-2 py-1 text-xs font-bold transition {quest.tracked
											? 'border-amber-600 bg-amber-100 text-amber-800'
											: 'border-black/30 bg-white/70 text-black/60 hover:brightness-105'}"
									>
										<Target size={14} /> {quest.tracked ? 'Tracking' : 'Track'}
									</button>
								</div>

								{#if quest.status === 'Cooldown'}
									<div class="rounded bg-slate-900/90 p-2">
										<CooldownBar daysRemaining={getDaysOut(quest.dueDate)} />
									</div>
									<div class="mt-3 flex flex-wrap gap-2">
										<RPGButton variant="action" onclick={() => app.cooldownAction(card.id, sideKey, quest.id, 'Continue', {})}>
											Continue
										</RPGButton>
										<RPGButton variant="primary" onclick={() => app.cooldownAction(card.id, sideKey, quest.id, 'Extend', {})}>
											Extend
										</RPGButton>
										<RPGButton variant="danger" onclick={() => app.cooldownAction(card.id, sideKey, quest.id, 'GiveUp', {})}>
											Give Up
										</RPGButton>
									</div>
								{:else}
									<div class="mt-3 flex flex-wrap gap-2">
										<RPGButton variant="action" onclick={() => app.openQuestResult(card.id, sideKey, quest.id, 'Complete')}>
											Complete
										</RPGButton>
										<RPGButton variant="primary" onclick={() => app.openQuestResult(card.id, sideKey, quest.id, 'Continue')}>
											Continue Quest
										</RPGButton>
										<RPGButton variant="danger" onclick={() => app.cancelQuest(card.id, sideKey, quest.id)}>
											Cancel
										</RPGButton>
									</div>
								{/if}
							</div>
						{/if}

						<!-- Start additional quest when 1–2 live quests exist -->
						{#if liveQuests.length === 1 || liveQuests.length === 2}
							<div class="mt-3">
								<RPGButton variant="gold" onclick={() => app.openStartQuest(card.id, sideKey)}>
									<span class="inline-flex items-center gap-1">
										<Plus size={14} />
										Start {liveQuests.length === 1 ? 'Second' : 'Third'} Quest
									</span>
								</RPGButton>
							</div>
						{/if}
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
