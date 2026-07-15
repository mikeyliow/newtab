import type { RequestHandler } from './$types';
import { apiCall } from '$lib/server/api';
import { updateLibraryItem, removeLibraryItem } from '$lib/server/core';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const patch = await request.json();
	return apiCall(() => updateLibraryItem(params.id, patch));
};

export const DELETE: RequestHandler = ({ params }) => apiCall(() => removeLibraryItem(params.id));
