# Architecture

One server, one store, two doors. Nobody edits the data behind the server's back.

```
	browser ──(JWT cookie)──▶ /api/* ─┐
	                                  ├─▶ shared core ──▶ SQLite (/data/newtab.db)
	agents ──(bearer key)──▶ /mcp  ───┘   src/lib/server/core.ts
```

## Layout

| Path | Role |
|---|---|
| `src/lib/server/core.ts` | **the** shared core — every read/write, all validation. HTTP and MCP are thin wrappers over it |
| `src/lib/server/db.ts` | opens SQLite, runs migrations on boot, seeds from `data.json` on first run |
| `src/lib/server/auth.ts` | passcode check, JWT sign/verify, bearer check (all constant-time compares) |
| `src/hooks.server.ts` | the gate: routes every request to the right auth door (see below) |
| `src/routes/api/*` | HTTP endpoints for the browser |
| `src/routes/mcp/+server.ts` | MCP server (stateless Streamable HTTP JSON-RPC) |
| `src/routes/+page.svelte` | the single dashboard page — everything on one screen, no sub-pages |
| `src/lib/components/*` | one component per widget |
| `src/lib/types.ts` | shared types (client-safe; the server core re-exports them) |
| `data.json` | first-run seed only — live truth is the DB |

## Auth flow

Every request passes through `hooks.server.ts`:

1. `/health`, `/login` → public.
2. `/mcp` → requires `Authorization: Bearer <MCP_KEY>`; 401 otherwise. Cookies are ignored here.
3. Everything else → valid session cookie **or** bearer key passes; otherwise `/api/*` gets 401 and page routes redirect to `/login`.

Login: `POST /login` compares the passcode against `PASSCODE` (constant-time), then sets an httpOnly `newtab_session` cookie — an HS256 JWT signed with `JWT_SECRET`, 365-day expiry (log in once per device). Logout deletes the cookie.

The bearer key is separate from the passcode so machine access rotates independently of your login. In `npm run dev` only, missing env vars fall back to `dev` / `dev-mcp-key`; production throws on boot if unset.

## Data model

SQLite via `better-sqlite3`, WAL mode. Migrations run on every boot: `CREATE TABLE IF NOT EXISTS` for new installs plus additive `ALTER TABLE ADD COLUMN` checks (via `PRAGMA table_info`) for existing databases — so schema changes are append-only and old DBs upgrade in place.

Two families of data:

- **items** — things you toggle open/done. The `kind` carries urgency (`do` > `think` > `queue`) — deliberately no due dates or timers. `queue` items can carry a `medium` (read/listen/watch) and `url`.
- **logs** — things you append to: `meals` (freeform calorie log) and `spending` (schema + API live, widget parked for v1).

Plus **config** — a single row (`id = 1`): focus line, greeting name, wallpaper url, calorie target, monthly budget, `shortcuts` JSON, `widgets` JSON.

## The screen

Single page, one glance — no sub-pages or tabs. Desktop is a two-column grid (main column + 340px sidebar), collapsing to one column under 960px.

- **Widget config drives the layout**: `config.widgets` is `[{id, visible, order, sensitive}]`. Settings toggles visibility and reorders — no code change. Shortcuts (and budget, later) render in the sidebar; now/items/calories in the main column; both respect the config order. Unknown ids are ignored.
- **Item rows** are flat and compact (no kind headers) — the coloured kind icon carries that signal — pinned items first, then do → think → queue. Each row has a dropdown menu (mark done / pin to top / open link / delete) instead of a checkbox. List changes animate (FLIP + slide). A multi-select context filter (work/heirlight/content/personal/untagged) persists per device in `localStorage`, like privacy mode.
- **Calories** renders as a compact sidebar card below shortcuts: kcal total (+ progress bar when a target is set) and three macro mini-bars coloured per macro, filled by each macro's share of calories (4/4/9 kcal per gram).
- **Header** = date + a rotating greeting (`src/lib/greetings.ts`, bucketed by hour), a large clock with a sun-phase icon, and small status lines: local weather (Open-Meteo, keyless, coords hardcoded in `StatusLines.svelte`) and a US-market indicator (9:30–16:00 America/New_York — countdown when <24h away, pulsing dot while open).
- **Progress** = a thin dot-grid strip above focus: month as day-dots, year as week-dots; filled = elapsed, terracotta = current, faint = remaining.
- **Tagline** (widget id `focus`) = a one-line personal tagline under the greeting, click to edit (stored in `config.focus`).
- **Items** is a read-style view: **Today** (`do`) and **Later** (`think`) sections with counts, plus a 7-day done sparkline in the heading. **Queue** items render as their own sidebar widget — the reading/watching/listening list. The long-term direction is read-mostly: agents and task-app syncs write via MCP, the page is for glancing.
- **Up next** (widget id `sports`) = next F1 race from `src/lib/data/f1-2026.json` — a local, committed season calendar (no API); edit the file when the calendar changes. A Raptors slot can join it once a data source is picked.
- **Theme** is a manual header toggle (light default, `.dark` class on `<html>`), persisted per device in `localStorage` — the system setting is ignored.
- **Quick-add**: pressing `a` anywhere outside a field opens the add-item form focused. **Done today** shows as a small line under Items, expandable with per-item undo (sets status back to open).
- **Privacy mode** (eye icon) blurs every widget with `sensitive: true` — for screen-sharing. Persisted per device in `localStorage`, not in config.
- **Mutations**: components call `src/lib/client/api.ts` (fetch → `invalidateAll()`), so the page reloads its data after every write. No client cache to drift.
- **Customization** lives in config (Settings, `PATCH /api/config`, or MCP): greeting name, wallpaper image url (rendered as a fixed cover background), shortcuts, widget layout. Shortcut icons are fetched from Google's favicon service by domain, falling back to a globe icon.
- **Theme**: light only, by choice. Design tokens in `src/app.css` (titan: warm near-white, Geist + Geist Mono, white cards) plus muted accent tones per item kind (`--kind-*`) and context (`--ctx-*`).

## Backup

The live DB exists only on the Railway volume. `GET /api/export` dumps everything (config, items, meals, spending) as JSON; `scripts/backup.sh` curls it into the `mkyos` repo and commits, giving version history + a plaintext copy. Intended as a nightly cron on any machine with the bearer key.

## Deploy

Railway service from the GitHub repo (`railway.json` sets `node build` + `/health` healthcheck), volume mounted at `/data`, env vars: `PASSCODE`, `JWT_SECRET`, `MCP_KEY`, `DATABASE_PATH=/data/newtab.db`, `TZ`. Push to deploy.
