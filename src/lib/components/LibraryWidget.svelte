<script lang="ts">
	// the library — reads/watches/listens in their own store. Lean by design:
	// 3 items visible, everything older lives behind the archive row.
	import type { LibraryItem } from '$lib/types';
	import { api } from '$lib/client/api';
	import { BookOpen, Headphones, Play, Inbox, Check, X, ChevronDown } from '@lucide/svelte';
	import { slide } from 'svelte/transition';

	let { library }: { library: LibraryItem[] } = $props();

	const VISIBLE = 3;
	const icons = { read: BookOpen, listen: Headphones, watch: Play };
	const visible = $derived(library.slice(0, VISIBLE));
	const archive = $derived(library.slice(VISIBLE));
	let archiveOpen = $state(false);
</script>

{#snippet row(item: LibraryItem)}
	{@const Icon = item.medium ? icons[item.medium] : Inbox}
	<div class="row" in:slide={{ duration: 180 }} out:slide={{ duration: 160 }}>
		<Icon size={16} aria-hidden="true" />
		{#if item.url}
			<a class="title" href={item.url} target="_blank" rel="noreferrer">{item.title}</a>
		{:else}
			<span class="title">{item.title}</span>
		{/if}
		<span class="actions">
			<button
				class="ghost"
				onclick={() => api.updateLibrary(item.id, { status: 'done' })}
				aria-label="mark done"
				title="done"
			>
				<Check size={14} />
			</button>
			<button
				class="ghost delete"
				onclick={() => api.removeLibrary(item.id)}
				aria-label="delete"
				title="delete"
			>
				<X size={14} />
			</button>
		</span>
	</div>
{/snippet}

<section>
	<div class="widget-head">
		<h2>Library</h2>
		{#if library.length}<span class="count">{library.length}</span>{/if}
	</div>
	{#if library.length}
		<div class="card body">
			{#each visible as item (item.id)}
				{@render row(item)}
			{/each}
			{#if archive.length}
				<button class="archive-row" onclick={() => (archiveOpen = !archiveOpen)} aria-expanded={archiveOpen}>
					<Inbox size={14} />
					archive · {archive.length}
					<ChevronDown size={14} class="chev {archiveOpen ? 'up' : ''}" />
				</button>
				{#if archiveOpen}
					<div class="archive" transition:slide={{ duration: 200 }}>
						{#each archive as item (item.id)}
							{@render row(item)}
						{/each}
					</div>
				{/if}
			{/if}
		</div>
	{:else}
		<p class="empty">Nothing saved — add reads, videos, pods with <b>a</b>.</p>
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
	.archive-row {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		background: none;
		border: none;
		padding: 10px 0 8px;
		font-family: var(--font-mono);
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--muted-2);
		cursor: pointer;
	}
	.archive-row:hover {
		color: var(--foreground);
	}
	.archive-row :global(.chev) {
		margin-left: auto;
		transition: transform 0.2s ease;
	}
	.archive-row :global(.chev.up) {
		transform: rotate(180deg);
	}
	.archive {
		max-height: 220px;
		overflow-y: auto;
		scrollbar-width: thin;
		scrollbar-color: var(--border) transparent;
		border-top: 1px solid color-mix(in srgb, var(--border) 55%, transparent);
	}
	.empty {
		color: var(--muted-2);
		font-size: 13px;
		margin: 0;
	}
</style>
