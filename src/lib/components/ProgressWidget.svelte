<script lang="ts">
	// the year as day-tiles, one column per week (the column rhythm marks the weeks).
	// filled = gone, terracotta = today, faint = still yours.
	let now = $state(new Date());
	$effect(() => {
		const t = setInterval(() => (now = new Date()), 60_000);
		return () => clearInterval(t);
	});

	const year = $derived.by(() => {
		const start = new Date(now.getFullYear(), 0, 1);
		const end = new Date(now.getFullYear() + 1, 0, 1);
		const total = Math.round((end.getTime() - start.getTime()) / 86_400_000);
		const today = Math.floor((now.getTime() - start.getTime()) / 86_400_000) + 1;
		return { total, today, left: total - today };
	});
</script>

<section title="day {year.today} of {year.total} — {year.left} days left">
	<span class="micro">Year</span>
	<div class="grid">
		{#each Array(year.total) as _, i (i)}
			<span class="tile" class:past={i + 1 < year.today} class:today={i + 1 === year.today}
			></span>
		{/each}
	</div>
	<span class="left">{year.left}d</span>
</section>

<style>
	section {
		display: flex;
		align-items: center;
		gap: 14px;
	}
	.micro {
		font-size: 10px;
		flex: none;
	}
	.grid {
		display: grid;
		grid-auto-flow: column;
		grid-template-rows: repeat(7, 5px);
		grid-auto-columns: 5px;
		gap: 2.5px;
	}
	.tile {
		width: 5px;
		height: 5px;
		border-radius: 1.5px;
		background: var(--input);
		opacity: 0.45;
	}
	.tile.past {
		background: var(--foreground);
		opacity: 0.8;
	}
	.tile.today {
		background: var(--kind-do);
		opacity: 1;
	}
	.left {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--muted-2);
		flex: none;
	}
</style>
