<script lang="ts">
	// Up next: F1 season as a dot strip (local calendar, src/lib/data/f1-2026.json)
	// + Raptors next/last game (ESPN, server-cached).
	import races from '$lib/data/f1-2026.json';
	import type { RaptorsInfo } from '$lib/types';
	import { CarFront } from '@lucide/svelte';
	import Basketball from './Basketball.svelte';

	let { raptors = null }: { raptors?: RaptorsInfo | null } = $props();

	const now = new Date();
	const nextIdx = races.findIndex((r) => new Date(r.date + 'T23:59:59') >= now);
	const next = nextIdx >= 0 ? races[nextIdx] : null;

	function daysAway(date: string): number {
		return Math.max(0, Math.ceil((new Date(date).getTime() - now.getTime()) / 86_400_000));
	}
	function shortDate(date: string): string {
		return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
	}
</script>

<section>
	<div class="widget-head"><h2>Up next</h2></div>
	<div class="stack">
		<div class="card block" title={next ? `round ${nextIdx + 1} of ${races.length}` : 'season over'}>
			<div class="dots">
				{#each races as r, i (r.name)}
					<span
						class="dot"
						class:past={nextIdx === -1 || i < nextIdx}
						class:next={i === nextIdx}
						title="{r.name} · {shortDate(r.date)}"
					></span>
				{/each}
				<span class="round">{nextIdx === -1 ? 'fin' : `R${nextIdx + 1}/${races.length}`}</span>
			</div>
			{#if next}
				<div class="line">
					<CarFront size={16} aria-hidden="true" class="f1" />
					<div class="text">
						<span class="title">{next.name}</span>
						<span class="meta">{next.location} · {shortDate(next.date)}</span>
					</div>
					<span class="count">{daysAway(next.date) === 0 ? 'today' : `${daysAway(next.date)}d`}</span>
				</div>
			{:else}
				<p class="empty">Season's over — see you in March.</p>
			{/if}
		</div>

		{#if raptors && (raptors.next || raptors.last)}
			<div class="card block">
				{#if raptors.next}
					<div class="line">
						<span class="ic nba"><Basketball size={16} /></span>
						<div class="text">
							<span class="title">Raptors {raptors.next.home ? 'vs' : '@'} {raptors.next.opponent}</span>
							<span class="meta">{shortDate(raptors.next.date)}</span>
						</div>
						<span class="count">
							{daysAway(raptors.next.date) === 0 ? 'today' : `${daysAway(raptors.next.date)}d`}
						</span>
					</div>
				{/if}
				{#if raptors.last}
					<div class="line" class:dim={!!raptors.next}>
						{#if !raptors.next}<span class="ic nba"><Basketball size={16} /></span>{/if}
						<div class="text">
							<span class="title small">
								{raptors.last.win ? 'W' : 'L'}
								{raptors.last.score}
								{raptors.last.home ? 'vs' : '@'}
								{raptors.last.opponent}
							</span>
							{#if raptors.last.top}
								<span class="meta">
									{raptors.last.top.name} · {raptors.last.top.pts}p {raptors.last.top.reb}r {raptors.last.top.ast}a
								</span>
							{/if}
						</div>
						<span class="count">last</span>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</section>

<style>
	.stack {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.block {
		padding: 12px 16px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.dots {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 4px;
	}
	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--input);
		opacity: 0.45;
		flex: none;
	}
	.dot.past {
		background: var(--foreground);
		opacity: 0.75;
	}
	.dot.next {
		background: var(--kind-do);
		opacity: 1;
		transform: scale(1.3);
	}
	.round {
		font-family: var(--font-mono);
		font-size: 10px;
		color: var(--muted-2);
		margin-left: 6px;
	}
	.line {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.line :global(.f1) {
		flex: none;
		color: var(--kind-do);
	}
	.ic {
		display: inline-flex;
		flex: none;
	}
	.ic.nba {
		color: var(--ctx-content);
	}
	.line.dim {
		padding-left: 28px;
	}
	.text {
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
	.title.small {
		font-size: 13.5px;
	}
	.meta {
		font-size: 12px;
		color: var(--muted-2);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.count {
		margin-left: auto;
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--muted-foreground);
		flex: none;
	}
	.empty {
		color: var(--muted-2);
		font-size: 14px;
		margin: 0;
	}
</style>
