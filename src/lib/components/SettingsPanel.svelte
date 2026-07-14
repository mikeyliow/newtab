<script lang="ts">
	import type { Config } from '$lib/types';
	import { api } from '$lib/client/api';
	import { ArrowUp, ArrowDown, Eye, EyeOff, X } from '@lucide/svelte';

	let { config, onclose }: { config: Config; onclose: () => void } = $props();

	// svelte-ignore state_referenced_locally -- edit buffers, deliberately seeded once
	let target = $state(config.calorie_target?.toString() ?? '');
	// svelte-ignore state_referenced_locally
	let name = $state(config.name);
	// svelte-ignore state_referenced_locally
	let wallpaper = $state(config.wallpaper);

	const widgetNames: Record<string, string> = {
		focus: 'Focus',
		items: 'Items',
		calories: 'Calories',
		budget: 'Budget (parked)',
		shortcuts: 'Shortcuts'
	};

	const sorted = $derived(
		[...config.widgets].filter((w) => widgetNames[w.id]).sort((a, b) => a.order - b.order)
	);

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

	async function save() {
		await api.patchConfig({
			calorie_target: target ? +target : null,
			name: name.trim() || config.name,
			wallpaper: wallpaper.trim()
		});
		onclose();
	}

	async function logout() {
		await api.logout();
		location.href = '/login';
	}
</script>

<aside class="card">
	<header>
		<span class="micro">Settings</span>
		<button class="ghost" onclick={onclose} aria-label="close settings"><X size={16} /></button>
	</header>

	<div class="cols">
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
			<label class="field">
				<span class="micro">Your name</span>
				<input bind:value={name} placeholder="name in the greeting" />
			</label>
			<label class="field">
				<span class="micro">Daily calorie target</span>
				<input type="number" bind:value={target} placeholder="none" min="0" />
			</label>
			<label class="field">
				<span class="micro">Wallpaper (image url, empty for none)</span>
				<input bind:value={wallpaper} placeholder="https://…/wallpaper.jpg" />
			</label>
			<div class="actions">
				<button class="pill" onclick={save}>Save</button>
				<button class="soft logout" onclick={logout}>Log out</button>
			</div>
		</div>
	</div>
</aside>

<style>
	aside {
		padding: 20px 24px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.cols {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 32px;
	}
	@media (max-width: 720px) {
		.cols {
			grid-template-columns: 1fr;
		}
	}
	.block {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.widget-row {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 14px;
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
	.field {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.field input {
		font-size: 14px;
		padding: 8px 12px;
	}
	.actions {
		display: flex;
		gap: 10px;
		margin-top: 4px;
	}
	.logout {
		color: var(--destructive);
	}
</style>
