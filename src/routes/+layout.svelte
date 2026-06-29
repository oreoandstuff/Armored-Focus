<script lang="ts">
	import '../app.css';
	import { untrack } from 'svelte';
	import { app } from '$lib/state.svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	// Seed the client store from server-loaded state SYNCHRONOUSLY, in the script
	// body, so it runs before the child views mount (an $effect would run after,
	// leaving views to render against empty state and crash). ssr=false makes this
	// client-only; untrack marks the intentional one-time read of `data`.
	untrack(() => app.init(data));
</script>

{@render children()}
