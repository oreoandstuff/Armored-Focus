<script lang="ts">
	// Relationship Score bar (matches the React prototype's RelationshipBar 1:1).
	// The inner gradient is widened by (100/safeScore)*100% so the filled portion
	// shows red at low scores and the full red→yellow→green spectrum at 100.
	// The numeric "{score}/100" label is rendered by the PARENT, not here.
	let { score = 1 }: { score?: number } = $props();

	const safeScore = $derived(Math.max(1, Math.min(100, score || 0)));
	const gradientWidth = $derived((100 / safeScore) * 100);
	const ticks = [10, 20, 30, 40, 50, 60, 70, 80, 90];
</script>

<div class="bar-track">
	<div class="bar-fill" style="width: {safeScore}%">
		<div class="bar-gradient" style="width: {gradientWidth}%"></div>
	</div>
	<div class="tick-layer">
		{#each ticks as t (t)}
			<div class="tick" style="left: {t}%"></div>
		{/each}
	</div>
</div>

<style lang="postcss">
	.bar-track {
		@apply relative h-3 w-full overflow-hidden rounded-full border border-gray-400 bg-gray-300;
	}
	.bar-fill {
		@apply absolute left-0 top-0 h-full overflow-hidden;
		/* Tailwind `transition-all duration-500` */
		transition-property: all;
		transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
		transition-duration: 500ms;
	}
	.bar-gradient {
		@apply h-full;
		background: linear-gradient(90deg, #ef4444 0%, #eab308 50%, #22c55e 100%);
	}
	.tick-layer {
		@apply pointer-events-none absolute inset-0;
	}
	.tick {
		@apply absolute top-0 h-full w-px bg-black/40;
	}
</style>
