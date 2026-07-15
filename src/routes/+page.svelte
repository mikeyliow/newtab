<script lang="ts">
	import type { PageProps } from './$types';
	import FocusWidget from '$lib/components/FocusWidget.svelte';
	import ProgressWidget from '$lib/components/ProgressWidget.svelte';
	import ItemsWidget from '$lib/components/ItemsWidget.svelte';
	import QueueWidget from '$lib/components/QueueWidget.svelte';
	import SportsWidget from '$lib/components/SportsWidget.svelte';
	import CaloriesWidget from '$lib/components/CaloriesWidget.svelte';
	import ShortcutsWidget from '$lib/components/ShortcutsWidget.svelte';
	import SettingsPanel from '$lib/components/SettingsPanel.svelte';
	import Background from '$lib/components/Background.svelte';
	import StatusLines from '$lib/components/StatusLines.svelte';
	import { greeting as pickGreeting } from '$lib/greetings';
	import { ICONS } from '$lib/icons';
	import { Settings2, Sun, Moon, Sunrise, Sunset, Globe } from '@lucide/svelte';
	import { browser } from '$app/environment';

	let { data }: PageProps = $props();
	const dash = $derived(data.dashboard);

	let showSettings = $state(false);

	// manual light/dark — per device, ignores the system setting
	let dark = $state(browser && localStorage.getItem('newtab:theme') === 'dark');
	$effect(() => {
		if (!browser) return;
		localStorage.setItem('newtab:theme', dark ? 'dark' : 'light');
		document.documentElement.classList.toggle('dark', dark);
	});

	// live clock, minute resolution
	let now = $state(new Date());
	$effect(() => {
		const t = setInterval(() => (now = new Date()), 10_000);
		return () => clearInterval(t);
	});
	const clock = $derived(
		now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
	);
	const PhaseIcon = $derived.by(() => {
		const h = now.getHours();
		if (h >= 5 && h < 9) return Sunrise;
		if (h < 18) return Sun;
		if (h < 20) return Sunset;
		return Moon;
	});
	const greeting = pickGreeting(new Date());
	const dateLine = $derived(
		now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
	);

	// widgets split into the main column and the right sidebar, both config-ordered.
	// progress renders in the header's time block, focus as the tagline under the greeting;
	// their config entries still control visibility.
	const MAIN = ['items', 'shortcuts'];
	const SIDEBAR = ['queue', 'sports', 'calories', 'budget'];
	const showProgress = $derived(dash.config.widgets.some((w) => w.id === 'progress' && w.visible));
	const showTagline = $derived(dash.config.widgets.some((w) => w.id === 'focus' && w.visible));
	const visible = $derived(
		[...dash.config.widgets].sort((a, b) => a.order - b.order).filter((w) => w.visible)
	);
	const mainWidgets = $derived(visible.filter((w) => MAIN.includes(w.id)));
	const sideWidgets = $derived(visible.filter((w) => SIDEBAR.includes(w.id)));
</script>

<svelte:head><title>newtab</title></svelte:head>

<div
	class="page"
	class:has-wallpaper={!!dash.config.wallpaper}
	style:background-image={dash.config.wallpaper ? `url(${dash.config.wallpaper})` : undefined}
