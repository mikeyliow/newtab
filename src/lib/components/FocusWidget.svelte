<script lang="ts">
	import { api } from '$lib/client/api';

	let { focus }: { focus: string } = $props();
	let editing = $state(false);
	let draft = $state('');

	function startEdit() {
		draft = focus;
		editing = true;
	}

	async function save() {
		editing = false;
		if (draft.trim() !== focus) await api.patchConfig({ focus: draft.trim() });
	}
</script>

<section>
	<span class="micro">Focus</span>
	{#if editing}
		<!-- svelte-ignore a11y_autofocus -->
		<input
			bind:value={draft}
			autofocus
			onblur={save}
			onkeydown={(e) => {
				if (e.key === 'Enter') save();
				if (e.key === 'Escape') editing = false;
			}}
		/>
	{:else}
		<button class="focus-line" onclick={startEdit} title="click to edit">
			{focus || 'Set a focus…'}
		</button>
	{/if}
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.focus-line {
		background: none;
		border: none;
		padding: 0;
		text-align: left;
		cursor: text;
		font-family: var(--font-sans);
		font-size: 28px;
		font-weight: 500;
		letter-spacing: var(--tracking-tight);
		line-height: 1.2;
		color: var(--foreground);
	}
	input {
		font-size: 28px;
		font-weight: 500;
		letter-spacing: var(--tracking-tight);
		padding: 0;
		border: none;
		border-bottom: 1px solid var(--border);
		border-radius: 0;
		background: none;
	}
	input:focus {
		outline: none;
	}
</style>
