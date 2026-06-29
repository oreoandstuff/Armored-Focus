<script lang="ts">
	// Draw Card modal (SPEC §2.5.1, §3.1) — create a new client/business card.
	// Self-gates on `app.modals.drawCard` and writes to the `app` store directly.
	// Markup mirrors the React prototype's Draw Card Modal (App.jsx 1758–1864).
	import { X, UserPlus, Briefcase } from '@lucide/svelte';
	import { app } from '$lib/state.svelte';
	import {
		RESIDENCE_OPTIONS,
		OCCUPANCY_OPTIONS,
		CLIENT_LOB_OPTIONS,
		CLIENT_CARRIER_OPTIONS,
		BUSINESS_LOB_OPTIONS,
		BUSINESS_CARRIER_OPTIONS
	} from '$lib/core/rules';
	import type { Card, ResidenceType, Occupancy } from '$lib/core/types';
	import RPGButton from '$lib/components/RPGButton.svelte';

	let primarySide = $state<'Client' | 'Business'>('Client');

	// Client-side fields
	let name = $state('');
	let phone = $state('');
	let email = $state('');
	let address = $state('');
	let mailingAddress = $state('');
	let dob = $state('');
	let license = $state('');
	let residenceType = $state<ResidenceType>('Homeowner');
	let clientLob = $state<string[]>([]);
	let clientCarriers = $state<string[]>([]);

	// Business-side fields
	let businessName = $state('');
	let businessPhone = $state('');
	let ein = $state('');
	let established = $state('');
	let occupancy = $state<Occupancy>('Own');
	let businessLob = $state<string[]>([]);
	let businessCarriers = $state<string[]>([]);

	// Card-level flags
	let isCOI = $state(false);
	let isBNI = $state(false);

	/** Toggle membership of `value` in a selection array (mutating the $state ref). */
	function toggle(arr: string[], value: string): string[] {
		return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
	}

	// Reset the form whenever the modal opens.
	$effect(() => {
		if (app.modals.drawCard) {
			primarySide = 'Client';
			name = '';
			phone = '';
			email = '';
			address = '';
			mailingAddress = '';
			dob = '';
			license = '';
			residenceType = 'Homeowner';
			clientLob = [];
			clientCarriers = [];
			businessName = '';
			businessPhone = '';
			ein = '';
			established = '';
			occupancy = 'Own';
			businessLob = [];
			businessCarriers = [];
			isCOI = false;
			isBNI = false;
		}
	});

	function saveNewCard() {
		const partial: Partial<Card> = {
			primarySide,
			name: name.trim(),
			phone,
			email,
			address,
			mailingAddress,
			dob,
			license,
			residenceType,
			isCOI,
			isBNI,
			clientSide: {
				notes: [],
				logs: [],
				quests: [],
				lob: clientLob,
				carriers: clientCarriers
			},
			businessSide: {
				notes: [],
				logs: [],
				quests: [],
				lob: businessLob,
				carriers: businessCarriers,
				businessName,
				phone: businessPhone,
				ein,
				established,
				occupancy
			}
		};
		app.drawCard(partial); // drawCard closes the modal itself
	}
</script>

