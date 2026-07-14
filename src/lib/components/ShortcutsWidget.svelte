<script lang="ts">
	import type { Shortcut } from '$lib/types';
	import { api } from '$lib/client/api';
	import { Plus, X, Globe } from '@lucide/svelte';

	let { shortcuts }: { shortcuts: Shortcut[] } = $props();

	let adding = $state(false);
	let label = $state('');
	let url = $state('');
	let saving = $state(false);
	let broken = $state<Record<string, boolean>>({});

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
				shortcuts: [...shortcuts, { id: crypto.randomUUID(), label: label.trim(), url: u }]
			});
			label = url = '';
			adding = false;
		} finally {
			saving = false;
		}
	}

	async function remove(id: string) {
		await api.patchConfig({ shortcuts: shortcuts.filter((s) => s.id !== id) });
	}
</script>

<section>
	<div class="widget-head">
		<h2>Shortcuts</h2>
		<button class="soft push" onclick={() => (adding = !adding)}>
			<Plus size={14} /> Add
		</button>
	</div>

	{#if adding}
		<form class="card" onsubmit={add}>
			<!-- svelte-ignore a11y_autofocus -->
			<input bind:value={label} placeholder="label" autofocus />
			<input bind:value={url} placeholder="https://…" />
			<button class="pill" type="submit" disabled={saving}>Add</button>
		</form>
	{/if}

	<div class="list">
		{#each shortcuts as s (s.id)}
			<div class="card row">
				<a href={s.url} class="link">
					{#if favicon(s.url) && !broken[s.id]}
						<img
							src={favicon(s.url)}
							alt=""
							width="22"
							height="22"
							onerror={() => (broken = { ...broken, [s.id]: true })}
						/>
					{:else}
						<Globe size={20} aria-hidden="true" />
					{/if}
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
		padding: 12px;
		margin-bottom: 12px;
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
		gap: 12px;
	}
	.row {
		display: flex;
		align-items: center;
	}
	.row:hover {
		box-shadow: var(--shadow);
	}
	.link {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 16px 18px;
		text-decoration: none;
		font-weight: 500;
		min-width: 0;
	}
	.link :global(svg),
	.link img {
		flex: none;
		border-radius: 5px;
		color: var(--muted-foreground);
	}
	.label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.remove {
		margin-right: 12px;
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
