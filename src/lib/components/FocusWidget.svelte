<script lang="ts">
	// personal tagline under the greeting — click to edit, stored in config.focus
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
	<button class="tagline" class:placeholder={!focus} onclick={startEdit} title="click to edit">
		{focus || 'add a tagline…'}
	</button>
{/if}

<style>
	.tagline {
		background: none;
		border: none;
		padding: 0;
		text-align: left;
		cursor: text;
		font-family: var(--font-sans);
		font-size: 16px;
		line-height: 1.4;
		color: var(--muted-foreground);
		margin-top: 2px;
	}
	.tagline.placeholder {
		color: var(--muted-2);
	}
	input {
		font-size: 16px;
		padding: 0;
		border: none;
		border-bottom: 1px solid var(--border);
		border-radius: 0;
		background: none;
		color: var(--muted-foreground);
		margin-top: 2px;
		width: min(420px, 90%);
	}
	input:focus {
		outline: none;
	}
</style>
