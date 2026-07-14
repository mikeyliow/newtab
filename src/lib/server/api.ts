import { json } from '@sveltejs/kit';
import { CoreError } from './core';

// wrap a core call so validation errors become 400s instead of 500s
export function apiCall(fn: () => unknown): Response {
	try {
		return json(fn() ?? { ok: true });
	} catch (e) {
		if (e instanceof CoreError) return json({ error: e.message }, { status: 400 });
		throw e;
	}
}
