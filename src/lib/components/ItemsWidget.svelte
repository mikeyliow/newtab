<script lang="ts">
	import type { Item, ItemKind } from '$lib/types';
	import { KINDS, CONTEXTS, MEDIUMS } from '$lib/types';
	import { api } from '$lib/client/api';
	import ItemRow from './ItemRow.svelte';
	import { Plus, ListFilter, Check, RotateCcw, ChevronDown } from '@lucide/svelte';
	import { browser } from '$app/environment';
	import { slide } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { tick } from 'svelte';

	let {
		items,
		doneToday = [],
		doneWeek = []
	}: { items: Item[]; doneToday?: Item[]; doneWeek?: number[] } = $props();

	// collapsed by default: the card is a stat summary, the list shows on click
	let expanded = $state(false);
	let showDone = $state(false);
	let titleInput = $state<HTMLInputElement | null>(null);

	const openToday = $derived(items.filter((i) => i.status === 'open' && i.kind === 'do').length);
	const openLater = $derived(items.filter((i) => i.status === 'open' && i.kind === 'think').length);
	const weekDone = $derived(doneWeek.reduce((a, b) => a + b, 0));

	async function openAdd() {
		expanded = true;
		adding = true;
		await tick();
		titleInput?.focus();
	}

	// quick-add: press "a" anywhere (outside a field) to open the add form
	function onKeydown(e: KeyboardEvent) {
		if (e.key !== 'a' || e.metaKey || e.ctrlKey || e.altKey) return;
		const t = e.target as HTMLElement;
		if (t.closest('input, textarea, select, [contenteditable]')) return;
		e.preventDefault();
		openAdd();
	}

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

	// queue items live in their own sidebar widget; this view is do/think only
	const filtered = $derived(
		items.filter(
			(i) =>
				i.status === 'open' &&
				i.kind !== 'queue' &&
				(i.context ? selected.includes(i.context) : selected.includes('untagged'))
		)
	);
	const pinnedFirst = (list: Item[]) => [
		...list.filter((i) => i.flagged),
		...list.filter((i) => !i.flagged)
	];
	const sections = $derived(
		[
			{ label: 'Today', items: pinnedFirst(filtered.filter((i) => i.kind === 'do')) },
			{ label: 'Later', items: pinnedFirst(filtered.filter((i) => i.kind === 'think')) }
		].filter((s) => s.items.length)
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

{#snippet donut(done: number, total: number, color: string, label: string)}
	{@const frac = total > 0 ? done / total : 0}
	{@const C = 2 * Math.PI * 19}
	<span class="donut" title="{done} of {total} {label}">
		<svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true">
			<circle cx="24" cy="24" r="19" fill="none" stroke="var(--muted)" stroke-width="5" />
			{#if frac > 0}
				<circle
					cx="24"
					cy="24"
					r="19"
					fill="none"
					stroke={color}
					stroke-width="5"
					stroke-linecap="round"
					stroke-dasharray="{C * frac} {C}"
					transform="rotate(-90 24 24)"
					style="transition: stroke-dasharray 0.5s ease"
				/>
			{/if}
			<text x="24" y="28" text-anchor="middle" class="donut-num">{done}/{total}</text>
		</svg>
		<span class="micro">{label}</span>
	</span>
{/snippet}

<svelte:window onclick={() => (filterOpen = false)} onkeydown={onKeydown} />

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
			<button class="soft" onclick={() => (adding ? (adding = false) : openAdd())}>
				<Plus size={14} /> Add
			</button>
		</div>
	</div>

	<div class="card body">
		<button class="summary" onclick={() => (expanded = !expanded)} aria-expanded={expanded}>
			{@render donut(doneToday.length, doneToday.length + openToday, 'var(--kind-do)', 'today')}
			{@render donut(weekDone, weekDone + openToday + openLater, 'var(--kind-queue)', 'week')}
			<div class="sums">
				<span class="sum">{openToday} open today</span>
				<span class="sum dim">{openLater} later</span>
			</div>
			<ChevronDown size={16} class="chev {expanded ? 'up' : ''}" />
		</button>

		{#if expanded}
			<div class="lists" transition:slide={{ duration: 200 }}>
				{#if adding}
					<form onsubmit={add}>
						<!-- svelte-ignore a11y_autofocus -->
						<input class="grow" bind:this={titleInput} bind:value={title} placeholder="what is it?" autofocus />
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

				{#if sections.length === 0}
					<p class="empty">{filterActive ? 'Nothing matches the filter.' : 'Nothing here. Nice.'}</p>
				{/if}
				{#each sections as section (section.label)}
					<div class="section">
						<span class="micro section-label">{section.label} · {section.items.length}</span>
						{#each section.items as item (item.id)}
							<div animate:flip={{ duration: 220 }} in:slide={{ duration: 180 }} out:slide={{ duration: 160 }}>
								<ItemRow {item} />
							</div>
						{/each}
					</div>
				{/each}

				{#if doneToday.length}
					<button class="done-line" onclick={() => (showDone = !showDone)}>
						<Check size={12} strokeWidth={3} />
						{doneToday.length} done today · {showDone ? 'hide' : 'show'}
					</button>
					{#if showDone}
						<div class="done-list" transition:slide={{ duration: 180 }}>
							{#each doneToday as item (item.id)}
								<div class="done-row">
									<span class="done-title">{item.title}</span>
									<button
										class="ghost"
										onclick={() => api.updateItem(item.id, { status: 'open' })}
										aria-label="reopen"
										title="undo — back to open"
									>
										<RotateCcw size={14} />
									</button>
								</div>
							{/each}
						</div>
					{/if}
				{/if}
			</div>
		{/if}
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
		padding: 8px 24px;
		display: flex;
		flex-direction: column;
	}
	.summary {
		display: flex;
		align-items: center;
		gap: 22px;
		width: 100%;
		background: none;
		border: none;
		padding: 10px 0;
		cursor: pointer;
		font: inherit;
		color: var(--foreground);
		text-align: left;
	}
	.donut {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		flex: none;
	}
	.donut .micro {
		font-size: 9px;
	}
	:global(.donut-num) {
		font-family: var(--font-mono);
		font-size: 11px;
		font-weight: 500;
		fill: var(--foreground);
	}
	.sums {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.sum {
		font-size: 14.5px;
		font-weight: 500;
	}
	.sum.dim {
		font-size: 13px;
		font-weight: 400;
		color: var(--muted-2);
	}
	.summary :global(.chev) {
		margin-left: auto;
		color: var(--muted-2);
		transition: transform 0.2s ease;
	}
	.summary :global(.chev.up) {
		transform: rotate(180deg);
	}
	.lists {
		display: flex;
		flex-direction: column;
		border-top: 1px solid color-mix(in srgb, var(--border) 55%, transparent);
		padding-top: 4px;
		padding-bottom: 8px;
	}
	form {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		background: var(--muted);
		padding: 12px;
		border-radius: var(--radius-md);
		margin: 10px 0 4px;
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
	.section {
		display: flex;
		flex-direction: column;
	}
	.section-label {
		font-size: 10px;
		margin-top: 12px;
	}
	.section:first-of-type .section-label {
		margin-top: 6px;
	}
	.done-line {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		align-self: flex-start;
		margin-top: 12px;
		background: none;
		border: none;
		padding: 0;
		font-family: var(--font-mono);
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--muted-2);
		cursor: pointer;
	}
	.done-line:hover {
		color: var(--foreground);
	}
	.done-list {
		margin-top: 6px;
	}
	.done-row {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 7px 0;
		border-bottom: 1px solid color-mix(in srgb, var(--border) 45%, transparent);
	}
	.done-row:last-child {
		border-bottom: none;
	}
	.done-title {
		font-size: 14px;
		color: var(--muted-2);
		text-decoration: line-through;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.done-row .ghost {
		margin-left: auto;
	}
</style>