>
	{#if !dash.config.wallpaper}
		<Background />
	{/if}
	<main>
		<header class="top">
			<div class="hello">
				<span class="micro">{dateLine}</span>
				<h1>{greeting}, {dash.config.name}.</h1>
				{#if showTagline}
					<FocusWidget focus={dash.config.focus} icon={dash.config.focus_icon} />
				{/if}
				{#if dash.config.quick_links.length}
					<nav class="quick">
						{#each dash.config.quick_links as q (q.url)}
							{@const QIcon = (q.icon && ICONS[q.icon]) || Globe}
							<a class="soft" href={q.url}><QIcon size={14} />{q.label}</a>
						{/each}
					</nav>
				{/if}
			</div>
			<div class="top-right">
				<span class="clock"><PhaseIcon size={24} aria-hidden="true" />{clock}</span>
				<div class="status-row">
					<StatusLines {now} />
				</div>
				{#if showProgress}
					<ProgressWidget />
				{/if}
			</div>
		</header>

		{#if showSettings}
			<SettingsPanel config={dash.config} onclose={() => (showSettings = false)} />
		{/if}

		<div class="grid">
			<div class="col main-col">
				{#each mainWidgets as widget (widget.id)}
					<div>
						{#if widget.id === 'items'}
							<ItemsWidget items={dash.items} doneToday={dash.done_today} doneWeek={dash.done_week} />
						{:else if widget.id === 'shortcuts'}
							<ShortcutsWidget shortcuts={dash.config.shortcuts} />
						{/if}
					</div>
				{/each}
			</div>
			<div class="col side-col">
				{#each sideWidgets as widget (widget.id)}
					<div>
						{#if widget.id === 'queue'}
							<QueueWidget items={dash.items} />
						{:else if widget.id === 'sports'}
							<SportsWidget raptors={data.raptors} />
						{:else if widget.id === 'calories'}
							<CaloriesWidget meals={dash.meals} totals={dash.meal_totals} target={dash.config.calorie_target} />
						{/if}
						<!-- budget widget parked for v1 -->
					</div>
				{/each}
			</div>
		</div>
	</main>

	<div class="corner">
		<button
			class="ghost"
			onclick={() => (dark = !dark)}
			aria-label="toggle theme"
			title={dark ? 'light mode' : 'dark mode'}
		>
			{#if dark}<Sun size={17} />{:else}<Moon size={17} />{/if}
		</button>
		<button
			class="ghost"
			onclick={() => (showSettings = !showSettings)}
			aria-label="settings"
			title="settings"
		>
			<Settings2 size={17} />
		</button>
	</div>
</div>

<style>
	.page {
		min-height: 100dvh;
		background-size: cover;
		background-position: center;
		background-attachment: fixed;
	}
	/* keep bare text legible on top of a photo */
	.has-wallpaper :global(h1),
	.has-wallpaper :global(h2),
	.has-wallpaper :global(.micro),
	.has-wallpaper .clock {
		text-shadow: 0 1px 12px color-mix(in srgb, var(--background) 70%, transparent);
	}
	main {
		max-width: 1560px;
		margin: 0 auto;
		padding: 40px 56px 40px;
		display: flex;
		flex-direction: column;
		gap: 30px;
	}
	.top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
	}
	.quick {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-top: 18px;
	}
	.quick a {
		text-decoration: none;
		gap: 8px;
		font-size: 14.5px;
		padding: 10px 18px;
		border-radius: var(--radius-md);
	}
	h1 {
		font-size: 52px;
		letter-spacing: -1.6px;
		margin-top: 2px;
	}
	.hello > :global(.micro) {
		font-size: 13px;
	}
	.top-right {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 6px;
		padding-top: 4px;
		flex: none;
	}
	.clock {
		display: inline-flex;
		align-items: center;
		gap: 14px;
		font-family: var(--font-mono);
		font-size: 48px;
		font-weight: 500;
		letter-spacing: -0.03em;
		line-height: 1;
	}
	.clock :global(svg) {
		color: var(--muted-foreground);
	}
	.status-row {
		display: flex;
		align-items: center;
		gap: 16px;
	}
	.corner {
		position: fixed;
		right: 18px;
		bottom: 16px;
		display: flex;
		gap: 4px;
		padding: 4px;
		border-radius: var(--radius-pill);
		background: color-mix(in srgb, var(--card) 72%, transparent);
		backdrop-filter: blur(8px);
		opacity: 0.55;
		transition: opacity 0.2s ease;
		z-index: 30;
	}
	.corner:hover,
	.corner:focus-within {
		opacity: 1;
	}
	.grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 400px;
		gap: 56px;
		align-items: start;
	}
	.col {
		display: flex;
		flex-direction: column;
		gap: 32px;
		min-width: 0;
	}
	@media (max-width: 960px) {
		main {
			padding: 32px 20px 80px;
		}
		h1 {
			font-size: 32px;
		}
		.grid {
			grid-template-columns: 1fr;
			gap: 32px;
		}
	}
</style>
