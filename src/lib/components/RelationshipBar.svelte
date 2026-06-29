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

<div
	class="w-full h-3 bg-gray-300 rounded-full border border-gray-400 relative overflow-hidden"
>
	<div
		class="h-full absolute left-0 top-0 transition-all duration-500 overflow-hidden"
		style="width: {safeScore}%"
	>
		<div
			class="h-full"
			style="width: {gradientWidth}%; background: linear-gradient(90deg, #ef4444 0%, #eab308 50%, #22c55e 100%);"
		></div>
	</div>
	<div class="absolute inset-0 pointer-events-none">
		{#each ticks as t (t)}
			<div class="absolute h-full w-px bg-black/40 top-0" style="left: {t}%"></div>
		{/each}
	</div>
</div>
