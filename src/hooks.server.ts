import { redirect, json, type Handle } from '@sveltejs/kit';
import { verifySession, checkBearer, SESSION_COOKIE } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;

	if (pathname === '/health' || pathname === '/login') {
		return resolve(event);
	}

	// agent door: bearer key, required for /mcp, also accepted on /api
	const bearerOk = checkBearer(event.request.headers.get('authorization'));
	if (pathname.startsWith('/mcp')) {
		if (!bearerOk) return json({ error: 'unauthorized' }, { status: 401 });
		return resolve(event);
	}

	// browser door: JWT cookie
	const cookieOk = await verifySession(event.cookies.get(SESSION_COOKIE));
	if (cookieOk || bearerOk) {
		return resolve(event);
	}

	if (pathname.startsWith('/api')) {
		return json({ error: 'unauthorized' }, { status: 401 });
	}
	redirect(303, '/login');
};
