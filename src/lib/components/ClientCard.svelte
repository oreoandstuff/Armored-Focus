<script lang="ts">
	// The central client card (SPEC §3.1), rebuilt to visually match the React
	// prototype's ClientCard 1:1. Collapsed = compact 12-col row; expanded = full
	// editable card with quest actions. The only prop is the card itself; all
	// persistence/mutations go through the `app` store.
	import { app } from '$lib/state.svelte';
	import type { Card, SideKey, Quest } from '$lib/core/types';
	import { METALLIC_FONT, METALLIC_SHADOW } from '$lib/theme';
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
		card.primarySide === 'Business' ? 'Business' : 'Client'
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
	const hasPolicies = $derived(sideData.lob && sideData.lob.length > 0);
	const cardBg = $derived.by(() => {
		if (isStandalone) return 'bg-gradient-to-br from-purple-100 to-purple-200 shadow-purple-100';
		if (isClientFace)
			return hasPolicies
				? 'bg-gradient-to-br from-emerald-100 to-emerald-200 shadow-emerald-100'
				: 'bg-gradient-to-br from-stone-200 to-stone-300 shadow-stone-200';
		return hasPolicies
			? 'bg-gradient-to-br from-blue-100 to-blue-200 shadow-blue-100'
			: 'bg-gradient-to-br from-orange-100 to-orange-200 shadow-orange-100';
	});
	const baseBorder = $derived.by(() => {
		if (isStandalone) return 'border-purple-600';
		if (isClientFace) return hasPolicies ? 'border-emerald-600' : 'border-stone-500';
		return hasPolicies ? 'border-blue-600' : 'border-orange-700';
	});
	const borderColor = $derived(
		card.isBNI ? 'border-4 border-yellow-500' : card.isCOI ? 'border-4 border-slate-700' : baseBorder
	);

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

