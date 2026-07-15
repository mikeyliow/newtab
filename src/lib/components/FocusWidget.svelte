<script lang="ts">
	// status line under the greeting — icon (pickable) + editable text, stored in config.focus / focus_icon
	import { api } from '$lib/client/api';
	import { ICONS } from '$lib/icons';
	import IconPicker from './IconPicker.svelte';
	import { CircleDashed } from '@lucide/svelte';

	let { focus, icon }: { focus: string; icon: string } = $props();
	let editing = $state(false);
	let draft = $state('');
	let pickerOpen = $state(false);

	const Ico = $derived(ICONS[icon] ?? null);

	function startEdit() {
		draft = focus;
		editing = true;
	}

	async function save() {
		editing = false;
		if (draft.trim() !== focus) await api.patchConfig({ focus: draft.trim() });
	}

	async function pick(name: string | null) {
		pickerOpen = false;
		await api.patchConfig({ focus_icon: name ?? '' });
	}
</script>

<svelte:window onclick={() => (pickerOpen = false)} />

<div class="status">
	<span class="icon-wrap">
		<button
			class="ghost icon-btn"
			onclick={(e) => {
				e.stopPropagation();
				pickerOpen = !pickerOpen;
			}}
			aria-label="change status icon"
			title="change icon"
		>
			{#if Ico}<Ico size={15} />{:else}<CircleDashed size={15} />{/if}
		</button>
		{#if pickerOpen}
			<IconPicker value={icon || null} onpick={pick} />
		{/if}
	</span>
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
		<button class="text" class:placeholder={!focus} onclick={startEdit} title="click to edit">
			{focus || 'set a status…'}
		</button>
	{/if}
</div>

<style>
	.status {
		display: flex;
		align-items: center;
		gap: 7px;
		margin-top: 4px;
	}
	.icon-wrap {
		position: relative;
		display: inline-flex;
	}
	.icon-btn {
		color: var(--muted-foreground);
		padding: 3px;
	}
	.text {
		background: none;
		border: none;
		padding: 0;
		text-align: left;
		cursor: text;
		font-family: var(--font-sans);
		font-size: 15px;
		line-height: 1.4;
		color: var(--muted-foreground);
	}
	.text.placeholder {
		color: var(--muted-2);
	}
	input {
		font-size: 15px;
		padding: 0;
		border: none;
		border-bottom: 1px solid var(--border);
		border-radius: 0;
		background: none;
		color: var(--muted-foreground);
		width: min(420px, 80vw);
	}
	input:focus {
		outline: none;
	}
</style>
