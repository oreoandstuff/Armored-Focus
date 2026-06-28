<script lang="ts">
	import '../app.css';
	import { app } from '$lib/state.svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	// Seed the client store from server-loaded state (idempotent, client-only).
	$effect(() => {
		app.init(data);
	});
</script>

{@render children()}
