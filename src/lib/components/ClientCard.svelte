<script lang="ts">
	// The central client card (SPEC §3.1), rebuilt to visually match the React
	// prototype's ClientCard 1:1. Collapsed = compact 12-col row; expanded = full
	// editable card with quest actions. The only prop is the card itself; all
	// persistence/mutations go through the `app` store.
	import { untrack } from 'svelte';
	import { app } from '$lib/state.svelte';
	import type { Card, SideKey, Quest } from '$lib/core/types';
	import RelationshipBar from '$lib/components/RelationshipBar.svelte';
	import CooldownBar from '$lib/components/CooldownBar.svelte';
	import RPGButton from '$lib/components/RPGButton.svelte';
	import { getDaysOut, formatDisplayDate } from '$lib/core/dates';
	import {
		CLIENT_LOB_OPTIONS,
		CLIENT_CARRIER_OPTIONS,
		BUSINESS_LOB_OPTIONS,
		BUSINESS_CARRIER_OPTIONS,
		RESIDENCE_OPTIONS,
		OCCUPANCY_OPTIONS
	} from '$lib/core/rules';
	import {
		RotateCcw,
		Merge,
		SquarePen,
		X,
		Scroll,
		Sword,
		CircleCheck,
		Plus,
		Ban
	} from '@lucide/svelte';

	let { card }: { card: Card } = $props();

	// ---- local UI state ----
	let visibleFace = $state<'Client' | 'Business'>(
		untrack(() => (card.primarySide === 'Business' ? 'Business' : 'Client'))
	);
	let isEditing = $state(false);
	let editData = $state<Card | null>(null);
	let questTab = $state(0);

	// ---- derived ----
	const expanded = $derived(app.expandedCardId === card.id);
	const isStandalone = $derived(card.isStandalone === true || card.primarySide === 'Standalone');

	const activeFace = $derived<'Client' | 'Business'>(
		expanded ? visibleFace : card.primarySide === 'Business' ? 'Business' : 'Client'
	);
	const isClientFace = $derived(activeFace === 'Client');
	const sideKey = $derived<SideKey>(isClientFace ? 'clientSide' : 'businessSide');

	// Quest data is always sourced from the live card (never the edit draft).
	const sideData = $derived(isClientFace ? card.clientSide : card.businessSide);
	const activeQuests = $derived(
		sideData.quests.filter((q) => q.status !== 'Completed' && q.status !== 'Cancelled')
	);
	const trackedQuest = $derived<Quest | undefined>(
		activeQuests.find((q) => q.tracked) ?? activeQuests[0]
	);
	const selectedQuest = $derived<Quest | undefined>(activeQuests[questTab] ?? activeQuests[0]);

	// Every live quest across both sides → floating "!" indicator dots.
	const allLiveQuests = $derived(
		[...card.clientSide.quests, ...card.businessSide.quests].filter(
			(q) => q.status !== 'Completed' && q.status !== 'Cancelled'
		)
	);

	const displayCardName = $derived(
		isClientFace ? card.name : card.businessSide.businessName || 'Unnamed Business'
	);
	const displayCardPhone = $derived(isClientFace ? card.phone : card.businessSide.phone || '');

	// In edit mode, fields read from the working draft; otherwise the live card.
	const activeData = $derived(isEditing && editData ? editData : card);
	const activeSideData = $derived(isClientFace ? activeData.clientSide : activeData.businessSide);
	const headerName = $derived(
		isClientFace ? activeData.name : activeData.businessSide.businessName || 'New Business'
	);
	const isPrimarySide = $derived(card.primarySide === visibleFace);
	const typeLabel = $derived(
		isStandalone ? 'Standalone Quest' : isClientFace ? 'Client Card' : 'Business Card'
	);

	// ---- color logic (mirrors prototype, keyed off the *visible* face) ----
	// `colorKind` drives the gradient fill + base border; BNI/COI override the
	// border only. Expressed as enums so the template can switch via class:.
	const hasPolicies = $derived(sideData.lob && sideData.lob.length > 0);
	const colorKind = $derived.by(() => {
		if (isStandalone) return 'purple';
		if (isClientFace) return hasPolicies ? 'emerald' : 'stone';
		return hasPolicies ? 'blue' : 'orange';
	});
	const borderKind = $derived(card.isBNI ? 'bni' : card.isCOI ? 'coi' : colorKind);

	// Reset the visible face whenever the card is (re)expanded or its primary
	// side changes — matches the prototype's useEffect.
	$effect(() => {
		if (expanded) {
			visibleFace = card.primarySide === 'Business' ? 'Business' : 'Client';
			questTab = 0;
		}
	});

	// ---- helpers ----
	function formatPhoneNumber(p: string): string {
		if (!p) return '';
		const cleaned = ('' + p).replace(/\D/g, '');
		const m = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
		if (m) return `${m[1]}-${m[2]}-${m[3]}`;
		return p;
	}

	// Exact prototype urgency colors for the floating "!" dots.
	function questDotClass(q: Quest): string {
		if (q.status === 'Cooldown') return 'bg-blue-500 border-blue-200';
		const d = getDaysOut(q.dueDate);
		if (d < 0) return 'bg-purple-600 border-purple-200';
		if (d <= 1) return 'bg-red-600 border-red-200';
		if (d < 4) return 'bg-yellow-500 border-yellow-200';
		return 'bg-green-600 border-green-200';
	}

	function dueBadgeClass(tq: Quest | undefined): string {
		if (!tq) return 'border-transparent text-stone-400';
		if (tq.status === 'Cooldown') return 'bg-blue-100 text-blue-800 border-blue-300';
		const d = getDaysOut(tq.dueDate);
		if (d < 1) return 'bg-red-100 text-red-800 border-red-300';
		if (d < 4) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
		return 'bg-green-100 text-green-800 border-green-300';
	}
	function dueBadgeLabel(tq: Quest | undefined): string {
		if (!tq) return '-';
		if (tq.status === 'Cooldown') return 'Cool';
		const d = getDaysOut(tq.dueDate);
		return d <= 1 ? 'Now' : `${d}d`;
	}

	function toggleArrayItem(sideName: 'Client' | 'Business', field: 'lob' | 'carriers', item: string) {
		if (!editData) return;
		const target = sideName === 'Client' ? editData.clientSide : editData.businessSide;
		const list = target[field];
		const i = list.indexOf(item);
		if (i >= 0) list.splice(i, 1);
		else list.push(item);
	}

	function handleUserRatingChange(value: string) {
		const rating = parseInt(value, 10);
		app.applyRating(card.id, rating);
		if (editData) {
			let base = editData.relationshipScore - (editData.userRating || 0) * 10;
			if (base < 0) base = 0;
			editData.userRating = rating;
			editData.relationshipScore = Math.min(100, base + rating * 10);
		}
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
		visibleFace = visibleFace === 'Client' ? 'Business' : 'Client';
		questTab = 0;
	}

	function onToggle() {
		app.toggleCard(card.id);
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

<!-- ===================================================================== -->
<!-- Reusable section snippets. All share component state directly, so no    -->
<!-- prop threading is needed.                                               -->
<!-- ===================================================================== -->

{#snippet questDots()}
	<div class="quest-dots">
		{#each activeQuests as q, i (q.id)}
			<div
				class="quest-dot {questDotClass(q)}"
				class:dot-overlap={i > 0}
				style="z-index: {10 - i};"
				title={`${q.type} - Due ${formatDisplayDate(q.dueDate)}`}
			>
				!
			</div>
		{/each}
	</div>
{/snippet}

{#snippet collapsedRow()}
	<div
		role="button"
		tabindex="0"
		onclick={onToggle}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				onToggle();
			}
		}}
		class="collapsed-card"
		class:fill-purple={colorKind === 'purple'}
		class:fill-emerald={colorKind === 'emerald'}
		class:fill-stone={colorKind === 'stone'}
		class:fill-blue={colorKind === 'blue'}
		class:fill-orange={colorKind === 'orange'}
		class:bd-purple={borderKind === 'purple'}
		class:bd-emerald={borderKind === 'emerald'}
		class:bd-stone={borderKind === 'stone'}
		class:bd-blue={borderKind === 'blue'}
		class:bd-orange={borderKind === 'orange'}
		class:bd-bni={borderKind === 'bni'}
		class:bd-coi={borderKind === 'coi'}
	>
		<!-- Active Quest Indicators -->
		{#if activeQuests.length > 0}
			{@render questDots()}
		{/if}

		<div class="collapsed-grid">
			<!-- 1. Name -->
			<div class="col-name">
				<span class="cell-label">Name</span>
				<div class="cell-name-value" title={displayCardName}>
					{displayCardName || '-'}
				</div>
			</div>

			<!-- 2. Phone -->
			<div class="col-phone">
				<span class="cell-label">Phone</span>
				<div class="cell-phone-value">
					{displayCardPhone ? formatPhoneNumber(displayCardPhone) : '-'}
				</div>
			</div>

			<!-- 3. Notes -->
			<div class="col-note">
				<span class="cell-label">Latest Note</span>
				<div class="cell-note-value">
					{trackedQuest && trackedQuest.notes && trackedQuest.notes.length > 0
						? `"${trackedQuest.notes[trackedQuest.notes.length - 1].text}"`
						: '-'}
				</div>
			</div>

			<!-- 4. Quest Type -->
			<div class="col-quest">
				<span class="cell-label">Current Quest</span>
				<div class="cell-quest-value">
					{trackedQuest ? trackedQuest.type : '-'}
				</div>
			</div>

			<!-- 5. Relationship Score -->
			<div class="col-score">
				<span class="cell-label">Score</span>
				<div class="cell-score-value">
					{!isStandalone ? `${card.relationshipScore}` : '-'}
				</div>
			</div>

			<!-- 6. Due Date (Badge) -->
			<div class="col-due">
				<span class="cell-label">Due</span>
				<div class="due-badge-wrap">
					<span class="due-badge {dueBadgeClass(trackedQuest)}">
						{dueBadgeLabel(trackedQuest)}
					</span>
				</div>
			</div>
		</div>
	</div>
{/snippet}

{#snippet cardHeader()}
	<div class="card-header">
		<div class="header-left">
			<span
				class="type-label"
				class:label-standalone={isStandalone}
				class:label-client={!isStandalone && isClientFace}
				class:label-business={!isStandalone && !isClientFace}>{typeLabel}</span
			>

			{#if !isEditing && !isStandalone}
				<button onclick={flipFace} class="flip-btn">
					<RotateCcw size={14} /> Flip Card
				</button>

				<div class="primary-area">
					{#if isPrimarySide}
						<span class="primary-label">Primary</span>
					{:else}
						<button onclick={() => app.setPrimary(card.id, visibleFace)} class="set-primary-btn"
							>Set as Primary?</button
						>
					{/if}
				</div>
			{/if}
		</div>

		<div class="header-actions">
			{#if !isStandalone}
				<button onclick={() => app.openMerge(card.id)} class="merge-btn">
					<Merge size={14} /> Merge
				</button>
			{/if}

			{#if !isEditing}
				<button onclick={startEdit} aria-label="Edit card" class="icon-btn">
					<SquarePen size={18} />
				</button>
				<button onclick={onToggle} aria-label="Close card" class="icon-btn">
					<X size={18} />
				</button>
			{:else}
				<button onclick={cancelEdit} class="cancel-btn">Cancel Changes</button>
				<RPGButton variant="primary" onclick={saveEdit} class="text-xs px-3 py-1">Save</RPGButton>
			{/if}
		</div>
	</div>
{/snippet}

<!-- Shared editable LOB/Carrier selector (4 instances). -->
{#snippet checkGroup(
	title: string,
	options: readonly string[],
	sideName: 'Client' | 'Business',
	field: 'lob' | 'carriers',
	badgeKind: 'emerald' | 'blue'
)}
	<div class="field-box">
		<span class="field-box-label">{title}</span>
		{#if isEditing}
			<div class="check-grid">
				{#each options as opt}
					<label class="check">
						<input
							type="checkbox"
							checked={activeSideData[field].includes(opt)}
							onchange={() => toggleArrayItem(sideName, field, opt)}
						/>
						{opt}
					</label>
				{/each}
			</div>
		{:else}
			<div class="tag-list">
				{#if activeSideData[field].length > 0}
					{#each activeSideData[field] as v}
						<span
							class="tag"
							class:tag-emerald={badgeKind === 'emerald'}
							class:tag-blue={badgeKind === 'blue'}>{v}</span
						>
					{/each}
				{:else}
					<span class="tag-none">None</span>
				{/if}
			</div>
		{/if}
	</div>
{/snippet}

{#snippet clientFace()}
	<div class="field-grid">
		<div>
			<span class="field-label">Phone</span>
			{#if isEditing && editData}
				<input class="field-input" bind:value={editData.phone} />
			{:else}
				<div class="val-mono">{formatPhoneNumber(activeData.phone)}</div>
			{/if}
		</div>
		<div>
			<span class="field-label">DOB</span>
			{#if isEditing && editData}
				<input class="field-input" type="date" bind:value={editData.dob} />
			{:else}
				<div>{activeData.dob || '-'}</div>
			{/if}
		</div>
	</div>
	<div>
		<span class="field-label">Email</span>
		{#if isEditing && editData}
			<input class="field-input" bind:value={editData.email} />
		{:else}
			<div class="val-truncate">{activeData.email}</div>
		{/if}
	</div>
	<div>
		<span class="field-label">Address</span>
		{#if isEditing && editData}
			<input class="field-input" bind:value={editData.address} />
		{:else}
			<div class="val-truncate">{activeData.address}</div>
		{/if}
	</div>
	<div>
		<span class="field-label">Residence</span>
		{#if isEditing && editData}
			<select class="field-input" bind:value={editData.residenceType}>
				{#each RESIDENCE_OPTIONS as r}<option value={r}>{r}</option>{/each}
			</select>
		{:else}
			<div>{activeData.residenceType}</div>
		{/if}
	</div>

	{@render checkGroup('Line of Business', CLIENT_LOB_OPTIONS, 'Client', 'lob', 'emerald')}
	{@render checkGroup('Carriers', CLIENT_CARRIER_OPTIONS, 'Client', 'carriers', 'blue')}
{/snippet}

{#snippet businessFace()}
	<div class="field-grid">
		<div>
			<span class="field-label">Phone</span>
			{#if isEditing && editData}
				<input class="field-input" bind:value={editData.businessSide.phone} />
			{:else}
				<div class="val-mono">{formatPhoneNumber(activeData.businessSide.phone ?? '')}</div>
			{/if}
		</div>
		<div>
			<span class="field-label">EIN</span>
			{#if isEditing && editData}
				<input class="field-input" bind:value={editData.businessSide.ein} />
			{:else}
				<div>{activeData.businessSide.ein || '-'}</div>
			{/if}
		</div>
	</div>
	<div>
		<span class="field-label">Est.</span>
		{#if isEditing && editData}
			<input class="field-input" bind:value={editData.businessSide.established} />
		{:else}
			<div>{activeData.businessSide.established || '-'}</div>
		{/if}
	</div>
	<div>
		<span class="field-label">Occupancy</span>
		{#if isEditing && editData}
			<select class="field-input" bind:value={editData.businessSide.occupancy}>
				{#each OCCUPANCY_OPTIONS as o}<option value={o}>{o}</option>{/each}
			</select>
		{:else}
			<div>{activeData.businessSide.occupancy}</div>
		{/if}
	</div>

	{@render checkGroup('Business Lines', BUSINESS_LOB_OPTIONS, 'Business', 'lob', 'blue')}
	{@render checkGroup('Business Carriers', BUSINESS_CARRIER_OPTIONS, 'Business', 'carriers', 'blue')}
{/snippet}

{#snippet standaloneNote()}
	<div class="standalone-note">
		<p class="standalone-title">Standalone Quest</p>
		<p class="standalone-text">
			This is a temporary card for a one-off task. It will be removed upon completion.
		</p>
	</div>
{/snippet}

{#snippet ratingBar()}
	<div class="rel-section">
		<div class="rel-header">
			<span>Relationship Score</span><span>{activeData.relationshipScore}/100</span>
		</div>
		<RelationshipBar score={activeData.relationshipScore} />
		{#if isEditing}
			<div class="rating-box">
				<div class="rel-header">
					<span>User Rating</span><span>{activeData.userRating || 0} / 5</span>
				</div>
				<input
					type="range"
					min="0"
					max="5"
					step="1"
					class="rating-range"
					value={activeData.userRating || 0}
					onchange={(e) => handleUserRatingChange(e.currentTarget.value)}
				/>
				<div class="rating-note">
					+{(activeData.userRating || 0) * 10} Score Points
				</div>
			</div>
		{/if}
	</div>
{/snippet}

{#snippet activityLog()}
	<div class="log-section">
		<h3 class="log-title">
			<Scroll size={18} />
			{activeFace} Activity Log
		</h3>
		<div class="log-box">
			{#if activeSideData.logs && activeSideData.logs.length > 0}
				{#each activeSideData.logs as log, i (log.id || i)}
					<div class="log-entry">
						<span class="log-date">{formatDisplayDate(log.date)}</span> - {log.questType}
						{#if log.exp > 0}
							<span class="log-xp">+{log.exp} XP</span>
						{/if}
					</div>
				{/each}
			{:else}
				<div class="log-empty">No activity recorded yet.</div>
			{/if}
		</div>
	</div>
{/snippet}

{#snippet leftColumn()}
	<div>
		{#if isEditing && editData}
			{#if isClientFace}
				<input class="name-input-client" bind:value={editData.name} />
			{:else}
				<input class="name-input-business" bind:value={editData.businessSide.businessName} />
			{/if}
		{:else}
			<h2 class="card-name" class:is-client={isClientFace} class:is-business={!isClientFace}>
				{headerName}
			</h2>
		{/if}
		<div class="flag-row">
			{#if isEditing && editData && !isStandalone}
				<label class="flag-check">
					<input type="checkbox" bind:checked={editData.isCOI} /> COI
				</label>
				<label class="flag-check">
					<input type="checkbox" bind:checked={editData.isBNI} /> BNI
				</label>
			{:else}
				{#if card.isCOI}
					<span class="badge-coi">COI</span>
				{/if}
				{#if card.isBNI}
					<span class="badge-bni">BNI</span>
				{/if}
			{/if}
		</div>
	</div>

	<!-- Conditionally Render Fields based on Card Type -->
	{#if !isStandalone}
		<div class="field-stack">
			{#if isClientFace}
				{@render clientFace()}
			{:else}
				{@render businessFace()}
			{/if}
		</div>
	{:else}
		{@render standaloneNote()}
	{/if}

	{#if !isStandalone}
		{@render ratingBar()}
	{/if}

	{@render activityLog()}
{/snippet}

{#snippet questPanel()}
	<div class="quest-header">
		<h3 class="quest-title">
			<Sword size={20} /> Quest Actions
		</h3>
		{#if activeQuests.length > 0 && activeQuests.length < 3 && !isEditing}
			<RPGButton
				onclick={() => app.openStartQuest(card.id, sideKey)}
				class="text-xs px-3 py-2 flex items-center gap-1"
			>
				<Plus size={14} />
				{activeQuests.length === 1 ? 'Start Second Quest' : 'Start Third Quest'}
			</RPGButton>
		{/if}
	</div>

	{#if activeQuests.length > 0}
		<div class="quest-box">
			<div class="quest-tabs">
				{#each activeQuests as q, idx (q.id)}
					<button onclick={() => (questTab = idx)} class="quest-tab" class:active={questTab === idx}
						>{idx === 0 ? '1st Quest' : idx === 1 ? '2nd Quest' : '3rd Quest'}</button
					>
				{/each}
			</div>
			<div class="quest-content">
				{#if selectedQuest}
					{@const q = selectedQuest}
					<div class="animate-in fade-in duration-300">
						<div class="quest-detail-head">
							<div>
								<div class="quest-type">{q.type}</div>
								<div class="quest-due">
									{q.status === 'Cooldown' ? 'On Cooldown' : formatDisplayDate(q.dueDate)}
								</div>
							</div>
							<button
								onclick={() => app.trackQuest(card.id, sideKey, q.id)}
								class="track-btn"
								class:tracked={q.tracked}
							>
								{#if q.tracked}
									<CircleCheck size={12} />
								{:else}
									<div class="track-radio"></div>
								{/if}
								{q.tracked ? 'Tracking' : 'Track'}
							</button>
						</div>

						{#if q.status === 'Cooldown'}
							<div class="cooldown-box">
								<CooldownBar daysRemaining={getDaysOut(q.dueDate)} />
								<div class="cooldown-actions">
									<RPGButton
										variant="action"
										class="flex-1"
										onclick={() => app.cooldownAction(card.id, sideKey, q.id, 'Continue', {})}
										>Continue Quest</RPGButton
									>
									<RPGButton
										class="flex-1"
										onclick={() => app.cooldownAction(card.id, sideKey, q.id, 'Extend', {})}
										>Extend</RPGButton
									>
									<RPGButton
										variant="danger"
										class="flex-1"
										onclick={() => app.cooldownAction(card.id, sideKey, q.id, 'GiveUp', {})}
										>Give Up</RPGButton
									>
								</div>
							</div>
						{:else}
							<div class="active-actions">
								<RPGButton
									variant="action"
									class="flex-1 py-3 text-sm"
									onclick={() => app.openQuestResult(card.id, sideKey, q.id, 'Continue')}
									>Continue Quest</RPGButton
								>
								<RPGButton
									class="flex-1 py-3 text-sm"
									onclick={() => app.openQuestResult(card.id, sideKey, q.id, 'Complete')}
									>Complete</RPGButton
								>
								<RPGButton
									variant="danger"
									class="py-3 text-sm"
									onclick={() => app.cancelQuest(card.id, sideKey, q.id)}>Cancel</RPGButton
								>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	{:else}
		<div class="quest-empty">
			{#if isEditing}
				<div class="quest-empty-warn">
					<Ban size={32} class="mb-2" />
					Save Changes Before Starting New Quest
				</div>
			{:else}
				<p class="quest-empty-text">No active quests on {activeFace} card.</p>
				<RPGButton onclick={() => app.openStartQuest(card.id, sideKey)}>Start Quest</RPGButton>
			{/if}
		</div>
	{/if}
{/snippet}

<!-- ===================================================================== -->
<!-- Render                                                                  -->
<!-- ===================================================================== -->

{#if !expanded}
	<!-- ============================ COLLAPSED ROW ============================ -->
	{@render collapsedRow()}
{:else}
	<!-- ============================== EXPANDED ============================== -->
	<div use:autoScroll class="card-frame perspective-1000">
		<div
			class="card-shell transform-style-3d"
			class:fill-purple={colorKind === 'purple'}
			class:fill-emerald={colorKind === 'emerald'}
			class:fill-stone={colorKind === 'stone'}
			class:fill-blue={colorKind === 'blue'}
			class:fill-orange={colorKind === 'orange'}
			class:bd-purple={borderKind === 'purple'}
			class:bd-emerald={borderKind === 'emerald'}
			class:bd-stone={borderKind === 'stone'}
			class:bd-blue={borderKind === 'blue'}
			class:bd-orange={borderKind === 'orange'}
			class:bd-bni={borderKind === 'bni'}
			class:bd-coi={borderKind === 'coi'}
		>
			{@render cardHeader()}

			<div class="card-body">
				<!-- ===================== LEFT COLUMN (details) ===================== -->
				<div class="left-col">
					{@render leftColumn()}
				</div>

				<!-- ===================== RIGHT COLUMN (quests) ===================== -->
				<div class="right-col">
					{@render questPanel()}
				</div>
			</div>
		</div>
	</div>
{/if}

<style lang="postcss">
	/* ---------- Collapsed row ---------- */
	.collapsed-card {
		@apply relative mb-2 cursor-pointer rounded border-2 p-3 shadow-sm transition-all;
	}
	.collapsed-card:hover {
		@apply shadow-md;
	}
	.quest-dots {
		@apply absolute -left-4 top-1/2 flex -translate-y-1/2 flex-row items-center;
	}
	.quest-dot {
		@apply flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-bold text-white shadow-sm;
	}
	.dot-overlap {
		@apply -ml-2;
	}
	.collapsed-grid {
		@apply grid grid-cols-12 items-center gap-2;
	}
	.col-name {
		@apply col-span-3 flex flex-col justify-center overflow-hidden;
	}
	.col-phone {
		@apply col-span-2 flex flex-col justify-center overflow-hidden;
	}
	.col-note {
		@apply col-span-3 flex flex-col justify-center overflow-hidden;
	}
	.col-quest {
		@apply col-span-2 flex flex-col justify-center overflow-hidden;
	}
	.col-score {
		@apply col-span-1 flex flex-col justify-center text-center;
	}
	.col-due {
		@apply col-span-1 flex flex-col justify-center text-center;
	}
	.cell-label {
		@apply mb-0.5 text-[9px] font-bold uppercase tracking-wider text-stone-500;
	}
	.cell-name-value {
		@apply truncate font-serif font-bold text-[#2c241b];
	}
	.cell-phone-value {
		@apply truncate font-mono text-xs text-stone-600;
	}
	.cell-note-value {
		@apply truncate text-xs italic text-stone-600;
	}
	.cell-quest-value {
		@apply truncate text-xs font-bold text-[#8b4513];
	}
	.cell-score-value {
		@apply text-sm font-bold text-[#8b4513];
	}
	.due-badge-wrap {
		@apply flex justify-center;
	}
	.due-badge {
		@apply rounded border px-1.5 py-0.5 text-[10px] font-bold;
	}

	/* ---------- Expanded shell ---------- */
	.card-frame {
		@apply mb-6 scroll-mt-24;
	}
	.card-shell {
		@apply relative rounded-lg border-4 shadow-xl transition-all duration-500;
	}
	.card-header {
		@apply flex items-center justify-between border-b border-[#d4c5a9] bg-[#e8e4d9] p-2;
	}
	.header-left {
		@apply flex items-center gap-4;
	}
	.header-actions {
		@apply flex gap-2;
	}
	.type-label {
		@apply rounded px-3 py-1 font-serif text-lg font-bold;
	}
	.label-standalone {
		@apply bg-purple-800 text-white;
	}
	.label-client {
		@apply bg-emerald-800 text-white;
	}
	.label-business {
		@apply bg-blue-900 text-white;
	}
	.flip-btn {
		@apply flex items-center gap-1 rounded border-2 border-[#1a1008] bg-gradient-to-b from-[#5c4033] to-[#2c241b] px-3 py-1 font-serif text-xs font-bold tracking-wide text-[#f5deb3] shadow-[0_4px_4px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.5)] transition-all;
	}
	.flip-btn:hover {
		@apply brightness-110;
	}
	.primary-area {
		@apply flex items-center;
	}
	.primary-label {
		@apply ml-2 border-b-2 border-[#8b4513] px-2 text-xs font-bold text-[#8b4513];
	}
	.set-primary-btn {
		@apply ml-2 rounded border-2 border-[#b91c1c] bg-gradient-to-b from-[#fca5a5] to-[#ef4444] px-2 py-1 font-serif text-xs font-bold tracking-wide text-[#7f1d1d] shadow-[0_4px_4px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.5)] transition-all;
	}
	.set-primary-btn:hover {
		@apply brightness-110;
	}
	.merge-btn {
		@apply flex items-center gap-1 rounded border-2 border-stone-400 bg-stone-200 px-3 py-1 text-xs font-bold text-stone-700;
	}
	.merge-btn:hover {
		@apply bg-stone-300;
	}
	.icon-btn {
		@apply rounded p-1;
	}
	.icon-btn:hover {
		@apply bg-white;
	}
	.cancel-btn {
		@apply rounded px-3 py-1 text-xs font-bold text-red-700;
	}
	.cancel-btn:hover {
		@apply bg-red-100;
	}

	/* ---------- Body + columns ---------- */
	.card-body {
		@apply relative grid grid-cols-12 gap-6 p-6;
	}
	.left-col {
		@apply col-span-5 max-h-[500px] space-y-4 overflow-y-auto border-r border-[#d4c5a9] pr-6;
	}
	.right-col {
		@apply col-span-7;
	}

	/* ---------- Left column: identity + fields ---------- */
	.name-input-client {
		@apply w-full border bg-white p-1 font-serif text-2xl font-bold text-[#2c241b];
	}
	.name-input-business {
		@apply w-full border bg-white p-1 font-serif text-2xl font-bold text-blue-800;
	}
	.card-name {
		@apply font-serif text-2xl font-bold;
	}
	.card-name.is-client {
		@apply text-[#2c241b];
	}
	.card-name.is-business {
		@apply text-blue-900;
	}
	.flag-row {
		@apply mt-2 flex gap-2;
	}
	.flag-check {
		@apply flex items-center gap-1 text-[10px] font-bold;
	}
	.badge-coi {
		@apply rounded border border-slate-400 bg-slate-200 px-2 text-[10px] font-bold text-slate-700;
	}
	.badge-bni {
		@apply rounded border border-amber-400 bg-amber-100 px-2 text-[10px] font-bold text-amber-700;
	}
	.field-stack {
		@apply space-y-3 text-sm;
	}
	.field-grid {
		@apply grid grid-cols-2 gap-2;
	}
	.field-label {
		@apply text-[10px] font-bold uppercase text-stone-500;
	}
	.field-box-label {
		@apply mb-1 block text-[10px] font-bold uppercase text-stone-500;
	}
	.field-input {
		@apply w-full border p-1 text-xs;
	}
	.val-mono {
		@apply font-mono;
	}
	.val-truncate {
		@apply truncate;
	}
	.field-box {
		@apply rounded border border-[#d4c5a9] bg-white p-2;
	}
	.check-grid {
		@apply grid grid-cols-2 gap-x-2 gap-y-1 border p-1;
	}
	.check {
		@apply flex items-center gap-1 text-[10px];
	}
	.tag-list {
		@apply flex flex-wrap gap-1;
	}
	.tag {
		@apply rounded px-1 text-[10px];
	}
	.tag-emerald {
		@apply bg-emerald-100 text-emerald-800;
	}
	.tag-blue {
		@apply bg-blue-100 text-blue-800;
	}
	.tag-none {
		@apply text-xs text-stone-400;
	}
	.standalone-note {
		@apply rounded border-2 border-purple-200 bg-purple-50 p-4 text-center text-sm text-purple-900;
	}
	.standalone-title {
		@apply mb-2 font-bold;
	}
	.standalone-text {
		@apply italic;
	}

	/* ---------- Relationship + rating ---------- */
	.rel-section {
		@apply border-t border-[#d4c5a9] pt-4;
	}
	.rel-header {
		@apply mb-1 flex justify-between text-xs font-bold;
	}
	.rating-box {
		@apply mt-4 rounded border border-stone-200 bg-stone-100 p-2;
	}
	.rating-range {
		@apply w-full accent-[#8b4513];
	}
	.rating-note {
		@apply mt-1 text-right text-[9px] text-stone-500;
	}

	/* ---------- Activity log ---------- */
	.log-section {
		@apply mt-8 border-t-2 border-[#d4c5a9] pt-4;
	}
	.log-title {
		@apply mb-2 flex items-center gap-2 font-serif text-lg font-bold text-[#5d4037];
	}
	.log-box {
		@apply max-h-48 overflow-y-auto rounded-lg border border-[#d4c5a9] bg-white p-2;
	}
	.log-entry {
		@apply border-b border-stone-100 py-1 text-xs;
	}
	.log-entry:last-child {
		@apply border-0;
	}
	.log-date {
		@apply font-bold text-[#8b4513];
	}
	.log-xp {
		@apply ml-1 font-bold text-green-600;
	}
	.log-empty {
		@apply py-2 text-center text-xs italic text-stone-400;
	}

	/* ---------- Right column: quest panel ---------- */
	.quest-header {
		@apply mb-4 flex items-center justify-between;
	}
	.quest-title {
		@apply flex items-center gap-2 font-serif text-xl font-bold text-[#8b4513];
	}
	.quest-box {
		@apply overflow-hidden rounded border-2 border-[#d4c5a9] bg-white shadow-inner;
	}
	.quest-tabs {
		@apply flex border-b border-[#d4c5a9] bg-[#e8e4d9];
	}
	.quest-tab {
		@apply flex-1 py-2 text-xs font-bold uppercase transition-colors;
	}
	.quest-tab.active {
		@apply border-t-4 border-[#8b4513] bg-white text-[#8b4513];
	}
	.quest-tab:not(.active) {
		@apply text-stone-500;
	}
	.quest-tab:not(.active):hover {
		@apply bg-[#f0ece3];
	}
	.quest-content {
		@apply p-6;
	}
	.quest-detail-head {
		@apply mb-6 flex items-start justify-between;
	}
	.quest-type {
		@apply font-serif text-2xl font-bold text-[#2c241b];
	}
	.quest-due {
		@apply mt-1 text-sm font-bold text-stone-500;
	}
	.track-btn {
		@apply flex items-center gap-1 rounded border-2 px-3 py-1 font-serif text-xs font-bold tracking-wide shadow-[0_4px_4px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.5)] transition-all;
	}
	.track-btn.tracked {
		@apply border-[#5c3a1e] bg-gradient-to-b from-[#a05a2c] to-[#8b4513] text-white;
	}
	.track-btn:not(.tracked) {
		@apply border-stone-300 bg-gradient-to-b from-white to-stone-100 text-stone-400;
	}
	.track-btn:not(.tracked):hover {
		@apply border-[#8b4513] text-[#8b4513];
	}
	.track-radio {
		@apply h-3 w-3 rounded-full border border-current;
	}
	.cooldown-box {
		@apply mb-4 rounded border border-blue-200 bg-blue-50 p-4;
	}
	.cooldown-actions {
		@apply mt-4 flex gap-2;
	}
	.active-actions {
		@apply mt-6 flex gap-3;
	}
	.quest-empty {
		@apply rounded border-2 border-dashed border-[#d4c5a9] bg-[#fdfbf7] p-12 text-center;
	}
	.quest-empty-warn {
		@apply flex flex-col items-center font-bold text-red-700;
	}
	.quest-empty-text {
		@apply mb-4 italic text-stone-400;
	}

	/* ---------- Card-type colors (fill = gradient + shadow tint) ---------- */
	/* Defined after the base shells so BNI/COI border-4 wins over border-2. */
	.fill-purple {
		@apply bg-gradient-to-br from-purple-100 to-purple-200 shadow-purple-100;
	}
	.fill-emerald {
		@apply bg-gradient-to-br from-emerald-100 to-emerald-200 shadow-emerald-100;
	}
	.fill-stone {
		@apply bg-gradient-to-br from-stone-200 to-stone-300 shadow-stone-200;
	}
	.fill-blue {
		@apply bg-gradient-to-br from-blue-100 to-blue-200 shadow-blue-100;
	}
	.fill-orange {
		@apply bg-gradient-to-br from-orange-100 to-orange-200 shadow-orange-100;
	}
	.bd-purple {
		@apply border-purple-600;
	}
	.bd-emerald {
		@apply border-emerald-600;
	}
	.bd-stone {
		@apply border-stone-500;
	}
	.bd-blue {
		@apply border-blue-600;
	}
	.bd-orange {
		@apply border-orange-700;
	}
	.bd-bni {
		@apply border-4 border-yellow-500;
	}
	.bd-coi {
		@apply border-4 border-slate-700;
	}
</style>
