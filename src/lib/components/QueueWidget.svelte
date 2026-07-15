<script lang="ts">
	// the reading/watching/listening list — queue items, always visible in the sidebar.
	import type { Item } from '$lib/types';
	import { api } from '$lib/client/api';
	import { BookOpen, Headphones, Play, Inbox, Check, X } from '@lucide/svelte';
	import { slide } from 'svelte/transition';
	import { flip } from 'svelte/animate';

	let { items }: { items: Item[] } = $props();

	const icons = { read: BookOpen, listen: Headphones, watch: Play };
	const queue = $derived(items.filter((i) => i.status === 'open' && i.kind === 'queue'));
</script>

<section>
	<div class="widget-head">
		<h2>Queue</h2>
		{#if queue.length}<span class="count">{queue.length}</span>{/if}
	</div>
	{#if queue.length}
		<div class="card body">
			{#each queue as item (item.id)}
				{@const Icon = item.medium ? icons[item.medium] : Inbox}
				<div
					class="row"
					animate:flip={{ duration: 220 }}
					in:slide={{ duration: 180 }}
					out:slide={{ duration: 160 }}
				>
					<Icon size={16} aria-hidden="true" />
					{#if item.url}
						<a class="title" href={item.url} target="_blank" rel="noreferrer">{item.title}</a>
					{:else}
						<span class="title">{item.title}</span>
					{/if}
					<span class="actions">
						<button
							class="ghost"
							onclick={() => api.updateItem(item.id, { status: 'done' })}
							aria-label="mark done"
							title="done"
						>
							<Check size={14} />
						</button>
						<button
							class="ghost delete"
							onclick={() => api.removeItem(item.id)}
							aria-label="delete"
							title="delete"
						>
							<X size={14} />
						</button>
					</span>
				</div>
			{/each}
		</div>
	{:else}
		<p class="empty">Nothing queued — add reads, videos, pods with <b>a</b>.</p>
	{/if}
</section>

<style>
	.count {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--muted-2);
	}
	.body {
		padding: 6px 16px;
		display: flex;
		flex-direction: column;
	}
	.row {
		display: flex;
		align-items: center;
		gap: 11px;
		padding: 10px 0;
		border-bottom: 1px solid color-mix(in srgb, var(--border) 45%, transparent);
	}
	.row:last-child {
		border-bottom: none;
	}
	.row > :global(svg) {
		flex: none;
		color: var(--kind-queue);
	}
	.title {
		font-size: 14px;
		font-weight: 500;
		text-decoration: none;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	a.title:hover {
		text-decoration: underline;
	}
	.actions {
		margin-left: auto;
		display: inline-flex;
		gap: 2px;
		opacity: 0;
		flex: none;
	}
	.row:hover .actions {
		opacity: 1;
	}
	.delete:hover {
		color: var(--destructive);
	}
	.empty {
		color: var(--muted-2);
		font-size: 13px;
		margin: 0;
	}
</style>
