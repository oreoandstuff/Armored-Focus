import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// Emulate Cloudflare bindings (D1, etc.) during `vite dev` using wrangler.toml.
		adapter: adapter({
			platformProxy: {
				configPath: 'wrangler.toml',
				persist: true
			}
		})
	}
};

export default config;
