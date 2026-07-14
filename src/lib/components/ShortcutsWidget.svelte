<script lang="ts">
	import type { Shortcut } from '$lib/types';
	import { ArrowUpRight } from '@lucide/svelte';

	let { shortcuts }: { shortcuts: Shortcut[] } = $props();
</script>

{#if shortcuts.length}
	<section>
		<span class="micro">Shortcuts</span>
		<nav>
			{#each shortcuts as s (s.id)}
				<a href={s.url} class="shortcut">
					{s.label}
					<ArrowUpRight size={13} aria-hidden="true" />
				</a>
			{/each}
		</nav>
	</section>
{/if}

<style>
	section {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	nav {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.shortcut {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		text-decoration: none;
		font-size: 14px;
		background: var(--card);
		border: 1px solid color-mix(in srgb, var(--border) 55%, transparent);
		border-radius: var(--radius-pill);
		padding: 6px 14px;
	}
	.shortcut:hover {
		background: var(--accent);
	}
	.shortcut :global(svg) {
		color: var(--muted-2);
	}
</style>
