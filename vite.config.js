import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		// Functional-core tests are pure Node; component tests can opt into jsdom later.
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'node'
	}
});
