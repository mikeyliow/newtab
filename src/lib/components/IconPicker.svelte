<script lang="ts">
	import { ICONS, ICON_NAMES } from '$lib/icons';

	let {
		value = null,
		allowNone = false,
		onpick
	}: {
		value?: string | null;
		allowNone?: boolean;
		onpick: (name: string | null) => void;
	} = $props();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="picker card" onclick={(e) => e.stopPropagation()}>
	{#if allowNone}
		<button class="cell none" class:sel={!value} onclick={() => onpick(null)} title="auto (favicon)">
			auto
		</button>
	{/if}
	{#each ICON_NAMES as name (name)}
		{@const Icon = ICONS[name]}
		<button class="cell" class:sel={name === value} onclick={() => onpick(name)} title={name}>
			<Icon size={15} />
		</button>
	{/each}
</div>

<style>
	.picker {
		position: absolute;
		z-index: 30;
		top: calc(100% + 6px);
		left: 0;
		display: grid;
		grid-template-columns: repeat(8, 28px);
		gap: 2px;
		padding: 8px;
		box-shadow: var(--shadow-md);
	}
	.cell {
		width: 28px;
		height: 28px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		border-radius: var(--radius-sm);
		color: var(--muted-foreground);
		cursor: pointer;
	}
	.cell:hover {
		background: var(--muted);
		color: var(--foreground);
	}
	.cell.sel {
		background: var(--foreground);
		color: var(--background);
	}
	.cell.none {
		grid-column: span 2;
		width: auto;
		font-family: var(--font-mono);
		font-size: 10px;
		text-transform: uppercase;
	}
</style>
