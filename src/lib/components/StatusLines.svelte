<script lang="ts">
	// small mono status lines under the clock: local weather + US market open indicator
	import {
		Sun,
		CloudSun,
		Cloud,
		CloudFog,
		CloudDrizzle,
		CloudRain,
		CloudSnow,
		CloudLightning
	} from '@lucide/svelte';

	let { now }: { now: Date } = $props();

	// --- weather (Open-Meteo, no API key) — coords: Kuala Lumpur, edit if you move ---
	const LAT = 3.139;
	const LON = 101.687;

	let weather = $state<{ temp: number; code: number } | null>(null);
	$effect(() => {
		fetch(
			`https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code`
		)
			.then((r) => r.json())
			.then((d) => {
				weather = { temp: d.current.temperature_2m, code: d.current.weather_code };
			})
			.catch(() => {
				// no weather is fine — the line just doesn't render
			});
	});

	function describe(code: number): { icon: typeof Sun; text: string } {
		if (code === 0) return { icon: Sun, text: 'clear' };
		if (code <= 1) return { icon: CloudSun, text: 'mostly clear' };
		if (code === 2) return { icon: CloudSun, text: 'partly cloudy' };
		if (code === 3) return { icon: Cloud, text: 'overcast' };
		if (code <= 48) return { icon: CloudFog, text: 'foggy' };
		if (code <= 57) return { icon: CloudDrizzle, text: 'drizzle' };
		if (code <= 67) return { icon: CloudRain, text: 'rain' };
		if (code <= 77) return { icon: CloudSnow, text: 'snow' };
		if (code <= 82) return { icon: CloudRain, text: 'showers' };
		return { icon: CloudLightning, text: 'storm' };
	}
	const w = $derived(weather ? describe(weather.code) : null);

	// --- US market (NYSE): 9:30–16:00 America/New_York, weekdays. DST handled by the timezone. ---
	const TRADING_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
	const WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	const OPEN = 9 * 60 + 30;
	const CLOSE = 16 * 60;

	const market = $derived.by(() => {
		const parts = Object.fromEntries(
			new Intl.DateTimeFormat('en-US', {
				timeZone: 'America/New_York',
				weekday: 'short',
				hour: '2-digit',
				minute: '2-digit',
				hour12: false
			})
				.formatToParts(now)
				.map((p) => [p.type, p.value])
		);
		const mins = (Number(parts.hour) % 24) * 60 + Number(parts.minute);
		const trading = TRADING_DAYS.includes(parts.weekday);
		if (trading && mins >= OPEN && mins < CLOSE) return { open: true, until: 0 };

		let until: number;
		if (trading && mins < OPEN) {
			until = OPEN - mins;
		} else {
			until = 1440 - mins;
			let day = (WEEK.indexOf(parts.weekday) + 1) % 7;
			while (!TRADING_DAYS.includes(WEEK[day])) {
				until += 1440;
				day = (day + 1) % 7;
			}
			until += OPEN;
		}
		return { open: false, until };
	});
</script>

{#if w && weather}
	{@const WIcon = w.icon}
	<span class="line">
		<WIcon size={13} aria-hidden="true" />
		{Math.round(weather.temp)}° {w.text}
	</span>
{/if}
{#if market.open}
	<span class="line"><span class="pulse"></span>US market open</span>
{:else if market.until <= 1440}
	<span class="line dim">US open in {Math.floor(market.until / 60)}h {market.until % 60}m</span>
{/if}

<style>
	.line {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--muted-foreground);
	}
	.dim {
		color: var(--muted-2);
	}
	.pulse {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--macro-p);
		animation: pulse 2.4s ease-in-out infinite;
	}
	@keyframes pulse {
		50% {
			opacity: 0.35;
		}
	}
</style>
