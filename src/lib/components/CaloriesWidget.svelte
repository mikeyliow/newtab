<script lang="ts">
	import type { Meal } from '$lib/types';
	import { api } from '$lib/client/api';
	import { Plus, X } from '@lucide/svelte';

	let {
		meals,
		totals,
		target
	}: {
		meals: Meal[];
		totals: { kcal: number; p: number; c: number; f: number };
		target: number | null;
	} = $props();

	let adding = $state(false);
	let name = $state('');
	let kcal = $state('');
	let p = $state('');
	let c = $state('');
	let f = $state('');
	let saving = $state(false);

	async function add(e: SubmitEvent) {
		e.preventDefault();
		if (!name.trim() || !kcal || saving) return;
		saving = true;
		try {
			await api.logMeal({ name, kcal: +kcal, p: +p || 0, c: +c || 0, f: +f || 0 });
			name = kcal = p = c = f = '';
			adding = false;
		} finally {
			saving = false;
		}
	}
</script>

<section>
	<div class="widget-head">
		<h2>Calories today</h2>
		<button class="soft push" onclick={() => (adding = !adding)}>
			<Plus size={14} /> Log
		</button>
	</div>

	<div class="card body">
		<div class="metrics">
			<div class="metric main">
				<span class="value">{totals.kcal}</span>
				<span class="micro">{target ? `/ ${target} kcal` : 'kcal'}</span>
			</div>
			<div class="metric">
				<span class="value">{Math.round(totals.p)}g</span>
				<span class="micro">Protein</span>
			</div>
			<div class="metric">
				<span class="value">{Math.round(totals.c)}g</span>
				<span class="micro">Carbs</span>
			</div>
			<div class="metric">
				<span class="value">{Math.round(totals.f)}g</span>
				<span class="micro">Fat</span>
			</div>
		</div>

		{#if target}
			<div class="bar" role="progressbar" aria-valuenow={totals.kcal} aria-valuemax={target}>
				<div class="fill" style:width="{Math.min(100, (totals.kcal / target) * 100)}%"></div>
			</div>
		{/if}

		{#if adding}
			<form onsubmit={add}>
				<!-- svelte-ignore a11y_autofocus -->
				<input class="grow" bind:value={name} placeholder="what did you eat?" autofocus />
				<input type="number" bind:value={kcal} placeholder="kcal" min="0" required />
				<input type="number" bind:value={p} placeholder="P" min="0" />
				<input type="number" bind:value={c} placeholder="C" min="0" />
				<input type="number" bind:value={f} placeholder="F" min="0" />
				<button class="pill" type="submit" disabled={saving}>Log</button>
			</form>
		{/if}

		{#if meals.length}
			<ul>
				{#each meals as meal (meal.id)}
					<li>
						<span class="meal-name">{meal.name}</span>
						<span class="meal-kcal">{meal.kcal} kcal</span>
						<button class="ghost" onclick={() => api.removeMeal(meal.id)} aria-label="remove meal">
							<X size={13} />
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</section>

<style>
	.push {
		margin-left: auto;
	}
	.body {
		padding: 18px 20px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.metrics {
		display: flex;
		gap: 32px;
		flex-wrap: wrap;
	}
	.metric {
		display: flex;
		flex-direction: column;
	}
	.value {
		font-size: 24px;
		font-weight: 500;
		letter-spacing: var(--tracking-tight);
	}
	.main .value {
		font-size: 32px;
	}
	.bar {
		height: 4px;
		border-radius: 2px;
		background: var(--accent);
		overflow: hidden;
	}
	.fill {
		height: 100%;
		background: var(--foreground);
		border-radius: 2px;
	}
	form {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		background: var(--muted);
		padding: 12px;
		border-radius: var(--radius-md);
	}
	form input {
		font-size: 14px;
		padding: 6px 10px;
	}
	form input[type='number'] {
		width: 70px;
	}
	.grow {
		flex: 1;
		min-width: 140px;
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
	}
	li {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 4px 0;
		font-size: 14px;
		border-bottom: 1px solid color-mix(in srgb, var(--border) 45%, transparent);
	}
	li:last-child {
		border-bottom: none;
	}
	li .ghost {
		opacity: 0;
	}
	li:hover .ghost {
		opacity: 1;
	}
	.meal-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.meal-kcal {
		margin-left: auto;
		color: var(--muted-foreground);
		flex: none;
	}
</style>
