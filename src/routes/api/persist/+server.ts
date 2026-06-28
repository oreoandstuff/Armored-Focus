import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	DEFAULT_USER_ID,
	saveCard,
	deleteCard,
	saveUserStats,
	appendLog,
	saveRules,
	setBonusProgress
} from '$lib/server/db';
import type { Side } from '$lib/server/mappers';
import type { SideKey } from '$lib/core/types';

/** Map the domain SideKey to the DB side constant. */
function toSide(side: SideKey | undefined | null): Side | null {
	if (side === 'businessSide') return 'business';
	if (side === 'clientSide') return 'client';
	return null;
}

// Single persistence endpoint. The client store posts { kind, data } after each
// mutation; we dispatch to the matching repository function on D1.
export const POST: RequestHandler = async ({ request, platform }) => {
	const db = platform?.env?.DB;
	if (!db) throw error(503, 'Database unavailable');

	const { kind, data } = (await request.json()) as { kind: string; data: any };
	const uid = DEFAULT_USER_ID;

	switch (kind) {
		case 'saveCard':
			await saveCard(db, uid, data);
			break;
		case 'deleteCard':
			await deleteCard(db, data.id);
			break;
		case 'saveStats':
			await saveUserStats(db, uid, data);
			break;
		case 'appendLog':
			await appendLog(db, uid, data.entry, data.cardId ?? null, toSide(data.side));
			break;
		case 'saveRules':
			await saveRules(db, uid, data);
			break;
		case 'setBonus':
			await setBonusProgress(db, uid, data.bonusId, data.current);
			break;
		default:
			throw error(400, `Unknown persist kind: ${kind}`);
	}

	return json({ ok: true });
};
