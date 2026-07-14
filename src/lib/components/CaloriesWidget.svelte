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

	// macro mini-bars show each macro's share of calories (4/4/9 kcal per gram)
	const macros = $derived.by(() => {
		const pk = totals.p * 4;
		const ck = totals.c * 4;
		const fk = totals.f * 9;
		const sum = pk + ck + fk || 1;
		return [
			{ label: 'Protein', grams: Math.round(totals.p), share: (pk / sum) * 100, cls: 'm-p' },
			{ label: 'Carbs', grams: Math.round(totals.c), share: (ck / sum) * 100, cls: 'm-c' },
			{ label: 'Fat', grams: Math.round(totals.f), share: (fk / sum) * 100, cls: 'm-f' }
		];
	});

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
		<h2>Calories</h2>
		<button class="soft push" onclick={() => (adding = !adding)}>
			<Plus size={14} /> Log
		</button>
	</div>

	<div class="card body">
		<div class="kcal-line">
			<span class="num">{totals.kcal}</span>
			<span class="of">{target ? `/ ${target} kcal` : 'kcal today'}</span>
		</div>
		{#if target}
			<div class="bar main" role="progressbar" aria-valuenow={totals.kcal} aria-valuemax={target}>
				<div
					class="fill m-kcal"
					class:over={totals.kcal > target}
					style:width="{Math.min(100, (totals.kcal / target) * 100)}%"
				></div>
			</div>
		{/if}

		<div class="macros">
			{#each macros as m (m.label)}
				<div class="macro">
					<span class="m-line"><span class="m-label">{m.label}</span><b>{m.grams}g</b></span>
					<div class="bar mini">
						<div class="fill {m.cls}" style:width="{m.share}%"></div>
					</div>
				</div>
			{/each}
		</div>

		{#if adding}
			<form onsubmit={add}>
				<!-- svelte-ignore a11y_autofocus -->
				<input class="grow" bind:value={name} placeholder="what did you eat?" autofocus />
				<div class="nums">
					<input type="number" bind:value={kcal} placeholder="kcal" min="0" required />
					<input type="number" bind:value={p} placeholder="P" min="0" />
					<input type="number" bind:value={c} placeholder="C" min="0" />
					<input type="number" bind:value={f} placeholder="F" min="0" />
				</div>
				<button class="pill" type="submit" disabled={saving}>Log</button>
			</form>
		{/if}

		{#if meals.length}
			<ul>
				{#each meals as meal (meal.id)}
					<li>
						<span class="meal-name">{meal.name}</span>
						<span class="meal-kcal">{meal.kcal}</span>
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
		padding: 16px 18px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.kcal-line {
		display: flex;
		align-items: baseline;
		gap: 8px;
	}
	.num {
		font-size: 22px;
		font-weight: 500;
		letter-spacing: var(--tracking-tight);
	}
	.of {
		font-family: var(--font-mono);
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--muted-2);
	}
	.bar {
		border-radius: 3px;
		background: var(--muted);
		overflow: hidden;
	}
	.bar.main {
		height: 6px;
	}
	.bar.mini {
		height: 4px;
	}
	.fill {
		height: 100%;
		border-radius: 3px;
		transition: width 0.4s ease;
	}
	.m-kcal {
		background: var(--foreground);
	}
	.m-kcal.over {
		background: var(--destructive);
	}
	.macros {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 12px;
	}
	.macro {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}
	.m-line {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		font-size: 12px;
	}
	.m-label {
		color: var(--muted-2);
	}
	.m-line b {
		font-weight: 500;
		font-size: 13px;
	}
	.m-p {
		background: var(--macro-p);
	}
	.m-c {
		background: var(--macro-c);
	}
	.m-f {
		background: var(--macro-f);
	}
	form {
		display: flex;
		flex-direction: column;
		gap: 8px;
		background: var(--muted);
		padding: 10px;
		border-radius: var(--radius-md);
	}
	form input {
		font-size: 13px;
		padding: 6px 8px;
	}
	.nums {
		display: grid;
		grid-template-columns: 1.4fr 1fr 1fr 1fr;
		gap: 6px;
	}
	.nums input {
		width: 100%;
		min-width: 0;
	}
	.pill {
		align-self: flex-start;
		padding: 6px 16px;
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
		padding: 6px 0;
		font-size: 13px;
		border-bottom: 1px solid color-mix(in srgb, var(--border) 45%, transparent);
	}
	li:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}
	li .ghost {
		opacity: 0;
		padding: 2px;
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
		color: var(--muted-2);
		flex: none;
	}
</style>
