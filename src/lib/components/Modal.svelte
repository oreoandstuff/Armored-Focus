<script lang="ts">
	// Shared modal shell: a dimmed (optionally blurred) full-screen scrim with the
	// panel centered ON TOP of it. The scrim is a separate layer behind the panel
	// so its backdrop-blur only blurs the page behind — never the panel content.
	import type { Snippet } from 'svelte';

	let {
		open,
		ariaLabel,
		blur = true,
		children
	}: { open: boolean; ariaLabel?: string; blur?: boolean; children: Snippet } = $props();
</script>

{#if open}
	<div class="overlay" role="dialog" aria-modal="true" aria-label={ariaLabel}>
		<div class="scrim" class:blur></div>
		<div class="content">{@render children()}</div>
	</div>
{/if}

<style lang="postcss">
	.overlay {
		@apply fixed inset-0 z-[100] flex items-center justify-center;
	}
	.scrim {
		@apply absolute inset-0 bg-black/60;
	}
	.scrim.blur {
		@apply backdrop-blur-sm;
	}
	.content {
		@apply relative z-10 flex max-h-full w-full items-center justify-center;
	}
</style>
