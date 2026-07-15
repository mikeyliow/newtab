import type { RequestHandler } from './$types';
import { apiCall } from '$lib/server/api';
import { addLibraryItem, listLibrary } from '$lib/server/core';

export const GET: RequestHandler = ({ url }) =>
	apiCall(() => listLibrary(url.searchParams.get('status') ?? undefined));

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	return apiCall(() => addLibraryItem(body));
};
