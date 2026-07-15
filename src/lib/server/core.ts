import { getDb } from './db';
import { KINDS, MEDIUMS, CONTEXTS } from '$lib/types';
import type { Item, Meal, Spend, Shortcut, QuickLink, Widget, Config } from '$lib/types';

export type { Item, Meal, Spend, Shortcut, QuickLink, Widget, Config };

export class CoreError extends Error {}

function assertOneOf<T extends string>(value: unknown, allowed: readonly T[], field: string): T {
	if (typeof value !== 'string' || !allowed.includes(value as T))
		throw new CoreError(`${field} must be one of: ${allowed.join(', ')}`);
	return value as T;
}

function assertOptional<T extends string>(
	value: unknown,
	allowed: readonly T[],
	field: string
): T | null {
	if (value == null || value === '') return null;
	return assertOneOf(value, allowed, field);
}

// server runs in UTC on Railway; TZ env var (e.g. Asia/Kuala_Lumpur) makes this local
function fmtDate(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

function todayLocal(): string {
	return fmtDate(new Date());
}

function rowToItem(row: any): Item {
	return { ...row, flagged: !!row.flagged };
}

// ---- items ----

export function listItems(filter: { kind?: string; context?: string; status?: string } = {}): Item[] {
	const where: string[] = [];
	const params: string[] = [];
	if (filter.kind) {
		where.push('kind = ?');
		params.push(assertOneOf(filter.kind, KINDS, 'kind'));
	}
	if (filter.context) {
		where.push('context = ?');
		params.push(assertOneOf(filter.context, CONTEXTS, 'context'));
	}
	if (filter.status) {
		where.push('status = ?');
		params.push(assertOneOf(filter.status, ['open', 'done'] as const, 'status'));
	}
	const sql = `SELECT * FROM items ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
		ORDER BY flagged DESC, created_at DESC`;
	return getDb().prepare(sql).all(...params).map(rowToItem);
}

export function getItem(id: string): Item {
	const row = getDb().prepare('SELECT * FROM items WHERE id = ?').get(id);
	if (!row) throw new CoreError(`no item with id ${id}`);
	return rowToItem(row);
}

export function addItem(input: {
	kind: string;
	title: string;
	context?: string | null;
	url?: string | null;
	medium?: string | null;
	source?: string | null;
	flagged?: boolean;
}): Item {
	const kind = assertOneOf(input.kind, KINDS, 'kind');
	if (typeof input.title !== 'string' || !input.title.trim()) throw new CoreError('title is required');
	const medium = assertOptional(input.medium, MEDIUMS, 'medium');
	const context = assertOptional(input.context, CONTEXTS, 'context');
	if (medium && kind !== 'queue') throw new CoreError('medium only applies to queue items');
	const id = crypto.randomUUID();
	getDb()
		.prepare(
			`INSERT INTO items (id, kind, medium, context, title, url, source, status, flagged)
			 VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?)`
		)
		.run(id, kind, medium, context, input.title.trim(), input.url || null, input.source || null, input.flagged ? 1 : 0);
	return getItem(id);
}

export function updateItem(
	id: string,
	patch: Partial<{
		kind: string;
		medium: string | null;
		context: string | null;
		title: string;
		url: string | null;
		source: string | null;
		status: string;
		flagged: boolean;
	}>
): Item {
	const current = getItem(id);
	const sets: string[] = [];
	const params: unknown[] = [];

	if (patch.kind !== undefined) {
		sets.push('kind = ?');
		params.push(assertOneOf(patch.kind, KINDS, 'kind'));
	}
	if (patch.medium !== undefined) {
		sets.push('medium = ?');
		params.push(assertOptional(patch.medium, MEDIUMS, 'medium'));
	}
	if (patch.context !== undefined) {
		sets.push('context = ?');
		params.push(assertOptional(patch.context, CONTEXTS, 'context'));
	}
	if (patch.title !== undefined) {
		if (typeof patch.title !== 'string' || !patch.title.trim()) throw new CoreError('title cannot be empty');
		sets.push('title = ?');
		params.push(patch.title.trim());
	}
	if (patch.url !== undefined) {
		sets.push('url = ?');
		params.push(patch.url || null);
	}
	if (patch.source !== undefined) {
		sets.push('source = ?');
		params.push(patch.source || null);
	}
	if (patch.flagged !== undefined) {
		sets.push('flagged = ?');
		params.push(patch.flagged ? 1 : 0);
	}
	if (patch.status !== undefined) {
		const status = assertOneOf(patch.status, ['open', 'done'] as const, 'status');
		sets.push('status = ?');
		params.push(status);
		sets.push('completed_at = ?');
		params.push(status === 'done' ? new Date().toISOString() : null);
	}
	if (!sets.length) return current;

	sets.push(`updated_at = datetime('now')`);
	getDb().prepare(`UPDATE items SET ${sets.join(', ')} WHERE id = ?`).run(...params, id);
	return getItem(id);
}

export function completeItem(id: string): Item {
	return updateItem(id, { status: 'done' });
}

export function removeItem(id: string): void {
	const res = getDb().prepare('DELETE FROM items WHERE id = ?').run(id);
	if (res.changes === 0) throw new CoreError(`no item with id ${id}`);
}

// ---- meals ----

export function logMeal(input: {
	name: string;
	kcal: number;
	p?: number;
	c?: number;
	f?: number;
	date?: string;
}): Meal {
	if (typeof input.name !== 'string' || !input.name.trim()) throw new CoreError('name is required');
	const kcal = Number(input.kcal);
	if (!Number.isFinite(kcal) || kcal < 0) throw new CoreError('kcal must be a non-negative number');
	const id = crypto.randomUUID();
	getDb()
		.prepare('INSERT INTO meals (id, date, name, kcal, p, c, f) VALUES (?, ?, ?, ?, ?, ?, ?)')
		.run(
			id,
			input.date || todayLocal(),
			input.name.trim(),
			Math.round(kcal),
			Number(input.p) || 0,
			Number(input.c) || 0,
			Number(input.f) || 0
		);
	return getDb().prepare('SELECT * FROM meals WHERE id = ?').get(id) as Meal;
}

export function listMeals(date?: string): Meal[] {
	return getDb()
		.prepare('SELECT * FROM meals WHERE date = ? ORDER BY created_at ASC')
		.all(date || todayLocal()) as Meal[];
}

export function removeMeal(id: string): void {
	const res = getDb().prepare('DELETE FROM meals WHERE id = ?').run(id);
	if (res.changes === 0) throw new CoreError(`no meal with id ${id}`);
}

// ---- spending (schema ready; widget parked for v1) ----

export function logSpend(input: {
	amount: number;
	category: string;
	note?: string;
	currency?: string;
	date?: string;
}): Spend {
	const amount = Number(input.amount);
	if (!Number.isFinite(amount)) throw new CoreError('amount must be a number');
	if (typeof input.category !== 'string' || !input.category.trim()) throw new CoreError('category is required');
	const id = crypto.randomUUID();
	getDb()
		.prepare('INSERT INTO spending (id, date, amount, currency, category, note) VALUES (?, ?, ?, ?, ?, ?)')
		.run(id, input.date || todayLocal(), amount, input.currency || 'RM', input.category.trim(), input.note || null);
	return getDb().prepare('SELECT * FROM spending WHERE id = ?').get(id) as Spend;
}

export function listSpend(month?: string): Spend[] {
	const m = month || todayLocal().slice(0, 7);
	return getDb()
		.prepare(`SELECT * FROM spending WHERE date LIKE ? || '%' ORDER BY date DESC, created_at DESC`)
		.all(m) as Spend[];
}

// ---- config ----

export function getConfig(): Config {
	const row = getDb().prepare('SELECT * FROM config WHERE id = 1').get() as any;
	return {
		focus: row.focus,
		focus_icon: row.focus_icon,
		name: row.name,
		wallpaper: row.wallpaper,
		calorie_target: row.calorie_target,
		budget_month: row.budget_month,
		shortcuts: JSON.parse(row.shortcuts),
		quick_links: JSON.parse(row.quick_links),
		widgets: JSON.parse(row.widgets)
	};
}

export function setFocusIcon(name: string): Config {
	if (typeof name !== 'string') throw new CoreError('focus_icon must be a string (icon name, empty to clear)');
	getDb().prepare('UPDATE config SET focus_icon = ? WHERE id = 1').run(name.trim());
	return getConfig();
}

export function setQuickLinks(links: QuickLink[]): Config {
	if (!Array.isArray(links)) throw new CoreError('quick_links must be an array');
	for (const l of links) {
		if (!l.label?.trim() || !l.url?.trim()) throw new CoreError('every quick link needs a label and url');
	}
	getDb().prepare('UPDATE config SET quick_links = ? WHERE id = 1').run(JSON.stringify(links));
	return getConfig();
}

export function setName(text: string): Config {
	if (typeof text !== 'string' || !text.trim()) throw new CoreError('name cannot be empty');
	getDb().prepare('UPDATE config SET name = ? WHERE id = 1').run(text.trim());
	return getConfig();
}

export function setWallpaper(url: string): Config {
	if (typeof url !== 'string') throw new CoreError('wallpaper must be a string (url, or empty to clear)');
	getDb().prepare('UPDATE config SET wallpaper = ? WHERE id = 1').run(url.trim());
	return getConfig();
}

export function setFocus(text: string): Config {
	if (typeof text !== 'string') throw new CoreError('focus must be a string');
	getDb().prepare('UPDATE config SET focus = ? WHERE id = 1').run(text.trim());
	return getConfig();
}

export function setTargets(targets: { calories?: number | null; budget?: number | null }): Config {
	const db = getDb();
	if (targets.calories !== undefined) {
		const v = targets.calories === null ? null : Math.round(Number(targets.calories));
		if (v !== null && (!Number.isFinite(v) || v <= 0)) throw new CoreError('calories target must be a positive number');
		db.prepare('UPDATE config SET calorie_target = ? WHERE id = 1').run(v);
	}
	if (targets.budget !== undefined) {
		const v = targets.budget === null ? null : Math.round(Number(targets.budget));
		if (v !== null && (!Number.isFinite(v) || v <= 0)) throw new CoreError('budget must be a positive number');
		db.prepare('UPDATE config SET budget_month = ? WHERE id = 1').run(v);
	}
	return getConfig();
}

export function setShortcut(input: { label: string; url: string; icon?: string }): Config {
	if (!input.label?.trim() || !input.url?.trim()) throw new CoreError('label and url are required');
	const cfg = getConfig();
	const existing = cfg.shortcuts.find((s) => s.label.toLowerCase() === input.label.trim().toLowerCase());
	if (existing) {
		existing.url = input.url.trim();
		if (input.icon) existing.icon = input.icon;
	} else {
		cfg.shortcuts.push({
			id: crypto.randomUUID(),
			label: input.label.trim(),
			url: input.url.trim(),
			icon: input.icon
		});
	}
	return setShortcuts(cfg.shortcuts);
}

export function setShortcuts(shortcuts: Shortcut[]): Config {
	if (!Array.isArray(shortcuts)) throw new CoreError('shortcuts must be an array');
	for (const s of shortcuts) {
		if (!s.label?.trim() || !s.url?.trim()) throw new CoreError('every shortcut needs a label and url');
		if (!s.id) s.id = crypto.randomUUID();
	}
	getDb().prepare('UPDATE config SET shortcuts = ? WHERE id = 1').run(JSON.stringify(shortcuts));
	return getConfig();
}

export function removeShortcut(id: string): Config {
	const cfg = getConfig();
	const next = cfg.shortcuts.filter((s) => s.id !== id);
	if (next.length === cfg.shortcuts.length) throw new CoreError(`no shortcut with id ${id}`);
	return setShortcuts(next);
}

export function setWidgets(widgets: Widget[]): Config {
	if (!Array.isArray(widgets)) throw new CoreError('widgets must be an array');
	getDb().prepare('UPDATE config SET widgets = ? WHERE id = 1').run(JSON.stringify(widgets));
	return getConfig();
}

// ---- dashboard ----

export function getDashboard() {
	const config = getConfig();
	const items = listItems({ status: 'open' });
	const doneToday = (
		getDb()
			.prepare(
				`SELECT * FROM items WHERE status = 'done'
				 AND date(completed_at, 'localtime') = date('now', 'localtime')
				 ORDER BY completed_at DESC`
			)
			.all() as any[]
	).map(rowToItem);
	// completions per day for the last 7 days (oldest → today), for the little sparkline
	const weekRows = getDb()
		.prepare(
			`SELECT date(completed_at, 'localtime') AS d, COUNT(*) AS c FROM items
			 WHERE status = 'done' AND date(completed_at, 'localtime') >= date('now', 'localtime', '-6 days')
			 GROUP BY d`
		)
		.all() as { d: string; c: number }[];
	const byDay = new Map(weekRows.map((r) => [r.d, r.c]));
	const doneWeek = Array.from({ length: 7 }, (_, i) => {
		const d = new Date();
		d.setDate(d.getDate() - (6 - i));
		return byDay.get(fmtDate(d)) ?? 0;
	});
	const meals = listMeals();
	const totals = meals.reduce(
		(acc, m) => ({ kcal: acc.kcal + m.kcal, p: acc.p + m.p, c: acc.c + m.c, f: acc.f + m.f }),
		{ kcal: 0, p: 0, c: 0, f: 0 }
	);
	return {
		date: todayLocal(),
		config,
		items,
		done_today: doneToday,
		done_week: doneWeek,
		meals,
		meal_totals: totals
	};
}

// ---- export (backup) ----

export function exportAll() {
	const db = getDb();
	return {
		exported_at: new Date().toISOString(),
		config: getConfig(),
		items: (db.prepare('SELECT * FROM items ORDER BY created_at').all() as any[]).map(rowToItem),
		meals: db.prepare('SELECT * FROM meals ORDER BY date, created_at').all(),
		spending: db.prepare('SELECT * FROM spending ORDER BY date, created_at').all()
	};
}
