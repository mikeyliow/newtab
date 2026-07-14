<script lang="ts">
	import type { Item } from '$lib/types';
	import { api } from '$lib/client/api';
	import {
		Zap,
		Lightbulb,
		BookOpen,
		Headphones,
		Play,
		Inbox,
		Pin,
		Trash2,
		Check,
		ChevronDown,
		ExternalLink
	} from '@lucide/svelte';

	let { item }: { item: Item } = $props();
	let menuOpen = $state(false);

	const icons = {
		do: Zap,
		think: Lightbulb,
		read: BookOpen,
		listen: Headphones,
		watch: Play,
		queue: Inbox
	};
	const Icon = $derived(item.kind === 'queue' ? icons[item.medium ?? 'queue'] : icons[item.kind]);

	// SQLite datetime('now') is UTC without a zone marker; ISO strings already carry one
	function relTime(s: string): string {
		const iso = s.includes('T') ? s : s.replace(' ', 'T') + 'Z';
		const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000));
		if (mins < 1) return 'just now';
		if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
		const hours = Math.floor(mins / 60);
		if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
		const days = Math.floor(hours / 24);
		if (days < 14) return `${days} day${days === 1 ? '' : 's'} ago`;
		return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
	}

	async function run(action: () => Promise<unknown>) {
		menuOpen = false;
		await action();
	}
</script>

<svelte:window onclick={() => (menuOpen = false)} />

<div class="row" class:done={item.status === 'done'} class:open-menu={menuOpen}>
	<span class="kind-icon kind-{item.kind}"><Icon size={18} aria-hidden="true" /></span>
	<div class="stack">
		{#if item.url}
			<a class="title" href={item.url} target="_blank" rel="noreferrer">{item.title}</a>
		{:else}
			<span class="title">{item.title}</span>
		{/if}
		<span class="meta">
			{#if item.flagged}
				<Pin size={11} fill="currentColor" class="pin-mark" /><span class="sep">·</span>
			{/if}
			{#if item.context}
				<span class="dot ctx-{item.context}"></span>{item.context}<span class="sep">·</span>
			{/if}
			{#if item.source}
				{item.source}<span class="sep">·</span>
			{/if}
			added {relTime(item.created_at)}
		</span>
	</div>

	<div class="menu-wrap">
		<button
			class="ghost opener"
			aria-label="item options"
			aria-expanded={menuOpen}
			onclick={(e) => {
				e.stopPropagation();
				menuOpen = !menuOpen;
			}}
		>
			<ChevronDown size={16} />
		</button>
		{#if menuOpen}
			<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
			<div class="menu card" onclick={(e) => e.stopPropagation()}>
				<button onclick={() => run(() => api.updateItem(item.id, { status: item.status === 'done' ? 'open' : 'done' }))}>
					<Check size={14} />
					{item.status === 'done' ? 'Reopen' : 'Mark done'}
				</button>
				<button onclick={() => run(() => api.updateItem(item.id, { flagged: !item.flagged }))}>
					<Pin size={14} />
					{item.flagged ? 'Unpin' : 'Pin to Now'}
				</button>
				{#if item.url}
					<a href={item.url} target="_blank" rel="noreferrer" onclick={() => (menuOpen = false)}>
						<ExternalLink size={14} />
						Open link
					</a>
				{/if}
				<button class="danger" onclick={() => run(() => api.removeItem(item.id))}>
					<Trash2 size={14} />
					Delete
				</button>
			</div>
		{/if}
	</div>
</div>

<style>
	.row {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 14px 0;
		border-bottom: 1px solid color-mix(in srgb, var(--border) 55%, transparent);
	}
	.row:last-child {
		border-bottom: none;
	}
	.kind-icon {
		flex: none;
		display: inline-flex;
		color: var(--muted-foreground);
	}
	.kind-do {
		color: var(--kind-do);
	}
	.kind-think {
		color: var(--kind-think);
	}
	.kind-queue {
		color: var(--kind-queue);
	}
	.stack {
		display: flex;
		flex-direction: column;
		gap: 1px;
		min-width: 0;
	}
	.title {
		font-weight: 500;
		text-decoration: none;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	a.title:hover {
		text-decoration: underline;
	}
	.done .title {
		color: var(--muted-2);
		text-decoration: line-through;
	}
	.meta {
		font-size: 13px;
		color: var(--muted-2);
		display: flex;
		align-items: center;
		gap: 6px;
		white-space: nowrap;
		overflow: hidden;
	}
	.meta :global(.pin-mark) {
		color: var(--kind-do);
	}
	.sep {
		color: var(--border);
	}
	.dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		flex: none;
	}
	.ctx-work {
		background: var(--ctx-work);
	}
	.ctx-heirlight {
		background: var(--ctx-heirlight);
	}
	.ctx-content {
		background: var(--ctx-content);
	}
	.ctx-personal {
		background: var(--ctx-personal);
	}

	.menu-wrap {
		margin-left: auto;
		position: relative;
		flex: none;
	}
	.opener {
		opacity: 0;
	}
	.row:hover .opener,
	.opener:focus-visible,
	.open-menu .opener {
		opacity: 1;
	}
	.menu {
		position: absolute;
		right: 0;
		top: calc(100% + 4px);
		z-index: 20;
		min-width: 160px;
		padding: 6px;
		box-shadow: var(--shadow-md);
		display: flex;
		flex-direction: column;
	}
	.menu button,
	.menu a {
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		background: none;
		border: none;
		font: inherit;
		font-size: 14px;
		color: var(--foreground);
		text-decoration: none;
		padding: 8px 10px;
		border-radius: var(--radius-sm);
		cursor: pointer;
		text-align: left;
	}
	.menu button:hover,
	.menu a:hover {
		background: var(--muted);
	}
	.menu .danger {
		color: var(--destructive);
	}
	.menu :global(svg) {
		color: var(--muted-foreground);
		flex: none;
	}
	.menu .danger :global(svg) {
		color: var(--destructive);
	}
</style>
