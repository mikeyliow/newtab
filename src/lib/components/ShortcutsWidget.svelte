<script lang="ts">
	import type { Shortcut } from '$lib/types';
	import { api } from '$lib/client/api';
	import { Plus, X, Globe, Pencil } from '@lucide/svelte';
	import { ICONS } from '$lib/icons';
	import IconPicker from './IconPicker.svelte';
	import { slide } from 'svelte/transition';
	import { flip } from 'svelte/animate';

	let { shortcuts }: { shortcuts: Shortcut[] } = $props();

	// speed-dial grid: first 12 as tiles, the rest fold into a "+N" popover
	const VISIBLE_MAX = 12;
	const visible = $derived(shortcuts.slice(0, VISIBLE_MAX));
	const overflow = $derived(shortcuts.slice(VISIBLE_MAX));

	let adding = $state(false);
	let folderOpen = $state(false);
	let label = $state('');
	let url = $state('');
	let newIcon = $state<string | null>(null);
	let addPickerOpen = $state(false);
	let pickerFor = $state<string | null>(null);
	let saving = $state(false);
	let broken = $state<Record<string, boolean>>({});

	// drag to rearrange, persisted through the same config patch as everything else
	let dragIdx = $state<number | null>(null);
	let overIdx = $state<number | null>(null);

	function resetDrag() {
		dragIdx = null;
		overIdx = null;
	}

	async function drop() {
		if (dragIdx === null || overIdx === null || dragIdx === overIdx) return resetDrag();
		const next = [...shortcuts];
		const [moved] = next.splice(dragIdx, 1);
		next.splice(overIdx, 0, moved);
		resetDrag();
		await api.patchConfig({ shortcuts: next });
	}

	function favicon(u: string): string | null {
		try {
			const host = new URL(u).hostname;
			return `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
		} catch {
			return null;
		}
	}

	async function setIcon(id: string, name: string | null) {
		pickerFor = null;
		await api.patchConfig({
			shortcuts: shortcuts.map((s) => (s.id === id ? { ...s, icon: name ?? undefined } : s))
		});
	}

	async function add(e: SubmitEvent) {
		e.preventDefault();
		if (!label.trim() || !url.trim() || saving) return;
		saving = true;
		try {
			const u = /^https?:\/\//.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
			await api.patchConfig({
				shortcuts: [
					...shortcuts,
					{ id: crypto.randomUUID(), label: label.trim(), url: u, icon: newIcon ?? undefined }
				]
			});
			label = url = '';
			newIcon = null;
			adding = false;
		} finally {
			saving = false;
		}
	}

	async function remove(id: string) {
		await api.patchConfig({ shortcuts: shortcuts.filter((s) => s.id !== id) });
	}
</script>

{#snippet icon(s: Shortcut, size: number)}
	{#if s.icon && ICONS[s.icon]}
		{@const Ico = ICONS[s.icon]}
		<Ico {size} />
	{:else if favicon(s.url) && !broken[s.id]}
		<img
			src={favicon(s.url)}
			alt=""
			width={size}
			height={size}
			onerror={() => (broken = { ...broken, [s.id]: true })}
		/>
	{:else}
		<Globe {size} aria-hidden="true" />
	{/if}
{/snippet}

<svelte:window
	onclick={() => {
		pickerFor = null;
		addPickerOpen = false;
		folderOpen = false;
	}}
/>

<section>
	<div class="widget-head">
		<h2>Shortcuts</h2>
		<button class="soft push" onclick={() => (adding = !adding)}>
			<Plus size={14} /> Add
		</button>
	</div>

	{#if adding}
		<form class="card" onsubmit={add} transition:slide={{ duration: 160 }}>
			<span class="pick-wrap">
				<button
					type="button"
					class="ghost"
					onclick={(e) => {
						e.stopPropagation();
						addPickerOpen = !addPickerOpen;
					}}
					title="pick icon (optional)"
				>
					{#if newIcon && ICONS[newIcon]}
						{@const NewIcon = ICONS[newIcon]}
						<NewIcon size={16} />
					{:else}
						<Globe size={16} />
					{/if}
				</button>
				{#if addPickerOpen}
					<IconPicker
						value={newIcon}
						allowNone
						onpick={(n) => {
							newIcon = n;
							addPickerOpen = false;
						}}
					/>
				{/if}
			</span>
			<!-- svelte-ignore a11y_autofocus -->
			<input bind:value={label} placeholder="label" autofocus />
			<input bind:value={url} placeholder="https://…" />
			<button class="pill" type="submit" disabled={saving}>Add</button>
		</form>
	{/if}

	<div class="grid" role="list">
		{#each visible as s, i (s.id)}
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<div
				class="tile card"
				class:dragging={dragIdx === i}
				class:drag-over={overIdx === i && dragIdx !== null && dragIdx !== i}
				role="listitem"
				animate:flip={{ duration: 220 }}
				draggable="true"
				ondragstart={(e) => {
					dragIdx = i;
					if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
				}}
				ondragover={(e) => {
					e.preventDefault();
					overIdx = i;
				}}
				ondragleave={() => {
					if (overIdx === i) overIdx = null;
				}}
				ondrop={(e) => {
					e.preventDefault();
					drop();
				}}
				ondragend={resetDrag}
			>
				<a href={s.url} class="tile-link">
					<span class="tile-icon">{@render icon(s, 22)}</span>
					<span class="tile-label">{s.label}</span>
				</a>
				<button
					class="mini swap"
					onclick={(e) => {
						e.stopPropagation();
						pickerFor = pickerFor === s.id ? null : s.id;
					}}
					aria-label="change icon"
					title="change icon"
				>
					<Pencil size={11} />
				</button>
				<button class="mini del" onclick={() => remove(s.id)} aria-label="remove shortcut" title="remove">
					<X size={11} />
				</button>
				{#if pickerFor === s.id}
					<IconPicker value={s.icon ?? null} allowNone onpick={(n) => setIcon(s.id, n)} />
				{/if}
			</div>
		{/each}

		{#if overflow.length}
			<div class="tile card more-wrap">
				<button
					class="tile-link more"
					onclick={(e) => {
						e.stopPropagation();
						folderOpen = !folderOpen;
					}}
					aria-expanded={folderOpen}
				>
					<span class="tile-icon plus">+{overflow.length}</span>
					<span class="tile-label">more</span>
				</button>
				{#if folderOpen}
					<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
					<div class="folder card" onclick={(e) => e.stopPropagation()}>
						{#each overflow as s (s.id)}
							<div class="folder-row">
								<span class="tile-icon sm">{@render icon(s, 16)}</span>
								<a href={s.url} class="folder-label">{s.label}</a>
								<button class="ghost" onclick={() => remove(s.id)} aria-label="remove shortcut">
									<X size={13} />
								</button>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</div>
	{#if !shortcuts.length && !adding}
		<p class="empty">No shortcuts yet — add your most-visited links.</p>
	{/if}
</section>

<style>
	.push {
		margin-left: auto;
	}
	form {
		display: flex;
		gap: 8px;
		padding: 10px;
		margin-bottom: 12px;
	}
	form input {
		font-size: 14px;
		padding: 6px 10px;
		min-width: 0;
		flex: 1;
	}
	.pick-wrap {
		position: relative;
		display: inline-flex;
		flex: none;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
		gap: 12px;
	}
	.tile {
		position: relative;
		cursor: grab;
	}
	.tile:hover {
		box-shadow: var(--shadow);
	}
	.tile.dragging {
		opacity: 0.45;
	}
	.tile.drag-over {
		border-color: var(--foreground);
	}
	.tile-link {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 16px 8px 12px;
		text-decoration: none;
		width: 100%;
		background: none;
		border: none;
		cursor: pointer;
		font: inherit;
		color: var(--foreground);
	}
	.tile-icon {
		display: inline-flex;
		color: var(--muted-foreground);
	}
	.tile-icon :global(img) {
		border-radius: 5px;
	}
	.tile-icon.plus {
		font-family: var(--font-mono);
		font-size: 16px;
		font-weight: 500;
		height: 22px;
		align-items: center;
	}
	.tile-icon.sm {
		flex: none;
	}
	.tile-label {
		font-size: 12.5px;
		font-weight: 500;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.mini {
		position: absolute;
		top: 5px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		border: none;
		border-radius: 50%;
		background: var(--muted);
		color: var(--muted-foreground);
		cursor: pointer;
		opacity: 0;
		padding: 0;
	}
	.mini.swap {
		left: 5px;
	}
	.mini.del {
		right: 5px;
	}
	.tile:hover .mini {
		opacity: 1;
	}
	.mini.del:hover {
		color: var(--destructive);
	}
	.mini.swap:hover {
		color: var(--foreground);
	}
	.more-wrap {
		cursor: pointer;
	}
	.folder {
		position: absolute;
		z-index: 30;
		top: calc(100% + 6px);
		right: 0;
		min-width: 220px;
		padding: 8px;
		box-shadow: var(--shadow-md);
		display: flex;
		flex-direction: column;
	}
	.folder-row {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 7px 8px;
		border-radius: var(--radius-sm);
	}
	.folder-row:hover {
		background: var(--muted);
	}
	.folder-label {
		font-size: 14px;
		font-weight: 500;
		text-decoration: none;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		flex: 1;
	}
	.folder-row .ghost {
		opacity: 0;
	}
	.folder-row:hover .ghost {
		opacity: 1;
	}
	.empty {
		color: var(--muted-2);
		font-size: 14px;
		margin: 8px 0 0;
	}
</style>
