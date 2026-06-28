<script lang="ts">
	// Top navigation tab bar (SPEC §2, §7). Per-tab active glow/styling.
	import { Shield, Scroll, Archive, ScrollText } from '@lucide/svelte';
	import { TAB_THEME } from '$lib/theme';
	import type { View } from '$lib/core/types';

	let { active, onSelect }: { active: View; onSelect?: (view: View) => void } = $props();

	const tabs: { label: string; view: View; icon: typeof Shield; theme: (typeof TAB_THEME)[keyof typeof TAB_THEME] }[] = [
		{ label: 'Hub', view: 'hub', icon: Shield, theme: TAB_THEME.hub },
		{ label: 'Quests', view: 'quests', icon: Scroll, theme: TAB_THEME.quests },
		{ label: 'Binder', view: 'binder', icon: Archive, theme: TAB_THEME.binder },
		{ label: 'Rules', view: 'rules', icon: ScrollText, theme: TAB_THEME.rules }
	];
</script>

<nav class="sticky top-0 z-50 flex items-center gap-2 border-b border-black/30 bg-slate-900/90 px-4 py-2 backdrop-blur">
	{#each tabs as t (t.view)}
		{@const Icon = t.icon}
		<button
			onclick={() => onSelect?.(t.view)}
			aria-current={active === t.view ? 'page' : undefined}
			class="flex items-center gap-2 rounded-lg px-4 py-2 font-serif font-bold tracking-wide transition
				{active === t.view ? `${t.theme.active} ${t.theme.glow} text-white` : `${t.theme.text} hover:bg-white/10`}"
		>
			<Icon size={18} />
			<span>{t.label}</span>
		</button>
	{/each}
</nav>
