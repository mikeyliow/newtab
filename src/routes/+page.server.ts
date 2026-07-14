import type { PageServerLoad } from './$types';
import { getDashboard } from '$lib/server/core';

export const load: PageServerLoad = () => {
	return { dashboard: getDashboard() };
};
