<script lang="ts">
	import type { Config } from '$lib/types';
	import { api } from '$lib/client/api';
	import { ArrowUp, ArrowDown, Eye, EyeOff, X } from '@lucide/svelte';

	let { config, onclose }: { config: Config; onclose: () => void } = $props();

	// svelte-ignore state_referenced_locally -- edit buffer, deliberately seeded once
	let target = $state(config.calorie_target?.toString() ?? '');
	let newLabel = $state('');
	let newUrl = $state('');

	const widgetNames: Record<string, string> = {
		focus: 'Focus',
		now: 'Now',
		items: 'Items',
		calories: 'Calories',
		budget: 'Budget (parked)',
		shortcuts: 'Shortcuts'
	};

	const sorted = $derived([...config.widgets].sort((a, b) => a.order - b.order));

	async function toggleWidget(id: string) {
		await api.patchConfig({
			widgets: config.widgets.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w))
		});
	}

	async function move(id: string, delta: number) {
		const list = [...sorted];
		const i = list.findIndex((w) => w.id === id);
		const j = i + delta;
		if (j < 0 || j >= list.length) return;
		[list[i], list[j]] = [list[j], list[i]];
		await api.patchConfig({ widgets: list.map((w, idx) => ({ ...w, order: idx + 1 })) });
	}

	async function saveTarget() {
		await api.patchConfig({ calorie_target: target ? +target : null });
	}

	async function addShortcut(e: SubmitEvent) {
		e.preventDefault();
		if (!newLabel.trim() || !newUrl.trim()) return;
		await api.patchConfig({
			shortcuts: [
				...config.shortcuts,
				{ id: crypto.randomUUID(), label: newLabel.trim(), url: newUrl.trim() }
			]
		});
		newLabel = newUrl = '';
	}

	async function removeShortcut(id: string) {
		await api.patchConfig({ shortcuts: config.shortcuts.filter((s) => s.id !== id) });
	}

	async function logout() {
		await api.logout();
		location.href = '/login';
	}
</script>

<aside>
	<header>
		<span class="micro">Settings</span>
		<button class="ghost" onclick={onclose} aria-label="close settings"><X size={16} /></button>
	</header>

	<div class="block">
		<span class="micro">Widgets</span>
		{#each sorted as w (w.id)}
			<div class="widget-row" class:hidden-widget={!w.visible}>
				<span class="name">{widgetNames[w.id] ?? w.id}</span>
				{#if w.sensitive}<span class="micro sens">private</span>{/if}
				<span class="controls">
					<button class="ghost" onclick={() => move(w.id, -1)} aria-label="move up">
						<ArrowUp size={14} />
					</button>
					<button class="ghost" onclick={() => move(w.id, 1)} aria-label="move down">
						<ArrowDown size={14} />
					</button>
					<button class="ghost" onclick={() => toggleWidget(w.id)} aria-label="toggle visibility">
						{#if w.visible}<Eye size={14} />{:else}<EyeOff size={14} />{/if}
					</button>
				</span>
			</div>
		{/each}
	</div>

	<div class="block">
		<span class="micro">Daily calorie target</span>
		<div class="inline">
			<input type="number" bind:value={target} placeholder="none" min="0" />
			<button class="pill" onclick={saveTarget}>Save</button>
		</div>
	</div>

	<div class="block">
		<span class="micro">Shortcuts</span>
		{#each config.shortcuts as s (s.id)}
			<div class="widget-row">
				<span class="name">{s.label}</span>
				<span class="url">{s.url}</span>
				<button class="ghost" onclick={() => removeShortcut(s.id)} aria-label="remove shortcut">
					<X size={14} />
				</button>
			</div>
		{/each}
		<form class="inline" onsubmit={addShortcut}>
			<input bind:value={newLabel} placeholder="label" />
			<input class="grow" bind:value={newUrl} placeholder="https://…" />
			<button class="pill" type="submit">Add</button>
		</form>
	</div>

	<div class="block">
		<button class="pill logout" onclick={logout}>Log out</button>
	</div>
</aside>

<style>
	aside {
		background: var(--card);
		border-radius: var(--radius-lg);
		padding: 20px;
		box-shadow: var(--shadow-md);
		display: flex;
		flex-direction: column;
		gap: 20px;
	}
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.block {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.widget-row {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 14px;
		padding: 2px 0;
	}
	.hidden-widget .name {
		color: var(--muted-2);
	}
	.controls {
		margin-left: auto;
		display: inline-flex;
		gap: 2px;
	}
	.sens {
		font-size: 10px;
	}
	.url {
		color: var(--muted-2);
		font-size: 12px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		margin-left: auto;
		max-width: 45%;
	}
	.inline {
		display: flex;
		gap: 8px;
		align-items: center;
	}
	.inline input {
		font-size: 14px;
		padding: 6px 10px;
		width: 110px;
	}
	.grow {
		flex: 1;
	}
	.logout {
		align-self: flex-start;
		background: none;
		color: var(--destructive);
		border: 1px solid var(--destructive);
	}
</style>
