import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { checkPasscode, createSession, SESSION_COOKIE, sessionCookieOptions } from '$lib/server/auth';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await request.formData();
		const passcode = String(form.get('passcode') ?? '');
		if (!checkPasscode(passcode)) {
			return fail(401, { wrong: true });
		}
		cookies.set(SESSION_COOKIE, await createSession(), sessionCookieOptions);
		redirect(303, '/');
	}
};
