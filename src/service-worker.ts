/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

// instant new tabs: serve the last-known page straight from cache, refresh it silently behind.
import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `newtab-${version}`;
const ASSETS = [...build, ...files];
const LIVE_ONLY = ['/api', '/mcp', '/login', '/health'];

sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(ASSETS))
			.then(() => sw.skipWaiting())
	);
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
			.then(() => sw.clients.claim())
	);
});

sw.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;
	const url = new URL(request.url);
	if (url.origin !== sw.location.origin) return; // favicons, weather, etc. go direct
	if (LIVE_ONLY.some((p) => url.pathname.startsWith(p))) return;

	// hashed build assets + static files: immutable, cache-first
	if (ASSETS.includes(url.pathname)) {
		event.respondWith(
			caches.open(CACHE).then(async (cache) => (await cache.match(url.pathname)) ?? fetch(request))
		);
		return;
	}

	// the page itself: stale-while-revalidate — cached copy paints instantly,
	// the network copy replaces it in cache for the next tab
	if (request.mode === 'navigate') {
		event.respondWith(
			(async () => {
				const cache = await caches.open(CACHE);
				const cached = await cache.match(request);
				const refresh = fetch(request)
					.then((res) => {
						// don't cache auth redirects (expired cookie → /login)
						if (res.ok && !res.redirected) cache.put(request, res.clone());
						return res;
					})
					.catch(() => undefined);
				if (cached) {
					event.waitUntil(refresh.then(() => undefined));
					return cached;
				}
				return (await refresh) ?? new Response('offline', { status: 503 });
			})()
		);
		return;
	}

	// SvelteKit data requests: network-first so the in-page background refresh is real,
	// cache only as an offline fallback
	if (url.pathname.includes('__data.json')) {
		event.respondWith(
			(async () => {
				const cache = await caches.open(CACHE);
				try {
					const res = await fetch(request);
					if (res.ok) cache.put(request, res.clone());
					return res;
				} catch {
					return (await cache.match(request)) ?? new Response('offline', { status: 503 });
				}
			})()
		);
	}
});
