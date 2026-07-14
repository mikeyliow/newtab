import { invalidateAll } from '$app/navigation';

async function call(method: string, path: string, body?: unknown) {
	const res = await fetch(path, {
		method,
		headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
		body: body !== undefined ? JSON.stringify(body) : undefined
	});
	if (!res.ok) {
		const data = await res.json().catch(() => ({}));
		throw new Error(data.error || `${method} ${path} failed (${res.status})`);
	}
	await invalidateAll();
	return res.json();
}

export const api = {
	addItem: (item: object) => call('POST', '/api/items', item),
	updateItem: (id: string, patch: object) => call('PATCH', `/api/items/${id}`, patch),
	removeItem: (id: string) => call('DELETE', `/api/items/${id}`),
	logMeal: (meal: object) => call('POST', '/api/meals', meal),
	removeMeal: (id: string) => call('DELETE', `/api/meals/${id}`),
	patchConfig: (patch: object) => call('PATCH', '/api/config', patch),
	logout: () => call('POST', '/api/logout')
};