{#if app.modals.drawCard}
	<div
		class="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
		aria-label="Draw New Card"
	>
		<div
			class="bg-[#fdfbf7] w-full max-w-4xl rounded-lg shadow-2xl border-4 border-[#d4c5a9] max-h-[90vh] overflow-y-auto"
		>
			<div
				class="bg-[#2c241b] text-[#f5deb3] p-4 border-b border-[#d4c5a9] flex justify-between items-center"
			>
				<h3 class="font-serif font-bold text-xl">Draw New Card</h3>
				<button onclick={() => app.closeModals()} aria-label="Close"><X /></button>
			</div>
			<div class="p-6 space-y-4">
				<!-- Side Selection -->
				<div class="flex gap-4 mb-4">
					<button
						onclick={() => (primarySide = 'Client')}
						class="flex-1 py-3 font-bold border-2 rounded {primarySide === 'Client'
							? 'border-emerald-600 bg-emerald-50 text-emerald-800'
							: 'border-stone-200 text-stone-400'}">Client Side (Front)</button
					>
					<button
						onclick={() => (primarySide = 'Business')}
						class="flex-1 py-3 font-bold border-2 rounded {primarySide === 'Business'
							? 'border-blue-600 bg-blue-50 text-blue-800'
							: 'border-stone-200 text-stone-400'}">Business Side (Back)</button
					>
				</div>
				<p class="text-xs text-center font-bold text-stone-500 italic mb-2">
					The selected tab above determines which side will be the PRIMARY side when added to the
					binder.
				</p>

				<div class="grid grid-cols-2 gap-8">
					<!-- Client Side Column -->
					<div
						class="space-y-4 p-4 rounded border-2 {primarySide === 'Client'
							? 'border-emerald-500 bg-emerald-50/50'
							: 'border-stone-200 bg-stone-50/50 grayscale opacity-70'}"
					>
						<h4
							class="font-bold text-lg text-emerald-800 border-b border-emerald-200 pb-2 mb-2 flex items-center gap-2"
						>
							<UserPlus size={18} /> Client Details
						</h4>

						<div>
							<label class="text-xs font-bold uppercase text-stone-500" for="dc-name">Name</label>
							<input
								id="dc-name"
								class="w-full border p-2 rounded bg-white"
								bind:value={name}
								placeholder="Primary Client Name"
							/>
						</div>
						<div>
							<label class="text-xs font-bold uppercase text-stone-500" for="dc-phone">Phone</label>
							<input
								id="dc-phone"
								class="w-full border p-2 rounded bg-white"
								bind:value={phone}
								placeholder="Personal Phone"
							/>
						</div>
						<div>
							<label class="text-xs font-bold uppercase text-stone-500" for="dc-email">Email</label>
							<input id="dc-email" class="w-full border p-2 rounded bg-white" bind:value={email} />
						</div>
						<div>
							<label class="text-xs font-bold uppercase text-stone-500" for="dc-address">Address</label>
							<input id="dc-address" class="w-full border p-2 rounded bg-white" bind:value={address} />
						</div>
						<div>
							<label class="text-xs font-bold uppercase text-stone-500" for="dc-mailing"
								>Mailing Address</label
							>
							<input
								id="dc-mailing"
								class="w-full border p-2 rounded bg-white"
								bind:value={mailingAddress}
							/>
						</div>

						<div class="grid grid-cols-2 gap-2">
							<div>
								<label class="text-xs font-bold uppercase text-stone-500" for="dc-dob">DOB</label>
								<input
									id="dc-dob"
									class="w-full border p-2 rounded bg-white"
									type="date"
									bind:value={dob}
								/>
							</div>
							<div>
								<label class="text-xs font-bold uppercase text-stone-500" for="dc-license"
									>License #</label
								>
								<input id="dc-license" class="w-full border p-2 rounded bg-white" bind:value={license} />
							</div>
						</div>

						<div>
							<label class="text-xs font-bold uppercase text-stone-500" for="dc-residence">Residence</label>
							<select
								id="dc-residence"
								class="w-full border p-2 rounded bg-white"
								bind:value={residenceType}
							>
								{#each RESIDENCE_OPTIONS as r}
									<option value={r}>{r}</option>
								{/each}
							</select>
						</div>

						<!-- Client LoB Selection -->
						<div class="mt-4">
							<span class="text-xs font-bold uppercase text-stone-500 block mb-1"
								>Client Lines of Business</span
							>
							<div class="grid grid-cols-2 gap-1 border p-2 bg-white rounded">
								{#each CLIENT_LOB_OPTIONS as lob}
									<label class="flex items-center gap-1 text-[10px]">
										<input
											type="checkbox"
											checked={clientLob.includes(lob)}
											onchange={() => (clientLob = toggle(clientLob, lob))}
										/>
										{lob}
									</label>
								{/each}
							</div>
						</div>
						<div class="mt-2">
							<span class="text-xs font-bold uppercase text-stone-500 block mb-1">Client Carriers</span>
							<div class="grid grid-cols-2 gap-1 border p-2 bg-white rounded">
								{#each CLIENT_CARRIER_OPTIONS as c}
									<label class="flex items-center gap-1 text-[10px]">
										<input
											type="checkbox"
											checked={clientCarriers.includes(c)}
											onchange={() => (clientCarriers = toggle(clientCarriers, c))}
										/>
										{c}
									</label>
								{/each}
							</div>
						</div>
					</div>

					<!-- Business Side Column -->
					<div
						class="space-y-4 p-4 rounded border-2 {primarySide === 'Business'
							? 'border-blue-500 bg-blue-50/50'
							: 'border-stone-200 bg-stone-50/50 grayscale opacity-70'}"
					>
						<h4
							class="font-bold text-lg text-blue-800 border-b border-blue-200 pb-2 mb-2 flex items-center gap-2"
						>
							<Briefcase size={18} /> Business Details
						</h4>

						<div>
							<label class="text-xs font-bold uppercase text-stone-500" for="dc-bizname"
								>Business Name</label
							>
							<input
								id="dc-bizname"
								class="w-full border p-2 rounded bg-white"
								bind:value={businessName}
								placeholder="Company Name"
							/>
						</div>
						<div>
							<label class="text-xs font-bold uppercase text-stone-500" for="dc-bizphone"
								>Business Phone</label
							>
							<input
								id="dc-bizphone"
								class="w-full border p-2 rounded bg-white"
								bind:value={businessPhone}
								placeholder="Work Phone"
							/>
						</div>
						<div>
							<label class="text-xs font-bold uppercase text-stone-500" for="dc-ein">EIN</label>
							<input id="dc-ein" class="w-full border p-2 rounded bg-white" bind:value={ein} />
						</div>
						<div>
							<label class="text-xs font-bold uppercase text-stone-500" for="dc-occupancy">Occupancy</label>
							<select
								id="dc-occupancy"
								class="w-full border p-2 rounded bg-white"
								bind:value={occupancy}
							>
								{#each OCCUPANCY_OPTIONS as o}
									<option value={o}>{o}</option>
								{/each}
							</select>
						</div>
						<div>
							<label class="text-xs font-bold uppercase text-stone-500" for="dc-est">Est.</label>
							<input
								id="dc-est"
								class="w-full border p-2 rounded bg-white"
								bind:value={established}
								placeholder="Year"
							/>
						</div>

						<!-- Business LoB Selection -->
						<div class="mt-4">
							<span class="text-xs font-bold uppercase text-stone-500 block mb-1">Business Lines</span>
							<div class="grid grid-cols-2 gap-1 border p-2 bg-white rounded">
								{#each BUSINESS_LOB_OPTIONS as lob}
									<label class="flex items-center gap-1 text-[10px]">
										<input
											type="checkbox"
											checked={businessLob.includes(lob)}
											onchange={() => (businessLob = toggle(businessLob, lob))}
										/>
										{lob}
									</label>
								{/each}
							</div>
						</div>
						<div class="mt-2">
							<span class="text-xs font-bold uppercase text-stone-500 block mb-1"
								>Business Carriers</span
							>
							<div class="grid grid-cols-2 gap-1 border p-2 bg-white rounded">
								{#each BUSINESS_CARRIER_OPTIONS as c}
									<label class="flex items-center gap-1 text-[10px]">
										<input
											type="checkbox"
											checked={businessCarriers.includes(c)}
											onchange={() => (businessCarriers = toggle(businessCarriers, c))}
										/>
										{c}
									</label>
								{/each}
							</div>
						</div>
					</div>
				</div>

				<div class="flex gap-4 border-t pt-4">
					<label class="flex items-center gap-2 text-sm font-bold">
						<input type="checkbox" bind:checked={isCOI} /> COI (Center of Influence)
					</label>
					<label class="flex items-center gap-2 text-sm font-bold">
						<input type="checkbox" bind:checked={isBNI} /> BNI Member
					</label>
				</div>

				<div class="flex justify-end pt-4 border-t border-stone-200">
					<RPGButton variant="gold" onclick={saveNewCard}>Add to Binder</RPGButton>
				</div>
			</div>
		</div>
	</div>
{/if}
