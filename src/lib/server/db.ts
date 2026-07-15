import Database from 'better-sqlite3';
import { env } from '$env/dynamic/private';
import fs from 'node:fs';
import path from 'node:path';

const DB_PATH = env.DATABASE_PATH || 'data/newtab.db';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
	if (db) return db;
	fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
	db = new Database(DB_PATH);
	db.pragma('journal_mode = WAL');
	migrate(db);
	seedIfEmpty(db);
	return db;
}

function migrate(db: Database.Database) {
	db.exec(`
		CREATE TABLE IF NOT EXISTS items (
			id TEXT PRIMARY KEY,
			kind TEXT NOT NULL CHECK (kind IN ('do','think','queue')),
			medium TEXT CHECK (medium IN ('read','listen','watch')),
			context TEXT CHECK (context IN ('work','heirlight','content','personal')),
			title TEXT NOT NULL,
			url TEXT,
			source TEXT,
			status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','done')),
			flagged INTEGER NOT NULL DEFAULT 0,
			created_at TEXT NOT NULL DEFAULT (datetime('now')),
			updated_at TEXT NOT NULL DEFAULT (datetime('now')),
			completed_at TEXT
		);

		CREATE TABLE IF NOT EXISTS meals (
			id TEXT PRIMARY KEY,
			date TEXT NOT NULL,
			name TEXT NOT NULL,
			kcal INTEGER NOT NULL,
			p REAL NOT NULL DEFAULT 0,
			c REAL NOT NULL DEFAULT 0,
			f REAL NOT NULL DEFAULT 0,
			created_at TEXT NOT NULL DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS spending (
			id TEXT PRIMARY KEY,
			date TEXT NOT NULL,
			amount REAL NOT NULL,
			currency TEXT NOT NULL DEFAULT 'RM',
			category TEXT NOT NULL,
			note TEXT,
			created_at TEXT NOT NULL DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS cache (
			key TEXT PRIMARY KEY,
			value TEXT NOT NULL,
			fetched_at INTEGER NOT NULL
		);

		CREATE TABLE IF NOT EXISTS config (
			id INTEGER PRIMARY KEY CHECK (id = 1),
			focus TEXT NOT NULL DEFAULT '',
			calorie_target INTEGER,
			budget_month INTEGER,
			shortcuts TEXT NOT NULL DEFAULT '[]',
			widgets TEXT NOT NULL DEFAULT '[]'
		);

		CREATE INDEX IF NOT EXISTS idx_items_status ON items (status, kind);
		CREATE INDEX IF NOT EXISTS idx_meals_date ON meals (date);
		CREATE INDEX IF NOT EXISTS idx_spending_date ON spending (date);
	`);

	// additive column migrations for existing databases
	const cols = (db.prepare('PRAGMA table_info(config)').all() as { name: string }[]).map((c) => c.name);
	if (!cols.includes('name')) db.exec(`ALTER TABLE config ADD COLUMN name TEXT NOT NULL DEFAULT 'Mikey'`);
	if (!cols.includes('wallpaper')) db.exec(`ALTER TABLE config ADD COLUMN wallpaper TEXT NOT NULL DEFAULT ''`);
	if (!cols.includes('focus_icon')) db.exec(`ALTER TABLE config ADD COLUMN focus_icon TEXT NOT NULL DEFAULT ''`);
	if (!cols.includes('quick_links'))
		db.exec(
			`ALTER TABLE config ADD COLUMN quick_links TEXT NOT NULL DEFAULT '${JSON.stringify(DEFAULT_QUICK_LINKS)}'`
		);

	// newly introduced widgets join existing configs at the end (reorder in Settings)
	const cfgRow = db.prepare('SELECT widgets FROM config WHERE id = 1').get() as
		| { widgets: string }
		| undefined;
	if (cfgRow) {
		const widgets = JSON.parse(cfgRow.widgets) as { id: string; order: number }[];
		const have = new Set(widgets.map((w) => w.id));
		const missing = DEFAULT_WIDGETS.filter((w) => !have.has(w.id));
		if (missing.length) {
			const maxOrder = Math.max(0, ...widgets.map((w) => w.order));
			missing.forEach((w, i) => widgets.push({ ...w, order: maxOrder + i + 1 }));
			db.prepare('UPDATE config SET widgets = ? WHERE id = 1').run(JSON.stringify(widgets));
		}
	}
}

function seedIfEmpty(db: Database.Database) {
	const hasConfig = db.prepare('SELECT 1 FROM config WHERE id = 1').get();
	if (hasConfig) return;

	let seed: any = {};
	try {
		seed = JSON.parse(fs.readFileSync('data.json', 'utf8'));
	} catch {
		// no seed file — start with defaults
	}

	const cfg = seed.config ?? {};
	db.prepare(
		`INSERT INTO config (id, focus, calorie_target, budget_month, shortcuts, widgets, name, wallpaper, focus_icon, quick_links)
		 VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
	).run(
		cfg.focus ?? '',
		cfg.calorie_target ?? null,
		cfg.budget_month ?? null,
		JSON.stringify(cfg.shortcuts ?? []),
		JSON.stringify(cfg.widgets ?? DEFAULT_WIDGETS),
		cfg.name ?? 'Mikey',
		cfg.wallpaper ?? '',
		cfg.focus_icon ?? '',
		JSON.stringify(cfg.quick_links ?? DEFAULT_QUICK_LINKS)
	);

	const insert = db.prepare(
		`INSERT INTO items (id, kind, medium, context, title, url, source, status, flagged)
		 VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?)`
	);
	for (const it of seed.items ?? []) {
		insert.run(
			crypto.randomUUID(),
			it.kind ?? 'do',
			it.medium ?? null,
			it.context ?? null,
			it.title,
			it.url ?? null,
			it.source ?? null,
			it.flagged ? 1 : 0
		);
	}
}

export const DEFAULT_QUICK_LINKS = [
	{ label: 'Calendar', url: 'https://calendar.google.com/u/0', icon: 'calendar' },
	{ label: 'Mail', url: 'https://mail.google.com/mail/u/0/#inbox', icon: 'mail' },
	{ label: 'Tasks', url: 'https://tasks.google.com/', icon: 'square-check-big' }
];

export const DEFAULT_WIDGETS = [
	{ id: 'progress', visible: true, order: 1, sensitive: false },
	{ id: 'focus', visible: true, order: 2, sensitive: false },
	{ id: 'items', visible: true, order: 3, sensitive: true },
	{ id: 'queue', visible: true, order: 4, sensitive: false },
	{ id: 'sports', visible: true, order: 5, sensitive: false },
	{ id: 'shortcuts', visible: true, order: 6, sensitive: false },
	{ id: 'calories', visible: false, order: 7, sensitive: true },
	{ id: 'budget', visible: false, order: 8, sensitive: true }
];
