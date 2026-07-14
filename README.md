# newtab

A private, single-page life dashboard: tasks, reading/listening queue, calories, focus — edited in the browser or by agents over MCP. One SvelteKit server on Railway, SQLite on a volume, no external DB.

**Docs:** [architecture & flows](docs/architecture.md) · [API + MCP reference](docs/api.md)

## Architecture

Everything writes through one **shared core** ([src/lib/server/core.ts](src/lib/server/core.ts)). Two doors into it:

- **Browser** — `POST /login` with a passcode sets a signed JWT cookie; the page and `/api/*` require it.
- **Agents** — `POST /mcp` (Streamable HTTP MCP server) with `Authorization: Bearer <MCP_KEY>`. The bearer key also works on `/api/*`.

Data lives in SQLite (`better-sqlite3`), migrated on boot. [data.json](data.json) is only a first-run seed — live truth is the DB.

## Run locally

```sh
npm install
npm run dev
```

Dev fallbacks: passcode `dev`, bearer key `dev-mcp-key`. DB at `./data/newtab.db` (gitignored).

## Deploy (Railway)

1. Push this repo to a private GitHub repo, create a Railway service from it.
2. Add a **volume mounted at `/data`**.
3. Set env variables:
   - `PASSCODE` — your login passcode
   - `JWT_SECRET` — long random string (`openssl rand -hex 32`)
   - `MCP_KEY` — long random bearer token (`openssl rand -hex 32`)
   - `DATABASE_PATH=/data/newtab.db`
   - `TZ=Asia/Kuala_Lumpur`
4. Deploy. Health check at `/health`.

## MCP

Point any MCP client (Cowork, Claude Code, …) at:

```
url:    https://<your-domain>/mcp
auth:   Authorization: Bearer <MCP_KEY>
```

All 15 tools (items, meals, spending, focus, targets, shortcuts) are listed with arguments in [docs/api.md](docs/api.md).

## Backup

`GET /api/export` (bearer-auth'd) returns the whole DB as JSON. [scripts/backup.sh](scripts/backup.sh) curls it into `mkyos` and commits — run it nightly via cron/launchd.

## Data model

- **items** — things you check off. `kind` = `do` (act now) · `think` (mull/decide) · `queue` (consume; has `medium` read/listen/watch). Optional `context` = work · heirlight · content · personal. No due dates — urgency is the kind.
- **meals** — freeform calorie log (kcal + protein/carbs/fat).
- **spending** — schema ready, widget parked for v1.
- **config** — focus line, calorie target, shortcuts, widget layout (show/hide/reorder from Settings; `sensitive` widgets blur in privacy mode).

Design system: **titan** (warm minimal, Geist + Geist Mono, muted accent tones) — tokens in [src/app.css](src/app.css), light theme only.
