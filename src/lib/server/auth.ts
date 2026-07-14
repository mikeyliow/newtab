import { SignJWT, jwtVerify } from 'jose';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';
import { timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE = 'newtab_session';
const SESSION_DAYS = 365;

function required(name: string, devFallback: string): string {
	const value = env[name];
	if (value) return value;
	if (dev) return devFallback;
	throw new Error(`${name} env variable is not set`);
}

function secretKey(): Uint8Array {
	return new TextEncoder().encode(required('JWT_SECRET', 'dev-jwt-secret-not-for-production'));
}

function safeEqual(a: string, b: string): boolean {
	const ab = Buffer.from(a);
	const bb = Buffer.from(b);
	if (ab.length !== bb.length) return false;
	return timingSafeEqual(ab, bb);
}

export function checkPasscode(input: string): boolean {
	return safeEqual(input, required('PASSCODE', 'dev'));
}

export function checkBearer(header: string | null): boolean {
	if (!header?.startsWith('Bearer ')) return false;
	return safeEqual(header.slice(7), required('MCP_KEY', 'dev-mcp-key'));
}

export async function createSession(): Promise<string> {
	return new SignJWT({ sub: 'owner' })
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime(`${SESSION_DAYS}d`)
		.sign(secretKey());
}

export async function verifySession(token: string | undefined): Promise<boolean> {
	if (!token) return false;
	try {
		await jwtVerify(token, secretKey());
		return true;
	} catch {
		return false;
	}
}

export const sessionCookieOptions = {
	path: '/',
	httpOnly: true,
	sameSite: 'lax',
	secure: !dev,
	maxAge: SESSION_DAYS * 24 * 60 * 60
} as const;
