<script lang="ts">
	import { BUTTON_VARIANTS, METALLIC_SHADOW, type ButtonVariant } from '$lib/theme';
	import type { Snippet } from 'svelte';

	let {
		variant = 'primary',
		onclick,
		disabled = false,
		type = 'button',
		class: klass = '',
		children
	}: {
		variant?: ButtonVariant;
		onclick?: (e: MouseEvent) => void;
		disabled?: boolean;
		type?: 'button' | 'submit' | 'reset';
		class?: string;
		children?: Snippet;
	} = $props();

	const v = $derived(BUTTON_VARIANTS[variant] ?? BUTTON_VARIANTS.primary);
</script>

<button
	{type}
	{onclick}
	{disabled}
	style="background-image: {v.gradient}; color: {v.text};"
	class="px-4 py-2 rounded font-serif font-bold tracking-wide {METALLIC_SHADOW} transition active:scale-95 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 {klass}"
>
	{@render children?.()}
</button>
