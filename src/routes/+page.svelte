<script lang="ts">
	import type { PageProps } from './$types';
	import FocusWidget from '$lib/components/FocusWidget.svelte';
	import NowWidget from '$lib/components/NowWidget.svelte';
	import ItemsWidget from '$lib/components/ItemsWidget.svelte';
	import CaloriesWidget from '$lib/components/CaloriesWidget.svelte';
	import ShortcutsWidget from '$lib/components/ShortcutsWidget.svelte';
	import SettingsPanel from '$lib/components/SettingsPanel.svelte';
	import { Settings2, EyeOff, Eye } from '@lucide/svelte';
	import { browser } from '$app/environment';

	let { data }: PageProps = $props();
	const dash = $derived(data.dashboard);

	let showSettings = $state(false);
	let privacy = $state(browser && localStorage.getItem('newtab:privacy') === '1');
	$effect(() => {
		if (browser) localStorage.setItem('newtab:privacy', privacy ? '1' : '0');
	});

	const now = new Date();
	const greeting =
		now.getHours() < 5 ? 'Up late' : now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';
	const dateLine = now.toLocaleDateString('en-GB', {
		weekday: 'long',
		day: 'numeric',
		month: 'long'
	});

	const visibleWidgets = $derived(
		[...dash.config.widgets].sort((a, b) => a.order - b.order).filter((w) => w.visible)
	);
</script>

<svelte:head><title>newtab</title></svelte:head>

<main>
	<header class="top">
		<div>
			<span class="micro">{dateLine}</span>
			<h1>{greeting}, Mikey.</h1>
		</div>
		<div class="top-actions">
			<button
				class="ghost"
				onclick={() => (privacy = !privacy)}
				aria-label="toggle privacy mode"
				title={privacy ? 'show private widgets' : 'privacy mode'}
			>
				{#if privacy}<EyeOff size={18} />{:else}<Eye size={18} />{/if}
			</button>
			<button
				class="ghost"
				onclick={() => (showSettings = !showSettings)}
				aria-label="settings"
				title="settings"
			>
				<Settings2 size={18} />
			</button>
		</div>
	</header>

	{#if showSettings}
		<SettingsPanel config={dash.config} onclose={() => (showSettings = false)} />
	{/if}

	{#each visibleWidgets as widget (widget.id)}
		<div class:sensitive-blur={privacy && widget.sensitive}>
			{#if widget.id === 'focus'}
				<FocusWidget focus={dash.config.focus} />
			{:else if widget.id === 'now'}
				<NowWidget items={dash.items} />
			{:else if widget.id === 'items'}
				<ItemsWidget items={dash.items} />
			{:else if widget.id === 'calories'}
				<CaloriesWidget meals={dash.meals} totals={dash.meal_totals} target={dash.config.calorie_target} />
			{:else if widget.id === 'shortcuts'}
				<ShortcutsWidget shortcuts={dash.config.shortcuts} />
			{/if}
			<!-- budget widget parked for v1 -->
		</div>
	{/each}
</main>

<style>
	main {
		max-width: 680px;
		margin: 0 auto;
		padding: 48px 24px 96px;
		display: flex;
		flex-direction: column;
		gap: 32px;
	}
	.top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
	}
	h1 {
		font-size: 36px;
		margin-top: 2px;
	}
	.top-actions {
		display: flex;
		gap: 4px;
		padding-top: 6px;
	}
</style>
