<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
</script>

<svelte:head><title>newtab — login</title></svelte:head>

<main>
	<form method="POST" use:enhance>
		<span class="label">NEWTAB</span>
		<!-- svelte-ignore a11y_autofocus -->
		<input
			type="password"
			name="passcode"
			placeholder="passcode"
			autofocus
			autocomplete="current-password"
		/>
		{#if form?.wrong}<p class="error">wrong passcode</p>{/if}
		<button type="submit">Enter</button>
	</form>
</main>

<style>
	main {
		min-height: 100dvh;
		display: grid;
		place-items: center;
	}
	form {
		display: flex;
		flex-direction: column;
		gap: 16px;
		width: min(320px, 90vw);
		background: var(--card);
		padding: 32px;
		border-radius: 20px;
		box-shadow: var(--shadow);
	}
	.label {
		font-family: var(--font-mono);
		font-size: 13px;
		letter-spacing: 0.04em;
		color: var(--muted-foreground);
	}
	input {
		font: inherit;
		padding: 10px 14px;
		border: 1px solid var(--input);
		border-radius: 12px;
		background: var(--background);
		color: var(--foreground);
	}
	input:focus {
		outline: 2px solid var(--ring);
		outline-offset: 1px;
	}
	button {
		font-family: var(--font-sans);
		font-size: 13px;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		background: var(--primary);
		color: var(--primary-foreground);
		border: none;
		border-radius: 9999px;
		padding: 12px 24px;
		cursor: pointer;
	}
	.error {
		color: var(--destructive);
		font-size: 14px;
		margin: 0;
	}
</style>
