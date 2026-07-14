<script lang="ts">
	// ambient time-left tiles: how far through the day / week / month / year we are
	let now = $state(new Date());
	$effect(() => {
		const t = setInterval(() => (now = new Date()), 60_000);
		return () => clearInterval(t);
	});

	const DAY_MS = 86_400_000;

	function startOfDay(d: Date): Date {
		return new Date(d.getFullYear(), d.getMonth(), d.getDate());
	}

	const tiles = $derived.by(() => {
		const dayStart = startOfDay(now);
		const dayEnd = new Date(dayStart.getTime() + DAY_MS);
		// week starts Monday
		const dow = (now.getDay() + 6) % 7;
		const weekStart = new Date(dayStart.getTime() - dow * DAY_MS);
		const weekEnd = new Date(weekStart.getTime() + 7 * DAY_MS);
		const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
		const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
		const yearStart = new Date(now.getFullYear(), 0, 1);
		const yearEnd = new Date(now.getFullYear() + 1, 0, 1);

		const hoursLeft = (end: Date) => `${Math.max(1, Math.floor((end.getTime() - now.getTime()) / 3_600_000))}h left`;
		const daysLeft = (end: Date) => {
			const d = Math.floor((end.getTime() - now.getTime()) / DAY_MS);
			return d < 1 ? hoursLeft(end) : `${d}d left`;
		};
		const pct = (start: Date, end: Date) =>
			((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100;

		return [
			{ label: 'Day', pct: pct(dayStart, dayEnd), left: hoursLeft(dayEnd) },
			{ label: 'Week', pct: pct(weekStart, weekEnd), left: daysLeft(weekEnd) },
			{ label: 'Month', pct: pct(monthStart, monthEnd), left: daysLeft(monthEnd) },
			{ label: 'Year', pct: pct(yearStart, yearEnd), left: daysLeft(yearEnd) }
		];
	});
</script>

<section>
	{#each tiles as t (t.label)}
		<div class="card tile">
			<div class="row">
				<span class="micro">{t.label}</span>
				<span class="pct">{Math.round(t.pct)}%</span>
			</div>
			<div class="bar">
				<div class="fill" style:width="{t.pct}%"></div>
			</div>
			<span class="left">{t.left}</span>
		</div>
	{/each}
</section>

<style>
	section {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 12px;
	}
	@media (max-width: 640px) {
		section {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	.tile {
		padding: 12px 14px;
		display: flex;
		flex-direction: column;
		gap: 7px;
	}
	.row {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}
	.pct {
		font-family: var(--font-mono);
		font-size: 13px;
		font-weight: 500;
	}
	.bar {
		height: 3px;
		border-radius: 2px;
		background: var(--muted);
		overflow: hidden;
	}
	.fill {
		height: 100%;
		border-radius: 2px;
		background: var(--foreground);
		transition: width 0.6s ease;
	}
	.left {
		font-size: 12px;
		color: var(--muted-2);
	}
</style>
