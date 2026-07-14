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
	<Icon size={16} class="kind-icon" aria-hidden="true" />
	{#if item.url}
		<a class="title" href={item.url} target="_blank" rel="noreferrer">{item.title}</a>
	{:else}
		<span class="title">{item.title}</span>
	{/if}
	{#if item.context}<span class="micro context">{item.context}</span>{/if}
	<span class="actions">
		<button class="ghost" onclick={toggleFlag} aria-label="pin" title={item.flagged ? 'unpin' : 'pin'}>
			<Pin size={14} fill={item.flagged ? 'currentColor' : 'none'} />
		</button>
		<button class="ghost delete" onclick={remove} aria-label="delete" title="delete">
			<X size={14} />
		</button>
	</span>
</div>

<style>
	.row {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 0;
		border-bottom: 1px solid color-mix(in srgb, var(--border) 45%, transparent);
	}
	.row:last-child {
		border-bottom: none;
	}
	.tick {
		flex: none;
		width: 18px;
		height: 18px;
		border: 1.5px solid var(--muted-2);
		border-radius: 6px;
		background: none;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: var(--background);
		padding: 0;
	}
	.tick:hover {
		border-color: var(--foreground);
	}
	.done .tick {
		background: var(--foreground);
		border-color: var(--foreground);
	}
	.row :global(.kind-icon) {
		flex: none;
		color: var(--muted-foreground);
	}
	.title {
		text-decoration: none;
		min-width: 0;
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
	.context {
		flex: none;
		font-size: 11px;
		color: var(--muted-2);
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
