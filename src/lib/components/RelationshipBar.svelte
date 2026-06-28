<script lang="ts">
	// Relationship Score bar (SPEC §3, §4.6). Score clamped 1–100.
	// red→yellow→green gradient with tick marks every 10%.
	let { score = 1 }: { score?: number } = $props();

	const clamped = $derived(Math.max(1, Math.min(100, Math.round(score ?? 1))));
	const ticks = [10, 20, 30, 40, 50, 60, 70, 80, 90];
</script>

<div class="w-full">
	<div
		class="relative h-4 w-full overflow-hidden rounded-full border border-black/20 bg-black/10"
	>
		<!-- Gradient fill clipped to score% -->
		<div
			class="absolute inset-y-0 left-0 rounded-full"
			style="width: {clamped}%; background: linear-gradient(to right, #ef4444 0%, #eab308 50%, #22c55e 100%);"
		></div>

		<!-- Tick marks every 10% -->
		{#each ticks as t}
			<div class="absolute inset-y-0 w-px bg-black/20" style="left: {t}%;"></div>
		{/each}
	</div>
	<div class="mt-1 text-right font-mono text-xs text-black/60">{clamped}/100</div>
</div>
