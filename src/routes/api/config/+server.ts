import type { RequestHandler } from './$types';
import { apiCall } from '$lib/server/api';
import {
	getConfig,
	setFocus,
	setFocusIcon,
	setName,
	setQuickLinks,
	setShortcuts,
	setTargets,
	setWallpaper,
	setWidgets
} from '$lib/server/core';

export const GET: RequestHandler = () => apiCall(() => getConfig());

export const PATCH: RequestHandler = async ({ request }) => {
	const body = await request.json();
	return apiCall(() => {
		if (body.focus !== undefined) setFocus(body.focus);
		if (body.focus_icon !== undefined) setFocusIcon(body.focus_icon);
		if (body.name !== undefined) setName(body.name);
		if (body.wallpaper !== undefined) setWallpaper(body.wallpaper);
		if (body.quick_links !== undefined) setQuickLinks(body.quick_links);
		if (body.calorie_target !== undefined) setTargets({ calories: body.calorie_target });
		if (body.budget_month !== undefined) setTargets({ budget: body.budget_month });
		if (body.shortcuts !== undefined) setShortcuts(body.shortcuts);
		if (body.widgets !== undefined) setWidgets(body.widgets);
		return getConfig();
	});
};
