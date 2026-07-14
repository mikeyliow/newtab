import type { RequestHandler } from './$types';
import { apiCall } from '$lib/server/api';
import { listMeals, logMeal } from '$lib/server/core';

export const GET: RequestHandler = ({ url }) =>
	apiCall(() => listMeals(url.searchParams.get('date') ?? undefined));

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	return apiCall(() => logMeal(body));
};
