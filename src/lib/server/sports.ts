import { getDb } from './db';
import type { RaptorsInfo, RaptorsLast } from '$lib/types';

// Raptors data via ESPN's public (unofficial) JSON API — free, no key.
// Cached in SQLite so the page never waits on ESPN and outages just mean stale data.

const SCHEDULE_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/tor/schedule';
const SUMMARY_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=';
const TTL_MS = 6 * 60 * 60 * 1000;

function cacheGet(key: string): { value: unknown; age: number } | null {
	const row = getDb().prepare('SELECT value, fetched_at FROM cache WHERE key = ?').get(key) as
		| { value: string; fetched_at: number }
		| undefined;
	if (!row) return null;
	return { value: JSON.parse(row.value), age: Date.now() - row.fetched_at };
}

function cacheSet(key: string, value: unknown): void {
	getDb()
		.prepare('INSERT OR REPLACE INTO cache (key, value, fetched_at) VALUES (?, ?, ?)')
		.run(key, JSON.stringify(value), Date.now());
}

function parseGame(event: any) {
	const comp = event.competitions?.[0];
	const competitors = comp?.competitors ?? [];
	const tor = competitors.find((c: any) => c.team?.abbreviation === 'TOR');
	const opp = competitors.find((c: any) => c.team?.abbreviation !== 'TOR');
	if (!tor || !opp) return null;
	return {
		date: event.date as string,
		state: comp?.status?.type?.state as string, // 'pre' | 'in' | 'post'
		home: tor.homeAway === 'home',
		opponent: (opp.team?.shortDisplayName || opp.team?.displayName || '?') as string,
		opponentAbbr: (opp.team?.abbreviation || '?') as string,
		win: tor.winner === true,
		score: tor.score?.displayValue || tor.score,
		oppScore: opp.score?.displayValue || opp.score,
		id: event.id as string
	};
}

async function topRaptor(eventId: string): Promise<RaptorsLast['top']> {
	const res = await fetch(SUMMARY_URL + eventId, { signal: AbortSignal.timeout(4000) });
	const data = await res.json();
	const tor = (data.boxscore?.players ?? []).find((t: any) => t.team?.abbreviation === 'TOR');
	const stats = tor?.statistics?.[0];
	if (!stats) return null;
	const names: string[] = stats.names ?? [];
	const iPts = names.indexOf('PTS');
	const iReb = names.indexOf('REB');
	const iAst = names.indexOf('AST');
	let best: RaptorsLast['top'] = null;
	for (const a of stats.athletes ?? []) {
		const pts = Number(a.stats?.[iPts]) || 0;
		if (!best || pts > best.pts) {
			best = {
				name: a.athlete?.shortName || a.athlete?.displayName || '?',
				pts,
				reb: Number(a.stats?.[iReb]) || 0,
				ast: Number(a.stats?.[iAst]) || 0
			};
		}
	}
	return best;
}

export async function getRaptors(): Promise<RaptorsInfo | null> {
	const cached = cacheGet('raptors');
	if (cached && cached.age < TTL_MS) return cached.value as RaptorsInfo;

	try {
		const res = await fetch(SCHEDULE_URL, { signal: AbortSignal.timeout(4000) });
		const data = await res.json();
		const games = ((data.events ?? []) as any[])
			.map(parseGame)
			.filter(Boolean)
			.sort((a, b) => a!.date.localeCompare(b!.date));

		const now = Date.now();
		const nextGame = games.find((g) => g!.state === 'pre' && new Date(g!.date).getTime() >= now);
		const played = games.filter((g) => g!.state === 'post');
		const lastGame = played[played.length - 1];

		const info: RaptorsInfo = {
			next: nextGame
				? { date: nextGame.date, opponent: nextGame.opponent, home: nextGame.home }
				: null,
			last: lastGame
				? {
						date: lastGame.date,
						opponent: lastGame.opponentAbbr,
						home: lastGame.home,
						win: lastGame.win,
						score: `${lastGame.score}-${lastGame.oppScore}`,
						top: await topRaptor(lastGame.id).catch(() => null)
					}
				: null
		};
		cacheSet('raptors', info);
		return info;
	} catch {
		// ESPN down or shape changed — serve whatever we had, however old
		return (cached?.value as RaptorsInfo) ?? null;
	}
}
