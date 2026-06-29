<script lang="ts">
	import { BUTTON_VARIANTS, type ButtonVariant } from '$lib/theme';
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
	class="rpg-button {klass}"
>
	{@render children?.()}
</button>

<style>
	/* Static layout + typography (the variant gradient/text stay inline because
	   they are variant-dependent data from BUTTON_VARIANTS). */
	.rpg-button {
		@apply rounded px-4 py-2 font-serif font-bold tracking-wide;
		/* METALLIC_SHADOW */
		box-shadow:
			0 4px 4px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.5);
		/* Tailwind `transition` */
		transition-property:
			color, background-color, border-color, text-decoration-color, fill, stroke, opacity,
			box-shadow, transform, filter, backdrop-filter;
		transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
		transition-duration: 150ms;
	}
	.rpg-button:hover {
		filter: brightness(1.1);
	}
	.rpg-button:active {
		transform: scale(0.95);
	}
	.rpg-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.rpg-button:disabled:active {
		transform: scale(1);
	}
</style>