{#if !expanded}
	<!-- ============================ COLLAPSED ROW ============================ -->
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
		class="relative p-3 mb-2 rounded shadow-sm border-2 {borderColor} {cardBg} cursor-pointer hover:shadow-md transition-all"
	>
		<!-- Active Quest Indicators -->
		{#if activeQuests.length > 0}
			<div class="absolute -left-4 top-1/2 -translate-y-1/2 flex flex-row items-center">
				{#each activeQuests as q, i (q.id)}
					<div
						class="w-6 h-6 rounded-full border-2 flex items-center justify-center text-white font-bold text-xs shadow-sm {questDotClass(
							q
						)} {i > 0 ? '-ml-2' : ''}"
						style="z-index: {10 - i};"
						title={`${q.type} - Due ${formatDisplayDate(q.dueDate)}`}
					>
						!
					</div>
				{/each}
			</div>
		{/if}

		<div class="grid grid-cols-12 gap-2 items-center">
			<!-- 1. Name -->
			<div class="col-span-3 overflow-hidden flex flex-col justify-center">
				<span class="text-[9px] text-stone-500 font-bold uppercase tracking-wider mb-0.5">Name</span>
				<div class="font-serif font-bold text-[#2c241b] truncate" title={displayCardName}>
					{displayCardName || '-'}
				</div>
			</div>

			<!-- 2. Phone -->
			<div class="col-span-2 overflow-hidden flex flex-col justify-center">
				<span class="text-[9px] text-stone-500 font-bold uppercase tracking-wider mb-0.5">Phone</span>
				<div class="text-xs text-stone-600 font-mono truncate">
					{displayCardPhone ? formatPhoneNumber(displayCardPhone) : '-'}
				</div>
			</div>

			<!-- 3. Notes -->
			<div class="col-span-3 overflow-hidden flex flex-col justify-center">
				<span class="text-[9px] text-stone-500 font-bold uppercase tracking-wider mb-0.5"
					>Latest Note</span
				>
				<div class="text-xs text-stone-600 truncate italic">
					{trackedQuest && trackedQuest.notes && trackedQuest.notes.length > 0
						? `"${trackedQuest.notes[trackedQuest.notes.length - 1].text}"`
						: '-'}
				</div>
			</div>

			<!-- 4. Quest Type -->
			<div class="col-span-2 overflow-hidden flex flex-col justify-center">
				<span class="text-[9px] text-stone-500 font-bold uppercase tracking-wider mb-0.5"
					>Current Quest</span
				>
				<div class="text-xs font-bold text-[#8b4513] truncate">
					{trackedQuest ? trackedQuest.type : '-'}
				</div>
			</div>

			<!-- 5. Relationship Score -->
			<div class="col-span-1 flex flex-col justify-center text-center">
				<span class="text-[9px] text-stone-500 font-bold uppercase tracking-wider mb-0.5">Score</span>
				<div class="font-bold text-[#8b4513] text-sm">
					{!isStandalone ? `${card.relationshipScore}` : '-'}
				</div>
			</div>

			<!-- 6. Due Date (Badge) -->
			<div class="col-span-1 flex flex-col justify-center text-center">
				<span class="text-[9px] text-stone-500 font-bold uppercase tracking-wider mb-0.5">Due</span>
				<div class="flex justify-center">
					<span
						class="text-[10px] font-bold px-1.5 py-0.5 rounded border {dueBadgeClass(trackedQuest)}"
					>
						{dueBadgeLabel(trackedQuest)}
					</span>
				</div>
			</div>
		</div>
	</div>
{:else}
	<!-- ============================== EXPANDED ============================== -->
	<div use:autoScroll class="mb-6 perspective-1000 scroll-mt-24">
		<div
			class="relative rounded-lg shadow-xl border-4 {borderColor} {cardBg} transition-all duration-500 transform-style-3d"
		>
			<!-- Header bar -->
			<div class="bg-[#e8e4d9] border-b border-[#d4c5a9] p-2 flex justify-between items-center">
				<div class="flex items-center gap-4">
					<span
						class="font-serif font-bold text-lg px-3 py-1 rounded {isStandalone
							? 'bg-purple-800 text-white'
							: isClientFace
								? 'bg-emerald-800 text-white'
								: 'bg-blue-900 text-white'}">{typeLabel}</span
					>

					{#if !isEditing && !isStandalone}
						<button
							onclick={flipFace}
							class="px-3 py-1 rounded text-xs font-bold flex items-center gap-1 hover:brightness-110 transition-all border-2 border-[#1a1008] bg-gradient-to-b from-[#5c4033] to-[#2c241b] text-[#f5deb3] {METALLIC_SHADOW} {METALLIC_FONT}"
						>
							<RotateCcw size={14} /> Flip Card
						</button>

						<div class="flex items-center">
							{#if isPrimarySide}
								<span class="text-xs font-bold text-[#8b4513] border-b-2 border-[#8b4513] px-2 ml-2"
									>Primary</span
								>
							{:else}
								<button
									onclick={() => app.setPrimary(card.id, visibleFace)}
									class="ml-2 text-xs font-bold px-2 py-1 rounded border-2 border-[#b91c1c] bg-gradient-to-b from-[#fca5a5] to-[#ef4444] text-[#7f1d1d] hover:brightness-110 transition-all {METALLIC_SHADOW} {METALLIC_FONT}"
									>Set as Primary?</button
								>
							{/if}
						</div>
					{/if}
				</div>

				<div class="flex gap-2">
					{#if !isStandalone}
						<button
							onclick={() => app.openMerge(card.id)}
							class="px-3 py-1 rounded text-xs font-bold flex items-center gap-1 bg-stone-200 border-2 border-stone-400 hover:bg-stone-300 text-stone-700"
						>
							<Merge size={14} /> Merge
						</button>
					{/if}

					{#if !isEditing}
						<button onclick={startEdit} aria-label="Edit card" class="p-1 hover:bg-white rounded">
							<SquarePen size={18} />
						</button>
						<button onclick={onToggle} aria-label="Close card" class="p-1 hover:bg-white rounded">
							<X size={18} />
						</button>
					{:else}
						<button
							onclick={cancelEdit}
							class="text-xs font-bold text-red-700 hover:bg-red-100 px-3 py-1 rounded"
							>Cancel Changes</button
						>
						<RPGButton variant="primary" onclick={saveEdit} class="text-xs px-3 py-1">Save</RPGButton>
					{/if}
				</div>
			</div>

			<div class="p-6 grid grid-cols-12 gap-6 relative">
				<!-- ===================== LEFT COLUMN (details) ===================== -->
				<div
					class="col-span-5 border-r border-[#d4c5a9] pr-6 space-y-4 max-h-[500px] overflow-y-auto"
				>
					<div>
						{#if isEditing && editData}
							{#if isClientFace}
								<input
									class="text-2xl font-serif font-bold text-[#2c241b] w-full bg-white border p-1"
									bind:value={editData.name}
								/>
							{:else}
								<input
									class="text-2xl font-serif font-bold text-blue-800 w-full bg-white border p-1"
									bind:value={editData.businessSide.businessName}
								/>
							{/if}
						{:else}
							<h2 class="text-2xl font-serif font-bold {isClientFace ? 'text-[#2c241b]' : 'text-blue-900'}">
								{headerName}
							</h2>
						{/if}
						<div class="flex gap-2 mt-2">
							{#if isEditing && editData && !isStandalone}
								<label class="flex items-center gap-1 text-[10px] font-bold">
									<input type="checkbox" bind:checked={editData.isCOI} /> COI
								</label>
								<label class="flex items-center gap-1 text-[10px] font-bold">
									<input type="checkbox" bind:checked={editData.isBNI} /> BNI
								</label>
							{:else}
								{#if card.isCOI}
									<span
										class="text-[10px] bg-slate-200 border border-slate-400 px-2 rounded font-bold text-slate-700"
										>COI</span
									>
								{/if}
								{#if card.isBNI}
									<span
										class="text-[10px] bg-amber-100 border border-amber-400 px-2 rounded font-bold text-amber-700"
										>BNI</span
									>
								{/if}
							{/if}
						</div>
					</div>

					<!-- Conditionally Render Fields based on Card Type -->
					{#if !isStandalone}
						<div class="space-y-3 text-sm">
							{#if isClientFace}
								<div class="grid grid-cols-2 gap-2">
									<div>
										<label class="text-[10px] font-bold text-stone-500 uppercase">Phone</label>
										{#if isEditing && editData}
											<input class="w-full text-xs border p-1" bind:value={editData.phone} />
										{:else}
											<div class="font-mono">{formatPhoneNumber(activeData.phone)}</div>
										{/if}
									</div>
									<div>
										<label class="text-[10px] font-bold text-stone-500 uppercase">DOB</label>
										{#if isEditing && editData}
											<input class="w-full text-xs border p-1" type="date" bind:value={editData.dob} />
										{:else}
											<div>{activeData.dob || '-'}</div>
										{/if}
									</div>
								</div>
								<div>
									<label class="text-[10px] font-bold text-stone-500 uppercase">Email</label>
									{#if isEditing && editData}
										<input class="w-full text-xs border p-1" bind:value={editData.email} />
									{:else}
										<div class="truncate">{activeData.email}</div>
									{/if}
								</div>
								<div>
									<label class="text-[10px] font-bold text-stone-500 uppercase">Address</label>
									{#if isEditing && editData}
										<input class="w-full text-xs border p-1" bind:value={editData.address} />
									{:else}
										<div class="truncate">{activeData.address}</div>
									{/if}
								</div>
								<div>
									<label class="text-[10px] font-bold text-stone-500 uppercase">Residence</label>
									{#if isEditing && editData}
										<select class="w-full text-xs border p-1" bind:value={editData.residenceType}>
											{#each RESIDENCE_OPTIONS as r}<option value={r}>{r}</option>{/each}
										</select>
									{:else}
										<div>{activeData.residenceType}</div>
									{/if}
								</div>

								<div class="bg-white p-2 rounded border border-[#d4c5a9]">
									<label class="text-[10px] font-bold text-stone-500 uppercase block mb-1"
										>Line of Business</label
									>
									{#if isEditing}
										<div class="grid grid-cols-2 gap-x-2 gap-y-1 border p-1">
											{#each CLIENT_LOB_OPTIONS as lob}
												<label class="flex items-center gap-1 text-[10px]">
													<input
														type="checkbox"
														checked={activeSideData.lob.includes(lob)}
														onchange={() => toggleArrayItem('Client', 'lob', lob)}
													/>
													{lob}
												</label>
											{/each}
										</div>
									{:else}
										<div class="flex flex-wrap gap-1">
											{#if activeSideData.lob.length > 0}
												{#each activeSideData.lob as l}
													<span class="text-[10px] bg-emerald-100 text-emerald-800 px-1 rounded">{l}</span>
												{/each}
											{:else}
												<span class="text-xs text-stone-400">None</span>
											{/if}
										</div>
									{/if}
								</div>
								<div class="bg-white p-2 rounded border border-[#d4c5a9]">
									<label class="text-[10px] font-bold text-stone-500 uppercase block mb-1">Carriers</label>
									{#if isEditing}
										<div class="grid grid-cols-2 gap-x-2 gap-y-1 border p-1">
											{#each CLIENT_CARRIER_OPTIONS as c}
												<label class="flex items-center gap-1 text-[10px]">
													<input
														type="checkbox"
														checked={activeSideData.carriers.includes(c)}
														onchange={() => toggleArrayItem('Client', 'carriers', c)}
													/>
													{c}
												</label>
											{/each}
										</div>
									{:else}
										<div class="flex flex-wrap gap-1">
											{#if activeSideData.carriers.length > 0}
												{#each activeSideData.carriers as c}
													<span class="text-[10px] bg-blue-100 text-blue-800 px-1 rounded">{c}</span>
												{/each}
											{:else}
												<span class="text-xs text-stone-400">None</span>
											{/if}
										</div>
									{/if}
								</div>
							{:else}
								<div class="grid grid-cols-2 gap-2">
									<div>
										<label class="text-[10px] font-bold text-stone-500 uppercase">Phone</label>
										{#if isEditing && editData}
											<input class="w-full text-xs border p-1" bind:value={editData.businessSide.phone} />
										{:else}
											<div class="font-mono">{formatPhoneNumber(activeData.businessSide.phone ?? '')}</div>
										{/if}
									</div>
									<div>
										<label class="text-[10px] font-bold text-stone-500 uppercase">EIN</label>
										{#if isEditing && editData}
											<input class="w-full text-xs border p-1" bind:value={editData.businessSide.ein} />
										{:else}
											<div>{activeData.businessSide.ein || '-'}</div>
										{/if}
									</div>
								</div>
								<div>
									<label class="text-[10px] font-bold text-stone-500 uppercase">Est.</label>
									{#if isEditing && editData}
										<input class="w-full text-xs border p-1" bind:value={editData.businessSide.established} />
									{:else}
										<div>{activeData.businessSide.established || '-'}</div>
									{/if}
								</div>
								<div>
									<label class="text-[10px] font-bold text-stone-500 uppercase">Occupancy</label>
									{#if isEditing && editData}
										<select class="w-full text-xs border p-1" bind:value={editData.businessSide.occupancy}>
											{#each OCCUPANCY_OPTIONS as o}<option value={o}>{o}</option>{/each}
										</select>
									{:else}
										<div>{activeData.businessSide.occupancy}</div>
									{/if}
								</div>
								<div class="bg-white p-2 rounded border border-[#d4c5a9]">
									<label class="text-[10px] font-bold text-stone-500 uppercase block mb-1"
										>Business Lines</label
									>
									{#if isEditing}
										<div class="grid grid-cols-2 gap-x-2 gap-y-1 border p-1">
											{#each BUSINESS_LOB_OPTIONS as lob}
												<label class="flex items-center gap-1 text-[10px]">
													<input
														type="checkbox"
														checked={activeSideData.lob.includes(lob)}
														onchange={() => toggleArrayItem('Business', 'lob', lob)}
													/>
													{lob}
												</label>
											{/each}
										</div>
									{:else}
										<div class="flex flex-wrap gap-1">
											{#if activeSideData.lob.length > 0}
												{#each activeSideData.lob as l}
													<span class="text-[10px] bg-blue-100 text-blue-800 px-1 rounded">{l}</span>
												{/each}
											{:else}
												<span class="text-xs text-stone-400">None</span>
											{/if}
										</div>
									{/if}
								</div>
								<div class="bg-white p-2 rounded border border-[#d4c5a9]">
									<label class="text-[10px] font-bold text-stone-500 uppercase block mb-1"
										>Business Carriers</label
									>
									{#if isEditing}
										<div class="grid grid-cols-2 gap-x-2 gap-y-1 border p-1">
											{#each BUSINESS_CARRIER_OPTIONS as c}
												<label class="flex items-center gap-1 text-[10px]">
													<input
														type="checkbox"
														checked={activeSideData.carriers.includes(c)}
														onchange={() => toggleArrayItem('Business', 'carriers', c)}
													/>
													{c}
												</label>
											{/each}
										</div>
									{:else}
										<div class="flex flex-wrap gap-1">
											{#if activeSideData.carriers.length > 0}
												{#each activeSideData.carriers as c}
													<span class="text-[10px] bg-blue-100 text-blue-800 px-1 rounded">{c}</span>
												{/each}
											{:else}
												<span class="text-xs text-stone-400">None</span>
											{/if}
										</div>
									{/if}
								</div>
							{/if}
						</div>
					{:else}
						<div
							class="p-4 bg-purple-50 border-2 border-purple-200 rounded text-center text-sm text-purple-900"
						>
							<p class="font-bold mb-2">Standalone Quest</p>
							<p class="italic">
								This is a temporary card for a one-off task. It will be removed upon completion.
							</p>
						</div>
					{/if}

					{#if !isStandalone}
						<div class="pt-4 border-t border-[#d4c5a9]">
							<div class="flex justify-between text-xs font-bold mb-1">
								<span>Relationship Score</span><span>{activeData.relationshipScore}/100</span>
							</div>
							<RelationshipBar score={activeData.relationshipScore} />
							{#if isEditing}
								<div class="mt-4 bg-stone-100 p-2 rounded border border-stone-200">
									<div class="flex justify-between text-xs font-bold mb-1">
										<span>User Rating</span><span>{activeData.userRating || 0} / 5</span>
									</div>
									<input
										type="range"
										min="0"
										max="5"
										step="1"
										class="w-full accent-[#8b4513]"
										value={activeData.userRating || 0}
										onchange={(e) => handleUserRatingChange(e.currentTarget.value)}
									/>
									<div class="text-[9px] text-stone-500 text-right mt-1">
										+{(activeData.userRating || 0) * 10} Score Points
									</div>
								</div>
							{/if}
						</div>
					{/if}

					<!-- Activity Log -->
					<div class="mt-8 border-t-2 border-[#d4c5a9] pt-4">
						<h3 class="font-serif font-bold text-lg text-[#5d4037] flex items-center gap-2 mb-2">
							<Scroll size={18} />
							{activeFace} Activity Log
						</h3>
						<div class="bg-white border border-[#d4c5a9] rounded-lg p-2 max-h-48 overflow-y-auto">
							{#if activeSideData.logs && activeSideData.logs.length > 0}
								{#each activeSideData.logs as log, i (log.id || i)}
									<div class="text-xs py-1 border-b border-stone-100 last:border-0">
										<span class="font-bold text-[#8b4513]">{formatDisplayDate(log.date)}</span> - {log.questType}
										{#if log.exp > 0}
											<span class="text-green-600 font-bold ml-1">+{log.exp} XP</span>
										{/if}
									</div>
								{/each}
							{:else}
								<div class="text-xs text-stone-400 italic text-center py-2">
									No activity recorded yet.
								</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- ===================== RIGHT COLUMN (quests) ===================== -->
				<div class="col-span-7">
					<div class="flex justify-between items-center mb-4">
						<h3 class="font-serif font-bold text-xl text-[#8b4513] flex items-center gap-2">
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
						<div
							class="border-2 border-[#d4c5a9] rounded bg-white overflow-hidden shadow-inner"
						>
							<div class="flex bg-[#e8e4d9] border-b border-[#d4c5a9]">
								{#each activeQuests as q, idx (q.id)}
									<button
										onclick={() => (questTab = idx)}
										class="flex-1 py-2 text-xs font-bold uppercase transition-colors {questTab === idx
											? 'bg-white text-[#8b4513] border-t-4 border-[#8b4513]'
											: 'text-stone-500 hover:bg-[#f0ece3]'}"
										>{idx === 0 ? '1st Quest' : idx === 1 ? '2nd Quest' : '3rd Quest'}</button
									>
								{/each}
							</div>
							<div class="p-6">
								{#if selectedQuest}
									{@const q = selectedQuest}
									<div class="animate-in fade-in duration-300">
										<div class="flex justify-between items-start mb-6">
											<div>
												<div class="text-2xl font-bold text-[#2c241b] font-serif">{q.type}</div>
												<div class="text-sm font-bold text-stone-500 mt-1">
													{q.status === 'Cooldown' ? 'On Cooldown' : formatDisplayDate(q.dueDate)}
												</div>
											</div>
											<button
												onclick={() => app.trackQuest(card.id, sideKey, q.id)}
												class="text-xs px-3 py-1 rounded border-2 font-bold flex items-center gap-1 transition-all {q.tracked
													? 'bg-gradient-to-b from-[#a05a2c] to-[#8b4513] text-white border-[#5c3a1e]'
													: 'bg-gradient-to-b from-white to-stone-100 text-stone-400 border-stone-300 hover:border-[#8b4513] hover:text-[#8b4513]'} {METALLIC_SHADOW} {METALLIC_FONT}"
											>
												{#if q.tracked}
													<CircleCheck size={12} />
												{:else}
													<div class="w-3 h-3 rounded-full border border-current"></div>
												{/if}
												{q.tracked ? 'Tracking' : 'Track'}
											</button>
										</div>

										{#if q.status === 'Cooldown'}
											<div class="bg-blue-50 p-4 rounded border border-blue-200 mb-4">
												<CooldownBar daysRemaining={getDaysOut(q.dueDate)} />
												<div class="flex gap-2 mt-4">
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
											<div class="flex gap-3 mt-6">
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
						<div
							class="p-12 border-2 border-dashed border-[#d4c5a9] rounded text-center bg-[#fdfbf7]"
						>
							{#if isEditing}
								<div class="text-red-700 font-bold flex flex-col items-center">
									<Ban size={32} class="mb-2" />
									Save Changes Before Starting New Quest
								</div>
							{:else}
								<p class="text-stone-400 italic mb-4">No active quests on {activeFace} card.</p>
								<RPGButton onclick={() => app.openStartQuest(card.id, sideKey)}>Start Quest</RPGButton>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
