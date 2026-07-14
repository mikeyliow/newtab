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

Plus **config** — a single row (`id = 1`): greeting name, wallpaper url, calorie target, monthly budget, `shortcuts` JSON, `widgets` JSON, and a `focus` line (API/MCP-only; no widget renders it).

## The screen

Single page, one glance — no sub-pages or tabs. Desktop is a two-column grid (main column + 340px sidebar), collapsing to one column under 960px.

- **Widget config drives the layout**: `config.widgets` is `[{id, visible, order, sensitive}]`. Settings toggles visibility and reorders — no code change. Shortcuts (and budget, later) render in the sidebar; now/items/calories in the main column; both respect the config order. Unknown ids are ignored.
- **Item rows** are flat and compact (no kind headers) — the coloured kind icon carries that signal — sorted do → think → queue, flagged first within each kind. Each row has a dropdown menu (mark done / pin / open link / delete) instead of a checkbox.
- **Now strip** = open `do` items + anything flagged, derived client-side.
- **Privacy mode** (eye icon) blurs every widget with `sensitive: true` — for screen-sharing. Persisted per device in `localStorage`, not in config.
- **Mutations**: components call `src/lib/client/api.ts` (fetch → `invalidateAll()`), so the page reloads its data after every write. No client cache to drift.
- **Customization** lives in config (Settings, `PATCH /api/config`, or MCP): greeting name, wallpaper image url (rendered as a fixed cover background), shortcuts, widget layout. Shortcut icons are fetched from Google's favicon service by domain, falling back to a globe icon.
- **Theme**: light only, by choice. Design tokens in `src/app.css` (titan: warm near-white, Geist + Geist Mono, white cards) plus muted accent tones per item kind (`--kind-*`) and context (`--ctx-*`).

## Backup

The live DB exists only on the Railway volume. `GET /api/export` dumps everything (config, items, meals, spending) as JSON; `scripts/backup.sh` curls it into the `mkyos` repo and commits, giving version history + a plaintext copy. Intended as a nightly cron on any machine with the bearer key.

## Deploy

Railway service from the GitHub repo (`railway.json` sets `node build` + `/health` healthcheck), volume mounted at `/data`, env vars: `PASSCODE`, `JWT_SECRET`, `MCP_KEY`, `DATABASE_PATH=/data/newtab.db`, `TZ`. Push to deploy.
