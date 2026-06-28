import type { LayoutServerLoad } from './$types';
import { ensureSeed, loadState } from '$lib/server/db';

// Loads the full application state for the (single, default) user. Runs on the
// Cloudflare Worker with the D1 binding available via platform.env.DB.
export const load: LayoutServerLoad = async ({ platform }) => {
	const db = platform?.env?.DB;
	if (!db) {
		// No D1 binding (e.g. running without wrangler/platformProxy). Return an
		// empty shell so the UI still renders; mutations will no-op until D1 is wired.
		const { initialRules } = await import('$lib/core/rules');
		return {
			userStats: { name: 'Drew Leui', exp: 0, level: 1 },
			cards: [],
			rules: initialRules,
			dailyLog: [],
			bonusProgress: {}
		};
	}
	await ensureSeed(db);
	return await loadState(db);
};
