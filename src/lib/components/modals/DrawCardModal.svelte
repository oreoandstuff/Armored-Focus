<script lang="ts">
	// Draw Card modal (SPEC §2.5.1, §3.1) — create a new client/business card.
	// Self-gates on `app.modals.drawCard` and writes to the `app` store directly.
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
	import Modal from '$lib/components/Modal.svelte';
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

	/** Toggle membership of `value` in a selection array (returns a new array). */
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
			clientSide: { notes: [], logs: [], quests: [], lob: clientLob, carriers: clientCarriers },
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

<Modal open={app.modals.drawCard} ariaLabel="Draw New Card">
	<div class="panel">
		<header class="panel-header">
			<h3 class="panel-title">Draw New Card</h3>
			<button class="close-btn" onclick={() => app.closeModals()} aria-label="Close"><X /></button>
		</header>

		<div class="panel-body">
			<!-- Which side is primary -->
			<div class="side-toggle">
				<button
					class="side-btn client"
					class:active={primarySide === 'Client'}
					onclick={() => (primarySide = 'Client')}>Client Side (Front)</button
				>
				<button
					class="side-btn business"
					class:active={primarySide === 'Business'}
					onclick={() => (primarySide = 'Business')}>Business Side (Back)</button
				>
			</div>
			<p class="hint">
				The selected tab above determines which side will be the PRIMARY side when added to the
				binder.
			</p>

			<div class="columns">
				<!-- Client column -->
				<section class="col client" class:active={primarySide === 'Client'}>
					<h4 class="col-title client-title"><UserPlus size={18} /> Client Details</h4>

					<div class="field">
						<label class="field-label" for="dc-name">Name</label>
						<input id="dc-name" class="input" bind:value={name} placeholder="Primary Client Name" />
					</div>
					<div class="field">
						<label class="field-label" for="dc-phone">Phone</label>
						<input id="dc-phone" class="input" bind:value={phone} placeholder="Personal Phone" />
					</div>
					<div class="field">
						<label class="field-label" for="dc-email">Email</label>
						<input id="dc-email" class="input" bind:value={email} />
					</div>
					<div class="field">
						<label class="field-label" for="dc-address">Address</label>
						<input id="dc-address" class="input" bind:value={address} />
					</div>
					<div class="field">
						<label class="field-label" for="dc-mailing">Mailing Address</label>
						<input id="dc-mailing" class="input" bind:value={mailingAddress} />
					</div>

					<div class="field-row">
						<div class="field">
							<label class="field-label" for="dc-dob">DOB</label>
							<input id="dc-dob" class="input" type="date" bind:value={dob} />
						</div>
						<div class="field">
							<label class="field-label" for="dc-license">License #</label>
							<input id="dc-license" class="input" bind:value={license} />
						</div>
					</div>

					<div class="field">
						<label class="field-label" for="dc-residence">Residence</label>
						<select id="dc-residence" class="input" bind:value={residenceType}>
							{#each RESIDENCE_OPTIONS as r (r)}
								<option value={r}>{r}</option>
							{/each}
						</select>
					</div>

					<div class="checks">
						<span class="group-label">Client Lines of Business</span>
						<div class="check-grid">
							{#each CLIENT_LOB_OPTIONS as lob (lob)}
								<label class="check">
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
					<div class="checks tight">
						<span class="group-label">Client Carriers</span>
						<div class="check-grid">
							{#each CLIENT_CARRIER_OPTIONS as c (c)}
								<label class="check">
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
				</section>

				<!-- Business column -->
				<section class="col business" class:active={primarySide === 'Business'}>
					<h4 class="col-title business-title"><Briefcase size={18} /> Business Details</h4>

					<div class="field">
						<label class="field-label" for="dc-bizname">Business Name</label>
						<input
							id="dc-bizname"
							class="input"
							bind:value={businessName}
							placeholder="Company Name"
						/>
					</div>
					<div class="field">
						<label class="field-label" for="dc-bizphone">Business Phone</label>
						<input
							id="dc-bizphone"
							class="input"
							bind:value={businessPhone}
							placeholder="Work Phone"
						/>
					</div>
					<div class="field">
						<label class="field-label" for="dc-ein">EIN</label>
						<input id="dc-ein" class="input" bind:value={ein} />
					</div>
					<div class="field">
						<label class="field-label" for="dc-occupancy">Occupancy</label>
						<select id="dc-occupancy" class="input" bind:value={occupancy}>
							{#each OCCUPANCY_OPTIONS as o (o)}
								<option value={o}>{o}</option>
							{/each}
						</select>
					</div>
					<div class="field">
						<label class="field-label" for="dc-est">Est.</label>
						<input id="dc-est" class="input" bind:value={established} placeholder="Year" />
					</div>

					<div class="checks">
						<span class="group-label">Business Lines</span>
						<div class="check-grid">
							{#each BUSINESS_LOB_OPTIONS as lob (lob)}
								<label class="check">
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
					<div class="checks tight">
						<span class="group-label">Business Carriers</span>
						<div class="check-grid">
							{#each BUSINESS_CARRIER_OPTIONS as c (c)}
								<label class="check">
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
				</section>
			</div>

			<div class="flags">
				<label class="flag"><input type="checkbox" bind:checked={isCOI} /> COI (Center of Influence)</label>
				<label class="flag"><input type="checkbox" bind:checked={isBNI} /> BNI Member</label>
			</div>

			<div class="actions">
				<RPGButton variant="gold" onclick={saveNewCard}>Add to Binder</RPGButton>
			</div>
		</div>
	</div>
</Modal>

<style lang="postcss">
	.panel {
		@apply w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg border-4 border-[#d4c5a9] bg-[#fdfbf7] shadow-2xl;
	}
	.panel-header {
		@apply flex items-center justify-between border-b border-[#d4c5a9] bg-[#2c241b] p-4 text-[#f5deb3];
	}
	.panel-title {
		@apply font-serif text-xl font-bold;
	}
	.panel-body {
		@apply space-y-4 p-6;
	}

	.side-toggle {
		@apply mb-4 flex gap-4;
	}
	.side-btn {
		@apply flex-1 rounded border-2 border-stone-200 py-3 font-bold text-stone-400;
	}
	.side-btn.client.active {
		@apply border-emerald-600 bg-emerald-50 text-emerald-800;
	}
	.side-btn.business.active {
		@apply border-blue-600 bg-blue-50 text-blue-800;
	}
	.hint {
		@apply mb-2 text-center text-xs font-bold italic text-stone-500;
	}

	.columns {
		@apply grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-8;
	}
	.col {
		@apply space-y-4 rounded border-2 border-stone-200 bg-stone-50/50 p-4 opacity-70 grayscale;
	}
	.col.client.active {
		@apply border-emerald-500 bg-emerald-50/50 opacity-100 grayscale-0;
	}
	.col.business.active {
		@apply border-blue-500 bg-blue-50/50 opacity-100 grayscale-0;
	}
	.col-title {
		@apply mb-2 flex items-center gap-2 border-b pb-2 text-lg font-bold;
	}
	.client-title {
		@apply border-emerald-200 text-emerald-800;
	}
	.business-title {
		@apply border-blue-200 text-blue-800;
	}

	.field-label {
		@apply text-xs font-bold uppercase text-stone-500;
	}
	.group-label {
		@apply mb-1 block text-xs font-bold uppercase text-stone-500;
	}
	.input {
		@apply w-full rounded border bg-white p-2;
	}
	.field-row {
		@apply grid grid-cols-2 gap-2;
	}

	.checks {
		@apply mt-4;
	}
	.checks.tight {
		@apply mt-2;
	}
	.check-grid {
		@apply grid grid-cols-2 gap-1 rounded border bg-white p-2;
	}
	.check {
		@apply flex items-center gap-1 text-[10px];
	}

	.flags {
		@apply flex gap-4 border-t pt-4;
	}
	.flag {
		@apply flex items-center gap-2 text-sm font-bold;
	}
	.actions {
		@apply flex justify-end border-t border-stone-200 pt-4;
	}
</style>
