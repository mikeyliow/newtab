<script lang="ts">
	// ambient "life in dots" strip: month as day-dots, year as week-dots.
	// filled = gone, terracotta = where you are, faint = still yours.
	let now = $state(new Date());
	$effect(() => {
		const t = setInterval(() => (now = new Date()), 60_000);
		return () => clearInterval(t);
	});

	const month = $derived.by(() => {
		const total = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
		const current = now.getDate();
		return { total, current, left: total - current };
	});

	const year = $derived.by(() => {
		const start = new Date(now.getFullYear(), 0, 1);
		const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86_400_000) + 1;
		const current = Math.min(52, Math.floor((dayOfYear - 1) / 7) + 1);
		return { total: 52, current, left: 52 - current };
	});
</script>

<section>
	<div class="group" title="{month.left} days left this month">
		<span class="micro">Month</span>
		<div class="dots">
			{#each Array(month.total) as _, i (i)}
				<span class="dot" class:past={i + 1 < month.current} class:today={i + 1 === month.current}
				></span>
			{/each}
		</div>
		<span class="left">{month.left}d</span>
	</div>
	<div class="group" title="{year.left} weeks left this year">
		<span class="micro">Year</span>
		<div class="dots">
			{#each Array(year.total) as _, i (i)}
				<span class="dot" class:past={i + 1 < year.current} class:today={i + 1 === year.current}
				></span>
			{/each}
		</div>
		<span class="left">{year.left}w</span>
	</div>
</section>

<style>
	section {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px 36px;
	}
	.group {
		display: flex;
		align-items: center;
		gap: 10px;
		min-width: 0;
	}
	.micro {
		font-size: 10px;
	}
	.dots {
		display: flex;
		flex-wrap: wrap;
		gap: 3px;
	}
	.dot {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: var(--input);
		opacity: 0.55;
		flex: none;
	}
	.dot.past {
		background: var(--foreground);
		opacity: 0.85;
	}
	.dot.today {
		background: var(--kind-do);
		opacity: 1;
		transform: scale(1.35);
	}
	.left {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--muted-2);
	}
</style>
