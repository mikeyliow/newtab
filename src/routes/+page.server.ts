import type { PageServerLoad } from './$types';
import { getDashboard } from '$lib/server/core';
import { getRaptors } from '$lib/server/sports';

export const load: PageServerLoad = async () => {
	return { dashboard: getDashboard(), raptors: await getRaptors() };
};
