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

<div class="cooldown">
	<div class="cooldown-header">
		<span class="cooldown-label">Cooldown Timer</span>
		<span class="cooldown-value">{label}</span>
	</div>

	<div class="cooldown-track">
		<!-- Fill anchored to the right -->
		<div class="cooldown-fill" style="width: {fillPct}%"></div>

		<!-- Pulsing "Converts Tomorrow" overlay when exactly one day remains -->
		{#if days === 1}
			<div class="cooldown-overlay">Converts Tomorrow</div>
		{/if}
	</div>
</div>

<style>
	.cooldown {
		@apply w-full;
	}
	.cooldown-header {
		@apply mb-1 flex items-center justify-between;
	}
	.cooldown-label {
		@apply font-serif text-xs font-bold tracking-wide text-blue-200;
	}
	.cooldown-value {
		@apply font-mono text-xs text-pink-200;
	}
	.cooldown-track {
		@apply relative h-4 w-full overflow-hidden rounded-full border border-black/30 bg-black/30;
	}
	.cooldown-fill {
		@apply absolute inset-y-0 right-0 rounded-full;
		background: linear-gradient(to left, #ec4899, #3b82f6);
	}
	.cooldown-overlay {
		@apply absolute inset-0 flex animate-pulse items-center justify-center text-[10px] font-bold uppercase tracking-wider text-white drop-shadow;
	}
</style>
