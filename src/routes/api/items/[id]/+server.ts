import type { RequestHandler } from './$types';
import { apiCall } from '$lib/server/api';
import { updateItem, removeItem } from '$lib/server/core';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const patch = await request.json();
	return apiCall(() => updateItem(params.id, patch));
};

export const DELETE: RequestHandler = ({ params }) => apiCall(() => removeItem(params.id));
