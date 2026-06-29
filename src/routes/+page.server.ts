import { redirect } from '@sveltejs/kit';

// The root path has no view of its own — send it to the Hub.
export const load = () => {
	redirect(307, '/hub');
};
