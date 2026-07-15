<script lang="ts">
	// next F1 race from the local season calendar (src/lib/data/f1-2026.json — edit there).
	// Raptors slot reserved for when the NBA schedule drops / a source is picked.
	import races from '$lib/data/f1-2026.json';
	import { Flag } from '@lucide/svelte';

	const now = new Date();
	const next = races.find((r) => new Date(r.date + 'T23:59:59') >= now);
	const daysAway = $derived(
		next ? Math.max(0, Math.ceil((new Date(next.date).getTime() - now.getTime()) / 86_400_000)) : null
	);
	const dateLabel = $derived(
		next
			? new Date(next.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
			: null
	);
</script>

<section>
	<div class="widget-head"><h2>Up next</h2></div>
	{#if next}
		<div class="card row" title="{next.name} — {next.location}, {next.date}">
			<Flag size={18} aria-hidden="true" />
			<div class="stack">
				<span class="title">{next.name}</span>
				<span class="meta">{next.location} · {dateLabel}</span>
			</div>
			<span class="count">{daysAway === 0 ? 'today' : `${daysAway}d`}</span>
		</div>
	{:else}
		<p class="empty">Season's over — see you in March.</p>
	{/if}
</section>

<style>
	.row {
		display: flex;
		align-items: center;
		gap: 13px;
		padding: 12px 16px;
	}
	.row :global(svg) {
		flex: none;
		color: var(--kind-do);
	}
	.stack {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.title {
		font-size: 14.5px;
		font-weight: 500;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.meta {
		font-size: 12px;
		color: var(--muted-2);
	}
	.count {
		margin-left: auto;
		font-family: var(--font-mono);
		font-size: 13px;
		color: var(--muted-foreground);
		flex: none;
	}
	.empty {
		color: var(--muted-2);
		font-size: 14px;
		margin: 0;
	}
</style>
