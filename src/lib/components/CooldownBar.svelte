<script lang="ts">
	// Cooldown timer bar (SPEC §3, §4.8). 7-day visual timer.
	// Fills from the RIGHT, blue→pink. "CONVERTS TOMORROW" at <=0,
	// pulsing overlay when exactly 1 day remains.
	let { daysRemaining = 0 }: { daysRemaining?: number } = $props();

	const totalDays = 7;
	const days = $derived(daysRemaining ?? 0);
	const fillPct = $derived(Math.max(0, Math.min(100, (days / totalDays) * 100)));
	const label = $derived(days <= 0 ? 'CONVERTS TOMORROW' : `${days} Days Left`);
</script>

<div class="w-full">
	<div class="mb-1 flex items-center justify-between">
		<span class="font-serif text-xs font-bold tracking-wide text-blue-200">Cooldown Timer</span>
		<span class="font-mono text-xs text-pink-200">{label}</span>
	</div>

	<div class="relative h-4 w-full overflow-hidden rounded-full border border-black/30 bg-black/30">
		<!-- Fill anchored to the right -->
		<div
			class="absolute inset-y-0 right-0 rounded-full"
			style="width: {fillPct}%; background: linear-gradient(to left, #ec4899, #3b82f6);"
		></div>

		<!-- Pulsing "Converts Tomorrow" overlay when exactly one day remains -->
		{#if days === 1}
			<div
				class="absolute inset-0 flex items-center justify-center animate-pulse text-[10px] font-bold uppercase tracking-wider text-white drop-shadow"
			>
				Converts Tomorrow
			</div>
		{/if}
	</div>
</div>
