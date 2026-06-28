<script lang="ts">
	// Draw Card modal (SPEC §2.5.1, §3.1) — create a new client/business card.
	// Self-gates on `app.modals.drawCard` and writes to the `app` store directly.
	import { X } from '@lucide/svelte';
	import { app } from '$lib/state.svelte';
	import { THEME } from '$lib/theme';
	import { RESIDENCE_OPTIONS, OCCUPANCY_OPTIONS } from '$lib/core/rules';
	import type { Card, ResidenceType, Occupancy } from '$lib/core/types';
	import RPGButton from '$lib/components/RPGButton.svelte';

	const inputStyle = `background: ${THEME.inputBg}; border-color: ${THEME.border}; color: ${THEME.text};`;
	const CARD_TYPES = ['Client', 'Business'] as const;

	let cardType = $state<'Client' | 'Business'>('Client');
	let name = $state('');
	let phone = $state('');
	let email = $state('');
	let address = $state('');
	let mailingAddress = $state('');
	let dob = $state('');
	let license = $state('');
	let residence = $state<ResidenceType>('Homeowner');

	// Business-only fields
	let businessName = $state('');
	let ein = $state('');
	let established = $state('');
	let occupancy = $state<Occupancy>('Own');

	// Reset the form whenever the modal opens.
	$effect(() => {
		if (app.modals.drawCard) {
			cardType = 'Client';
			name = '';
			phone = '';
			email = '';
			address = '';
			mailingAddress = '';
			dob = '';
			license = '';
			residence = 'Homeowner';
			businessName = '';
			ein = '';
			established = '';
			occupancy = 'Own';
		}
	});

	function save() {
		const partial: Partial<Card> = {
			primarySide: cardType,
			name: name.trim(),
			phone,
			email,
			address,
			mailingAddress,
			dob,
			license,
			residenceType: residence
		};
		if (cardType === 'Business') {
			partial.businessSide = {
				notes: [],
				logs: [],
				quests: [],
				lob: [],
				carriers: [],
				businessName,
				phone: '',
				ein,
				established,
				occupancy
			};
		}
		app.drawCard(partial); // drawCard closes the modal itself
	}
</script>

{#if app.modals.drawCard}
	<div
		class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur"
		role="dialog"
		aria-modal="true"
		aria-label="Draw Card"
	>
		<div
			class="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border-2 shadow-2xl"
			style="background: {THEME.panel}; border-color: {THEME.border};"
		>
			<!-- Leather header -->
			<div
				class="flex items-center justify-between px-5 py-3"
				style="background: {THEME.headerBg}; color: {THEME.headerText};"
			>
				<h2 class="font-serif text-xl font-bold tracking-wide">Draw a New Card</h2>
				<button onclick={() => app.closeModals()} aria-label="Close" class="hover:brightness-125">
					<X size={22} />
				</button>
			</div>

			<!-- Body -->
			<div class="overflow-y-auto p-5" style="color: {THEME.text};">
				<!-- Card type toggle -->
				<div class="mb-4 flex gap-2">
					{#each CARD_TYPES as t}
						<button
							onclick={() => (cardType = t)}
							class="flex-1 rounded border-2 py-2 font-serif font-bold transition"
							style="border-color: {THEME.border}; {cardType === t
								? `background: ${THEME.accent}; color: #fff;`
								: `background: ${THEME.inputBg}; color: ${THEME.text};`}"
						>
							{t} Card
						</button>
					{/each}
				</div>

				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<label class="flex flex-col gap-1 text-sm font-bold">
						Name
						<input class="rounded border px-2 py-1 font-normal" style={inputStyle} bind:value={name} />
					</label>
					<label class="flex flex-col gap-1 text-sm font-bold">
						Phone
						<input class="rounded border px-2 py-1 font-normal" style={inputStyle} bind:value={phone} />
					</label>
					<label class="flex flex-col gap-1 text-sm font-bold">
						Email
						<input class="rounded border px-2 py-1 font-normal" style={inputStyle} bind:value={email} />
					</label>
					<label class="flex flex-col gap-1 text-sm font-bold">
						Date of Birth
						<input type="date" class="rounded border px-2 py-1 font-normal" style={inputStyle} bind:value={dob} />
					</label>
					<label class="flex flex-col gap-1 text-sm font-bold">
						Address
						<input class="rounded border px-2 py-1 font-normal" style={inputStyle} bind:value={address} />
					</label>
					<label class="flex flex-col gap-1 text-sm font-bold">
						Mailing Address
						<input class="rounded border px-2 py-1 font-normal" style={inputStyle} bind:value={mailingAddress} />
					</label>
					<label class="flex flex-col gap-1 text-sm font-bold">
						Driver's License #
						<input class="rounded border px-2 py-1 font-normal" style={inputStyle} bind:value={license} />
					</label>
					<label class="flex flex-col gap-1 text-sm font-bold">
						Residence
						<select class="rounded border px-2 py-1 font-normal" style={inputStyle} bind:value={residence}>
							{#each RESIDENCE_OPTIONS as r}
								<option value={r}>{r}</option>
							{/each}
						</select>
					</label>
				</div>

				{#if cardType === 'Business'}
					<h3 class="mb-2 mt-5 font-serif text-lg font-bold" style="color: {THEME.accent};">
						Business Details
					</h3>
					<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<label class="flex flex-col gap-1 text-sm font-bold">
							Business Name
							<input class="rounded border px-2 py-1 font-normal" style={inputStyle} bind:value={businessName} />
						</label>
						<label class="flex flex-col gap-1 text-sm font-bold">
							EIN
							<input class="rounded border px-2 py-1 font-normal" style={inputStyle} bind:value={ein} />
						</label>
						<label class="flex flex-col gap-1 text-sm font-bold">
							Established
							<input class="rounded border px-2 py-1 font-normal" style={inputStyle} bind:value={established} />
						</label>
						<label class="flex flex-col gap-1 text-sm font-bold">
							Occupancy
							<select class="rounded border px-2 py-1 font-normal" style={inputStyle} bind:value={occupancy}>
								{#each OCCUPANCY_OPTIONS as o}
									<option value={o}>{o}</option>
								{/each}
							</select>
						</label>
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div
				class="flex justify-end gap-2 border-t px-5 py-3"
				style="border-color: {THEME.border};"
			>
				<RPGButton variant="primary" onclick={() => app.closeModals()}>Cancel</RPGButton>
				<RPGButton variant="action" disabled={name.trim() === ''} onclick={save}>Draw Card</RPGButton>
			</div>
		</div>
	</div>
{/if}
