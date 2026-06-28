/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			fontFamily: {
				serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
				sans: ['Inter', 'system-ui', 'sans-serif'],
				mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
			},
			boxShadow: {
				metallic:
					'0 4px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.5)'
			},
			colors: {
				// Parchment / global theme (SPEC §7)
				parchment: {
					bg: '#e8e4d9',
					panel: '#fdfbf7',
					border: '#d4c5a9',
					input: '#fffef8'
				},
				leather: '#2c241b',
				gold: '#daa520',
				goldText: '#eebb4d',
				saddle: '#8b4513',
				silver: '#a9a9a9'
			}
		}
	},
	plugins: []
};
