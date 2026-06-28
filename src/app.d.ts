// See https://svelte.dev/docs/kit/types#app.d.ts
import type { D1Database } from '@cloudflare/workers-types';

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		interface Platform {
			env: {
				DB: D1Database;
			};
			cf?: IncomingRequestCfProperties;
			ctx?: ExecutionContext;
		}
	}
}

export {};
