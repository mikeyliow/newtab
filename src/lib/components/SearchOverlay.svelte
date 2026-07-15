<script lang="ts">
	// type-to-search, like Chrome's default new tab: start typing anywhere (outside a field)
	// and a Google search bar appears with your keystrokes. Enter searches, Escape dismisses.
	import { Search } from '@lucide/svelte';
	import { tick } from 'svelte';

	let open = $state(false);
	let query = $state('');
	let inputEl = $state<HTMLInputElement | null>(null);

	async function onKeydown(e: KeyboardEvent) {
		if (open || e.metaKey || e.ctrlKey || e.altKey) return;
		if (e.key.length !== 1 || e.key === ' ') return; // printable characters only
		const t = e.target as HTMLElement | null;
		if (t?.closest?.('input, textarea, select, [contenteditable]')) return;
		e.preventDefault();
		query = e.key;
		open = true;
		await tick();
		inputEl?.focus();
		inputEl?.setSelectionRange(query.length, query.length);
	}

	function dismiss() {
		open = false;
		query = '';
	}

	function submit() {
		if (!query.trim()) return dismiss();
		window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query.trim())}`;
	}
</script>

<svelte:window onkeydown={onKeydown} onclick={dismiss} />

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div class="search card" onclick={(e) => e.stopPropagation()}>
		<Search size={18} aria-hidden="true" />
		<input
			bind:this={inputEl}
			bind:value={query}
			placeholder="search Google…"
			onkeydown={(e) => {
				if (e.key === 'Enter') submit();
				if (e.key === 'Escape') dismiss();
			}}
			onblur={() => {
				if (!query.trim()) dismiss();
			}}
		/>
		<span class="hint">↵</span>
	</div>
{/if}

<style>
	.search {
		position: fixed;
		top: 16%;
		left: 50%;
		translate: -50% 0;
		z-index: 40;
		display: flex;
		align-items: center;
		gap: 12px;
		width: min(600px, 86vw);
		padding: 16px 20px;
		box-shadow: var(--shadow-lg, var(--shadow-md));
	}
	.search > :global(svg) {
		flex: none;
		color: var(--muted-foreground);
	}
	input {
		flex: 1;
		border: none;
		background: none;
		padding: 0;
		font-size: 18px;
		color: var(--foreground);
	}
	input:focus {
		outline: none;
	}
	.hint {
		font-family: var(--font-mono);
		font-size: 13px;
		color: var(--muted-2);
		flex: none;
	}
</style>
