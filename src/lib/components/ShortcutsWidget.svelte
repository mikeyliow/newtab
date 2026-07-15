<script lang="ts">
	import type { Shortcut } from '$lib/types';
	import { api } from '$lib/client/api';
	import { Plus, X, Globe, GripVertical } from '@lucide/svelte';
	import { ICONS } from '$lib/icons';
	import IconPicker from './IconPicker.svelte';
	import { slide } from 'svelte/transition';
	import { flip } from 'svelte/animate';

	let { shortcuts }: { shortcuts: Shortcut[] } = $props();

	let adding = $state(false);
	let label = $state('');
	let url = $state('');
	let newIcon = $state<string | null>(null);
	let addPickerOpen = $state(false);
	let pickerFor = $state<string | null>(null);
	let saving = $state(false);
	let broken = $state<Record<string, boolean>>({});

	async function setIcon(id: string, name: string | null) {
		pickerFor = null;
		await api.patchConfig({
			shortcuts: shortcuts.map((s) => (s.id === id ? { ...s, icon: name ?? undefined } : s))
		});
	}

	// drag to rearrange (HTML5 dnd), persisted through the same config patch as everything else
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

<svelte:window
	onclick={() => {
		pickerFor = null;
		addPickerOpen = false;
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
		<form class="card" onsubmit={add}>
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

	<div class="list" role="list">
		{#each shortcuts as s, i (s.id)}
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<div
				class="card row"
				class:dragging={dragIdx === i}
				class:drag-over={overIdx === i && dragIdx !== null && dragIdx !== i}
				role="listitem"
				animate:flip={{ duration: 220 }}
				in:slide={{ duration: 180 }}
				out:slide={{ duration: 160 }}
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
				<span class="grip" aria-hidden="true"><GripVertical size={14} /></span>
				<span class="pick-wrap">
					<button
						class="icon-slot"
						onclick={(e) => {
							e.stopPropagation();
							pickerFor = pickerFor === s.id ? null : s.id;
						}}
						aria-label="change icon"
						title="change icon"
					>
						{#if s.icon && ICONS[s.icon]}
							{@const RowIcon = ICONS[s.icon]}
							<RowIcon size={18} />
						{:else if favicon(s.url) && !broken[s.id]}
							<img
								src={favicon(s.url)}
								alt=""
								width="20"
								height="20"
								onerror={() => (broken = { ...broken, [s.id]: true })}
							/>
						{:else}
							<Globe size={18} aria-hidden="true" />
						{/if}
					</button>
					{#if pickerFor === s.id}
						<IconPicker value={s.icon ?? null} allowNone onpick={(n) => setIcon(s.id, n)} />
					{/if}
				</span>
				<a href={s.url} class="link">
					<span class="label">{s.label}</span>
				</a>
				<button class="ghost remove" onclick={() => remove(s.id)} aria-label="remove shortcut">
					<X size={14} />
				</button>
			</div>
		{/each}
		{#if !shortcuts.length && !adding}
			<p class="empty">No shortcuts yet — add your most-visited links.</p>
		{/if}
	</div>
</section>

<style>
	.push {
		margin-left: auto;
	}
	form {
		display: flex;
		gap: 8px;
		padding: 10px;
		margin-bottom: 10px;
	}
	form input {
		font-size: 14px;
		padding: 6px 10px;
		min-width: 0;
		flex: 1;
	}
	.list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.row {
		display: flex;
		align-items: center;
		cursor: grab;
	}
	.row:hover {
		box-shadow: var(--shadow);
	}
	.row.dragging {
		opacity: 0.45;
	}
	.row.drag-over {
		border-color: var(--foreground);
	}
	.grip {
		display: inline-flex;
		color: var(--muted-2);
		padding-left: 6px;
		opacity: 0;
		flex: none;
	}
	.row:hover .grip {
		opacity: 1;
	}
	.pick-wrap {
		position: relative;
		display: inline-flex;
		flex: none;
	}
	.icon-slot {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background: none;
		border: none;
		border-radius: var(--radius-sm);
		color: var(--muted-foreground);
		cursor: pointer;
		padding: 0;
	}
	.icon-slot:hover {
		background: var(--muted);
		color: var(--foreground);
	}
	.icon-slot img {
		border-radius: 4px;
	}
	.link {
		flex: 1;
		display: flex;
		align-items: center;
		padding: 10px 10px 10px 6px;
		text-decoration: none;
		font-size: 14.5px;
		font-weight: 500;
		min-width: 0;
	}
	.label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.remove {
		margin-right: 8px;
		opacity: 0;
	}
	.row:hover .remove {
		opacity: 1;
	}
	.empty {
		color: var(--muted-2);
		font-size: 14px;
		margin: 0;
	}
</style>
