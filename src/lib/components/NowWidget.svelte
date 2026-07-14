<script lang="ts">
	import type { Item } from '$lib/types';
	import ItemRow from './ItemRow.svelte';

	let { items }: { items: Item[] } = $props();

	// the urgent strip: everything flagged + all open `do` items
	const now = $derived(items.filter((i) => i.status === 'open' && (i.flagged || i.kind === 'do')));
</script>

{#if now.length}
	<section>
		<div class="widget-head"><h2>Now</h2></div>
		<div class="card body">
			{#each now as item (item.id)}
				<ItemRow {item} />
			{/each}
		</div>
	</section>
{/if}

<style>
	.body {
		padding: 8px 20px;
	}
</style>
