import type { RequestHandler } from './$types';
import { apiCall } from '$lib/server/api';
import { getConfig, setFocus, setShortcuts, setTargets, setWidgets } from '$lib/server/core';

export const GET: RequestHandler = () => apiCall(() => getConfig());

export const PATCH: RequestHandler = async ({ request }) => {
	const body = await request.json();
	return apiCall(() => {
		if (body.focus !== undefined) setFocus(body.focus);
		if (body.calorie_target !== undefined) setTargets({ calories: body.calorie_target });
		if (body.budget_month !== undefined) setTargets({ budget: body.budget_month });
		if (body.shortcuts !== undefined) setShortcuts(body.shortcuts);
		if (body.widgets !== undefined) setWidgets(body.widgets);
		return getConfig();
	});
};
