<script lang="ts">
	import type { Item, ItemKind } from '$lib/types';
	import { KINDS, CONTEXTS, MEDIUMS } from '$lib/types';
	import { api } from '$lib/client/api';
	import ItemRow from './ItemRow.svelte';
	import { Plus, ListFilter, Check } from '@lucide/svelte';
	import { browser } from '$app/environment';

	let { items }: { items: Item[] } = $props();

	// context filter: multi-select, persisted per device
	const FILTER_KEY = 'newtab:ctx-filter';
	const FILTER_OPTIONS = [...CONTEXTS, 'untagged'] as const;

	function loadFilter(): string[] {
		if (!browser) return [...FILTER_OPTIONS];
		try {
			const saved = JSON.parse(localStorage.getItem(FILTER_KEY) || 'null');
			if (Array.isArray(saved)) return saved.filter((c) => FILTER_OPTIONS.includes(c));
		} catch {
			// fall through to default
		}
		return [...FILTER_OPTIONS];
	}

	let selected = $state<string[]>(loadFilter());
	let filterOpen = $state(false);
	$effect(() => {
		if (browser) localStorage.setItem(FILTER_KEY, JSON.stringify(selected));
	});
	const filterActive = $derived(selected.length < FILTER_OPTIONS.length);

	function toggleContext(c: string) {
		selected = selected.includes(c) ? selected.filter((x) => x !== c) : [...selected, c];
	}

	let adding = $state(false);
	let title = $state('');
	let kind = $state<ItemKind>('do');
	let context = $state('');
	let medium = $state('read');
	let url = $state('');
	let saving = $state(false);

	const kindLabels: Record<ItemKind, string> = { do: 'Do', think: 'Think', queue: 'Queue' };

	const filtered = $derived(
		items.filter(
			(i) => i.status === 'open' && (i.context ? selected.includes(i.context) : selected.includes('untagged'))
		)
	);
	// flat, compact list: do → think → queue, keeping flagged-first within each kind
	const sorted = $derived(KINDS.flatMap((k) => filtered.filter((i) => i.kind === k)));

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

<svelte:window onclick={() => (filterOpen = false)} />

<section>
	<div class="widget-head">
		<h2>Items</h2>
		<div class="head-actions">
			<div class="filter-wrap">
				<button
					class="soft"
					class:active={filterActive}
					aria-expanded={filterOpen}
					onclick={(e) => {
						e.stopPropagation();
						filterOpen = !filterOpen;
					}}
				>
					<ListFilter size={14} /> Filter{#if filterActive}<span class="filter-dot"></span>{/if}
				</button>
				{#if filterOpen}
					<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
					<div class="menu card" onclick={(e) => e.stopPropagation()}>
						{#each FILTER_OPTIONS as c (c)}
							<button class="option" onclick={() => toggleContext(c)}>
								<span class="tick-slot">
									{#if selected.includes(c)}<Check size={14} />{/if}
								</span>
								{#if c !== 'untagged'}<span class="dot ctx-{c}"></span>{/if}
								{c}
							</button>
						{/each}
						<button class="option all" onclick={() => (selected = [...FILTER_OPTIONS])}>
							show everything
						</button>
					</div>
				{/if}
			</div>
			<button class="soft" onclick={() => (adding = !adding)}>
				<Plus size={14} /> Add
			</button>
		</div>
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

		{#if sorted.length === 0}
			<p class="empty">{filterActive ? 'Nothing matches the filter.' : 'Nothing here. Nice.'}</p>
		{/if}
		{#each sorted as item (item.id)}
			<ItemRow {item} />
		{/each}
	</div>
</section>

<style>
	.head-actions {
		margin-left: auto;
		display: flex;
		gap: 8px;
	}
	.filter-wrap {
		position: relative;
	}
	.soft.active {
		border-color: var(--foreground);
	}
	.filter-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--kind-do);
	}
	.menu {
		position: absolute;
		right: 0;
		top: calc(100% + 6px);
		z-index: 20;
		min-width: 170px;
		padding: 6px;
		box-shadow: var(--shadow-md);
		display: flex;
		flex-direction: column;
	}
	.option {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		background: none;
		border: none;
		font: inherit;
		font-size: 14px;
		color: var(--foreground);
		padding: 8px 10px;
		border-radius: var(--radius-sm);
		cursor: pointer;
		text-align: left;
	}
	.option:hover {
		background: var(--muted);
	}
	.option.all {
		border-top: 1px solid color-mix(in srgb, var(--border) 55%, transparent);
		border-radius: 0 0 var(--radius-sm) var(--radius-sm);
		color: var(--muted-foreground);
		font-size: 13px;
	}
	.tick-slot {
		width: 16px;
		display: inline-flex;
		flex: none;
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
	.body {
		padding: 6px 24px;
		display: flex;
		flex-direction: column;
	}
	form {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		background: var(--muted);
		padding: 12px;
		border-radius: var(--radius-md);
		margin: 12px 0 6px;
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
	.empty {
		color: var(--muted-2);
		margin: 12px 0;
	}
</style>
