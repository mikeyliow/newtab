# API reference

Two doors into the same data. Both are thin wrappers over the shared core (`src/lib/server/core.ts`) — same validation, same behavior.

| Door | Path | Auth |
|---|---|---|
| Browser | `/api/*` | JWT session cookie (set by `POST /login`) — bearer key also accepted |
| Agents (MCP) | `/mcp` | `Authorization: Bearer <MCP_KEY>` only |

`GET /health` and the `/login` page are the only unauthenticated routes.

## Enums

| Field | Values | Meaning |
|---|---|---|
| `kind` | `do` · `think` · `queue` | act now · mull/decide · consume later |
| `medium` | `read` · `listen` · `watch` | only for `queue` items; drives the icon |
| `context` | `work` · `heirlight` · `content` · `personal` | optional life-area tag |
| `status` | `open` · `done` | |

Dates are `YYYY-MM-DD` strings, months `YYYY-MM`, both defaulting to today (server `TZ`). Invalid enum values are rejected with a message listing the allowed ones.

## HTTP API

All bodies are JSON. Validation failures return `400 {"error": "<message>"}`; missing auth returns `401`.

| Method + path | Body / params | Returns |
|---|---|---|
| `POST /login` | form field `passcode` | sets session cookie, redirects `/` |
| `POST /api/logout` | — | clears the cookie |
| `GET /api/items` | query: `kind`, `context`, `status` (all optional) | `Item[]` (flagged first, newest first) |
| `POST /api/items` | `{kind, title, context?, url?, medium?, source?, flagged?}` | created `Item` |
| `PATCH /api/items/:id` | any subset of `{kind, title, context, url, medium, source, status, flagged}` | updated `Item` |
| `DELETE /api/items/:id` | — | `{ok: true}` |
| `GET /api/meals` | query: `date?` | `Meal[]` for that day |
| `POST /api/meals` | `{name, kcal, p?, c?, f?, date?}` (macros in grams) | created `Meal` |
| `DELETE /api/meals/:id` | — | `{ok: true}` |
| `GET /api/config` | — | `Config` |
| `PATCH /api/config` | any subset of `{focus, focus_icon, name, wallpaper, calorie_target, budget_month, shortcuts, quick_links, widgets}` | updated `Config` |
| `GET /api/export` | — | full DB dump as JSON (used by the backup script) |

Notes:
- Setting `status: "done"` stamps `completed_at`; back to `"open"` clears it.
- `PATCH /api/config` with `shortcuts` / `widgets` replaces the whole array (the UI always sends the full list).
- `calorie_target: null` clears the target.

### Shapes

```jsonc
// Item
{ "id": "uuid", "kind": "do", "medium": null, "context": "work",
  "title": "…", "url": null, "source": null, "status": "open",
  "flagged": false, "created_at": "…", "updated_at": "…", "completed_at": null }

// Meal
{ "id": "uuid", "date": "2026-07-14", "name": "nasi lemak",
  "kcal": 650, "p": 18, "c": 80, "f": 28, "created_at": "…" }

// Config
{ "focus": "…", "name": "Mikey", "wallpaper": "",
  "calorie_target": null, "budget_month": null,
  "shortcuts": [{ "id": "uuid", "label": "Gmail", "url": "https://…", "icon": "mail" }],
  "widgets":   [{ "id": "items", "visible": true, "order": 3, "sensitive": false }] }
```

## MCP server

`POST /mcp` — stateless [Streamable HTTP](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#streamable-http) MCP server, JSON responses (no SSE, no sessions). Handles `initialize`, `ping`, `tools/list`, `tools/call`. Point any MCP client at the URL with the bearer key.

| Tool | Arguments | Does |
|---|---|---|
| `get_dashboard` | — | config + open items + items completed today + today's meals & totals |
| `list_items` | `kind?, context?, status?` | filtered items |
| `add_item` | `kind, title, context?, url?, medium?, source?, flagged?` | create item |
| `complete_item` | `id` | mark done |
| `update_item` | `id, patch` (same fields as HTTP PATCH) | edit item |
| `remove_item` | `id` | delete item |
| `log_meal` | `name, kcal, p?, c?, f?, date?` | log a meal |
| `list_meals` | `date?` | meals for a day |
| `log_spend` | `amount, category, note?, currency?, date?` | log an expense (widget parked, log works) |
| `list_spend` | `month?` | expenses for a month |
| `set_focus` | `text` | set the focus line |
| `set_targets` | `calories?, budget?` (null clears) | set targets |
| `set_shortcut` | `label, url, icon?` | add, or update url if label exists |
| `list_shortcuts` | — | shortcut list |
| `remove_shortcut` | `id` | delete shortcut |

Tool results are JSON in a `text` content block. Core validation errors come back as `isError: true` tool results (not protocol errors), so agents can read the message and retry.
