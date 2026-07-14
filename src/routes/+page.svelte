<script lang="ts">
	import type { PageProps } from './$types';
	import FocusWidget from '$lib/components/FocusWidget.svelte';
	import ProgressWidget from '$lib/components/ProgressWidget.svelte';
	import ItemsWidget from '$lib/components/ItemsWidget.svelte';
	import CaloriesWidget from '$lib/components/CaloriesWidget.svelte';
	import ShortcutsWidget from '$lib/components/ShortcutsWidget.svelte';
	import SettingsPanel from '$lib/components/SettingsPanel.svelte';
	import Background from '$lib/components/Background.svelte';
	import StatusLines from '$lib/components/StatusLines.svelte';
	import { greeting as pickGreeting } from '$lib/greetings';
	import { Settings2, EyeOff, Eye, Sun, Moon, Sunrise, Sunset } from '@lucide/svelte';
	import { browser } from '$app/environment';

	let { data }: PageProps = $props();
	const dash = $derived(data.dashboard);

	let showSettings = $state(false);
	let privacy = $state(browser && localStorage.getItem('newtab:privacy') === '1');
	$effect(() => {
		if (browser) localStorage.setItem('newtab:privacy', privacy ? '1' : '0');
	});

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
		now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
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

	// widgets split into the main column and the right sidebar, both config-ordered
	const MAIN = ['progress', 'focus', 'items'];
	const SIDEBAR = ['shortcuts', 'calories', 'budget'];
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
			<div>
				<span class="micro">{dateLine}</span>
				<h1>{greeting}, {dash.config.name}.</h1>
			</div>
			<div class="top-right">
				<div class="clock-row">
					<span class="clock"><PhaseIcon size={20} aria-hidden="true" />{clock}</span>
					<span class="divider"></span>
					<button
						class="ghost"
						onclick={() => (dark = !dark)}
						aria-label="toggle theme"
						title={dark ? 'light mode' : 'dark mode'}
					>
						{#if dark}<Sun size={18} />{:else}<Moon size={18} />{/if}
					</button>
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
				<div class="status-row">
					<StatusLines {now} />
				</div>
			</div>
		</header>

		{#if showSettings}
			<SettingsPanel config={dash.config} onclose={() => (showSettings = false)} />
		{/if}

		<div class="grid">
			<div class="col main-col">
				{#each mainWidgets as widget (widget.id)}
					<div class:sensitive-blur={privacy && widget.sensitive}>
						{#if widget.id === 'progress'}
							<ProgressWidget />
						{:else if widget.id === 'focus'}
							<FocusWidget focus={dash.config.focus} />
						{:else if widget.id === 'items'}
							<ItemsWidget items={dash.items} doneToday={dash.done_today} />
						{/if}
					</div>
				{/each}
			</div>
			<div class="col side-col">
				{#each sideWidgets as widget (widget.id)}
					<div class:sensitive-blur={privacy && widget.sensitive}>
						{#if widget.id === 'shortcuts'}
							<ShortcutsWidget shortcuts={dash.config.shortcuts} />
						{:else if widget.id === 'calories'}
							<CaloriesWidget meals={dash.meals} totals={dash.meal_totals} target={dash.config.calorie_target} />
						{/if}
						<!-- budget widget parked for v1 -->
					</div>
				{/each}
			</div>
		</div>
	</main>
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
		max-width: 1280px;
		margin: 0 auto;
		padding: 44px 48px 96px;
		display: flex;
		flex-direction: column;
		gap: 36px;
	}
	.top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
	}
	h1 {
		font-size: 44px;
		letter-spacing: -1.3px;
		margin-top: 2px;
	}
	.top-right {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 6px;
		padding-top: 4px;
		flex: none;
	}
	.clock-row {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.clock {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		font-family: var(--font-mono);
		font-size: 26px;
		font-weight: 500;
		letter-spacing: -0.02em;
	}
	.clock :global(svg) {
		color: var(--muted-foreground);
	}
	.divider {
		width: 1px;
		height: 18px;
		background: var(--border);
		margin: 0 6px;
	}
	.status-row {
		display: flex;
		align-items: center;
		gap: 16px;
	}
	.grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 340px;
		gap: 48px;
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
