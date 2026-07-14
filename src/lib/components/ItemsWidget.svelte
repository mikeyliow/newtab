<script lang="ts">
	import type { Item, ItemKind, ItemContext } from '$lib/types';
	import { KINDS, CONTEXTS, MEDIUMS } from '$lib/types';
	import { api } from '$lib/client/api';
	import ItemRow from './ItemRow.svelte';
	import { Plus } from '@lucide/svelte';

	let { items }: { items: Item[] } = $props();

	let contextFilter = $state<ItemContext | null>(null);
	let adding = $state(false);
	let title = $state('');
	let kind = $state<ItemKind>('do');
	let context = $state('');
	let medium = $state('read');
	let url = $state('');
	let saving = $state(false);

	const kindLabels: Record<ItemKind, string> = { do: 'Do', think: 'Think', queue: 'Queue' };

	const filtered = $derived(
		items.filter((i) => i.status === 'open' && (!contextFilter || i.context === contextFilter))
	);
	const grouped = $derived(
		KINDS.map((k) => ({ kind: k, items: filtered.filter((i) => i.kind === k) })).filter(
			(g) => g.items.length
		)
	);

	async function add(e: SubmitEvent) {
		e.preventDefault();
		if (!title.trim() || saving) return;
		saving = true;
		try {
			await api.addItem({
				kind,
				title,
				context: context || null,
				url: kind === 'queue' && url ? url : null,
				medium: kind === 'queue' ? medium : null
			});
			title = '';
			url = '';
			adding = false;
		} finally {
			saving = false;
		}
	}
</script>

<section>
	<div class="widget-head">
		<h2>Items</h2>
		<nav class="filters">
			<button class="chip" class:active={!contextFilter} onclick={() => (contextFilter = null)}>
				all
			</button>
			{#each CONTEXTS as c (c)}
				<button
					class="chip"
					class:active={contextFilter === c}
					onclick={() => (contextFilter = contextFilter === c ? null : c)}
				>
					{c}
				</button>
			{/each}
		</nav>
		<button class="soft" onclick={() => (adding = !adding)}>
			<Plus size={14} /> Add
		</button>
	</div>

	<div class="card body">
		{#if adding}
			<form onsubmit={add}>
				<!-- svelte-ignore a11y_autofocus -->
				<input class="grow" bind:value={title} placeholder="what is it?" autofocus />
				<select bind:value={kind}>
					{#each KINDS as k (k)}<option value={k}>{kindLabels[k]}</option>{/each}
				</select>
				{#if kind === 'queue'}
					<select bind:value={medium}>
						{#each MEDIUMS as m (m)}<option value={m}>{m}</option>{/each}
					</select>
					<input class="grow" bind:value={url} placeholder="url (optional)" />
				{/if}
				<select bind:value={context}>
					<option value="">no context</option>
					{#each CONTEXTS as c (c)}<option value={c}>{c}</option>{/each}
				</select>
				<button class="pill" type="submit" disabled={saving}>Add</button>
			</form>
		{/if}

		{#if grouped.length === 0}
			<p class="empty">Nothing here. Nice.</p>
		{/if}
		{#each grouped as group (group.kind)}
			<div class="group">
				<span class="micro kind">{kindLabels[group.kind]}</span>
				{#each group.items as item (item.id)}
					<ItemRow {item} />
				{/each}
			</div>
		{/each}
	</div>
</section>

<style>
	.filters {
		display: flex;
		gap: 4px;
		margin-left: auto;
	}
	.chip {
		font-family: var(--font-mono);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		background: none;
		border: 1px solid transparent;
		border-radius: var(--radius-pill);
		padding: 3px 10px;
		color: var(--muted-2);
		cursor: pointer;
	}
	.chip:hover {
		color: var(--foreground);
	}
	.chip.active {
		background: var(--foreground);
		color: var(--background);
	}
	.body {
		padding: 10px 24px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	form {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		background: var(--muted);
		padding: 12px;
		border-radius: var(--radius-md);
	}
	form input,
	form select {
		font-size: 14px;
		padding: 6px 10px;
	}
	.grow {
		flex: 1;
		min-width: 140px;
	}
	.group {
		display: flex;
		flex-direction: column;
	}
	.kind {
		font-size: 11px;
		margin-top: 6px;
	}
	.empty {
		color: var(--muted-2);
		margin: 0;
	}
</style>
