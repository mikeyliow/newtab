import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as core from '$lib/server/core';

// Minimal stateless MCP server (Streamable HTTP transport, JSON responses).
// Bearer auth is enforced in hooks.server.ts.

const PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];

const str = (description: string) => ({ type: 'string', description });
const num = (description: string) => ({ type: 'number', description });
const bool = (description: string) => ({ type: 'boolean', description });
const kindProp = { type: 'string', enum: ['do', 'think', 'queue'], description: 'do = act now, think = mull/decide, queue = consume later' };
const contextProp = { type: 'string', enum: ['work', 'heirlight', 'content', 'personal'], description: 'life context' };
const mediumProp = { type: 'string', enum: ['read', 'listen', 'watch'], description: 'only for queue items' };

const TOOLS = [
	{
		name: 'get_dashboard',
		description: "Read the full current dashboard state: config, open items, today's meals and calorie totals.",
		inputSchema: { type: 'object', properties: {} },
		handler: () => core.getDashboard()
	},
	{
		name: 'list_items',
		description: 'List items, optionally filtered by kind, context, or status.',
		inputSchema: {
			type: 'object',
			properties: { kind: kindProp, context: contextProp, status: { type: 'string', enum: ['open', 'done'] } }
		},
		handler: (a: any) => core.listItems(a)
	},
	{
		name: 'add_item',
		description: 'Add an item to the dashboard.',
		inputSchema: {
			type: 'object',
			properties: {
				kind: kindProp,
				title: str('short title'),
				context: contextProp,
				url: str('link, mainly for queue items'),
				medium: mediumProp,
				source: str('where this came from'),
				flagged: bool('pin to the top strip')
			},
			required: ['kind', 'title']
		},
		handler: (a: any) => core.addItem(a)
	},
	{
		name: 'complete_item',
		description: 'Mark an item done.',
		inputSchema: { type: 'object', properties: { id: str('item id') }, required: ['id'] },
		handler: (a: any) => core.completeItem(a.id)
	},
	{
		name: 'update_item',
		description: 'Patch fields on an item (title, kind, context, url, medium, source, status, flagged).',
		inputSchema: {
			type: 'object',
			properties: {
				id: str('item id'),
				patch: {
					type: 'object',
					description: 'fields to change',
					properties: {
						title: str('new title'),
						kind: kindProp,
						context: contextProp,
						medium: mediumProp,
						url: str('new url'),
						source: str('new source'),
						status: { type: 'string', enum: ['open', 'done'] },
						flagged: bool('pin to the top strip')
					}
				}
			},
			required: ['id', 'patch']
		},
		handler: (a: any) => core.updateItem(a.id, a.patch)
	},
	{
		name: 'remove_item',
		description: 'Delete an item permanently.',
		inputSchema: { type: 'object', properties: { id: str('item id') }, required: ['id'] },
		handler: (a: any) => {
			core.removeItem(a.id);
			return { ok: true };
		}
	},
	{
		name: 'log_meal',
		description: 'Log a meal to the calorie tracker. Macros in grams.',
		inputSchema: {
			type: 'object',
			properties: {
				name: str('what was eaten'),
				kcal: num('calories'),
				p: num('protein grams'),
				c: num('carb grams'),
				f: num('fat grams'),
				date: str('YYYY-MM-DD, defaults to today')
			},
			required: ['name', 'kcal']
		},
		handler: (a: any) => core.logMeal(a)
	},
	{
		name: 'list_meals',
		description: 'List meals for a date (defaults to today).',
		inputSchema: { type: 'object', properties: { date: str('YYYY-MM-DD') } },
		handler: (a: any) => core.listMeals(a?.date)
	},
	{
		name: 'log_spend',
		description: 'Log an expense (spending widget is parked, but the log works).',
		inputSchema: {
			type: 'object',
			properties: {
				amount: num('amount spent'),
				category: str('spending category'),
				note: str('optional note'),
				currency: str('defaults to RM'),
				date: str('YYYY-MM-DD, defaults to today')
			},
			required: ['amount', 'category']
		},
		handler: (a: any) => core.logSpend(a)
	},
	{
		name: 'list_spend',
		description: 'List spending for a month (YYYY-MM, defaults to current month).',
		inputSchema: { type: 'object', properties: { month: str('YYYY-MM') } },
		handler: (a: any) => core.listSpend(a?.month)
	},
	{
		name: 'set_focus',
		description: 'Set the one-line focus sentence on the dashboard.',
		inputSchema: { type: 'object', properties: { text: str('the focus sentence') }, required: ['text'] },
		handler: (a: any) => core.setFocus(a.text)
	},
	{
		name: 'set_targets',
		description: 'Set the daily calorie target and/or monthly budget. Pass null to clear.',
		inputSchema: {
			type: 'object',
			properties: {
				calories: { type: ['number', 'null'], description: 'daily kcal target' },
				budget: { type: ['number', 'null'], description: 'monthly budget' }
			}
		},
		handler: (a: any) => core.setTargets(a)
	},
	{
		name: 'set_shortcut',
		description: 'Add a shortcut link, or update the url of an existing one with the same label.',
		inputSchema: {
			type: 'object',
			properties: { label: str('display label'), url: str('link'), icon: str('lucide icon name') },
			required: ['label', 'url']
		},
		handler: (a: any) => core.setShortcut(a)
	},
	{
		name: 'list_shortcuts',
		description: 'List the shortcut links.',
		inputSchema: { type: 'object', properties: {} },
		handler: () => core.getConfig().shortcuts
	},
	{
		name: 'remove_shortcut',
		description: 'Remove a shortcut by id.',
		inputSchema: { type: 'object', properties: { id: str('shortcut id') }, required: ['id'] },
		handler: (a: any) => core.removeShortcut(a.id)
	}
];

