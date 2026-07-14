import type { RequestHandler } from './$types';
import { apiCall } from '$lib/server/api';
import { addItem, listItems } from '$lib/server/core';

export const GET: RequestHandler = ({ url }) =>
	apiCall(() =>
		listItems({
			kind: url.searchParams.get('kind') ?? undefined,
			context: url.searchParams.get('context') ?? undefined,
			status: url.searchParams.get('status') ?? undefined
		})
	);

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	return apiCall(() => addItem(body));
};
