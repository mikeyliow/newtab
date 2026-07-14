<script lang="ts">
	import type { Item } from '$lib/types';
	import { api } from '$lib/client/api';
	import { Zap, Lightbulb, BookOpen, Headphones, Play, Inbox, Pin, X, Check } from '@lucide/svelte';

	let { item }: { item: Item } = $props();
	let busy = $state(false);

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

	async function toggle() {
		busy = true;
		try {
			await api.updateItem(item.id, { status: item.status === 'done' ? 'open' : 'done' });
		} finally {
			busy = false;
		}
	}

	async function toggleFlag() {
		await api.updateItem(item.id, { flagged: !item.flagged });
	}

	async function remove() {
		await api.removeItem(item.id);
	}
</script>

<div class="row" class:done={item.status === 'done'}>
	<button class="tick" onclick={toggle} disabled={busy} aria-label="toggle done">
		{#if item.status === 'done'}<Check size={13} strokeWidth={3} />{/if}
	</button>
	<span class="kind-icon kind-{item.kind}"><Icon size={18} aria-hidden="true" /></span>
	<div class="stack">
		{#if item.url}
			<a class="title" href={item.url} target="_blank" rel="noreferrer">{item.title}</a>
		{:else}
			<span class="title">{item.title}</span>
		{/if}
		<span class="meta">
			{#if item.context}
				<span class="dot ctx-{item.context}"></span>{item.context}<span class="sep">·</span>
			{/if}
			{#if item.source}
				{item.source}<span class="sep">·</span>
			{/if}
			added {relTime(item.created_at)}
		</span>
	</div>
	<span class="actions">
		<button class="ghost" onclick={toggleFlag} aria-label="pin" title={item.flagged ? 'unpin' : 'pin'}>
			<Pin size={15} fill={item.flagged ? 'currentColor' : 'none'} />
		</button>
		<button class="ghost delete" onclick={remove} aria-label="delete" title="delete">
			<X size={15} />
		</button>
	</span>
</div>

<style>
	.row {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 15px 0;
		border-bottom: 1px solid color-mix(in srgb, var(--border) 55%, transparent);
	}
	.row:last-child {
		border-bottom: none;
	}
	.tick {
		flex: none;
		width: 19px;
		height: 19px;
		border: 1.5px solid var(--muted-2);
		border-radius: 6px;
		background: none;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: var(--card);
		padding: 0;
	}
	.tick:hover {
		border-color: var(--foreground);
	}
	.done .tick {
		background: var(--foreground);
		border-color: var(--foreground);
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
	.actions {
		margin-left: auto;
		flex: none;
		display: inline-flex;
		gap: 2px;
		opacity: 0;
	}
	.row:hover .actions {
		opacity: 1;
	}
	.delete:hover {
		color: var(--destructive);
	}
</style>