function rpcResult(id: unknown, result: unknown) {
	return { jsonrpc: '2.0', id, result };
}

function rpcError(id: unknown, code: number, message: string) {
	return { jsonrpc: '2.0', id, error: { code, message } };
}

function handleMessage(msg: any): object | null {
	if (msg?.jsonrpc !== '2.0') return rpcError(msg?.id ?? null, -32600, 'invalid request');

	// notifications get no response
	if (msg.id === undefined) return null;

	switch (msg.method) {
		case 'initialize': {
			const requested = msg.params?.protocolVersion;
			return rpcResult(msg.id, {
				protocolVersion: PROTOCOL_VERSIONS.includes(requested) ? requested : PROTOCOL_VERSIONS[0],
				capabilities: { tools: {} },
				serverInfo: { name: 'newtab', version: '1.0.0' }
			});
		}
		case 'ping':
			return rpcResult(msg.id, {});
		case 'tools/list':
			return rpcResult(msg.id, {
				tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }))
			});
		case 'tools/call': {
			const tool = TOOLS.find((t) => t.name === msg.params?.name);
			if (!tool) return rpcError(msg.id, -32602, `unknown tool: ${msg.params?.name}`);
			try {
				const result = tool.handler(msg.params?.arguments ?? {});
				return rpcResult(msg.id, {
					content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
				});
			} catch (e) {
				if (e instanceof core.CoreError) {
					return rpcResult(msg.id, {
						content: [{ type: 'text', text: e.message }],
						isError: true
					});
				}
				throw e;
			}
		}
		default:
			return rpcError(msg.id, -32601, `method not found: ${msg.method}`);
	}
}

export const POST: RequestHandler = async ({ request }) => {
	let body: any;
	try {
		body = await request.json();
	} catch {
		return json(rpcError(null, -32700, 'parse error'), { status: 400 });
	}

	if (Array.isArray(body)) {
		const responses = body.map(handleMessage).filter((r) => r !== null);
		if (!responses.length) return new Response(null, { status: 202 });
		return json(responses);
	}

	const response = handleMessage(body);
	if (response === null) return new Response(null, { status: 202 });
	return json(response);
};

// stateless server: no SSE stream, no sessions to delete
export const GET: RequestHandler = () =>
	json({ error: 'method not allowed' }, { status: 405, headers: { Allow: 'POST' } });

export const DELETE: RequestHandler = () => new Response(null, { status: 405, headers: { Allow: 'POST' } });
