<script lang="ts">
	import type { Item } from '$lib/types';
	import ItemRow from './ItemRow.svelte';

	let { items }: { items: Item[] } = $props();

	// the urgent strip: everything flagged + all open `do` items
	const now = $derived(items.filter((i) => i.status === 'open' && (i.flagged || i.kind === 'do')));
</script>

{#if now.length}
	<section class="card">
		<span class="micro">Now</span>
		<div>
			{#each now as item (item.id)}
				<ItemRow {item} />
			{/each}
		</div>
	</section>
{/if}

<style>
	.card {
		background: var(--card);
		border-radius: var(--radius-lg);
		padding: 16px 20px;
		box-shadow: var(--shadow-sm);
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
</style>
