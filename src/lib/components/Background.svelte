<script lang="ts">
	// slow-drifting warm gradient blobs + a glow that trails the cursor + film grain.
	// pure CSS animation; shown when no wallpaper is set. aria-hidden, purely decorative.
	let mx = $state(60);
	let my = $state(30);

	function onMove(e: PointerEvent) {
		mx = (e.clientX / window.innerWidth) * 100;
		my = (e.clientY / window.innerHeight) * 100;
	}
</script>

<svelte:window onpointermove={onMove} />

<div class="bg" aria-hidden="true" style:--mx="{mx}%" style:--my="{my}%">
	<div class="blob b1"></div>
	<div class="blob b2"></div>
	<div class="blob b3"></div>
	<div class="chaser"></div>
	<div class="grain"></div>
</div>

<style>
	.bg {
		position: fixed;
		inset: 0;
		z-index: -1;
		overflow: hidden;
	}

	.blob,
	.chaser {
		position: absolute;
		aspect-ratio: 1;
		border-radius: 50%;
		filter: blur(70px);
		will-change: transform;
	}

	/* warm neutrals only — the titan palette, just set in motion */
	.b1 {
		width: 60vmax;
		left: -12vmax;
		top: -18vmax;
		background: radial-gradient(circle at 35% 35%, #e8dcc9 0%, transparent 68%);
		animation: drift-1 34s ease-in-out infinite alternate;
	}
	.b2 {
		width: 52vmax;
		right: -10vmax;
		top: 4vmax;
		background: radial-gradient(circle at 60% 40%, #f0dfd2 0%, transparent 66%);
		animation: drift-2 46s ease-in-out infinite alternate;
	}
	.b3 {
		width: 56vmax;
		left: 18vmax;
		bottom: -24vmax;
		background: radial-gradient(circle at 50% 50%, #ddd6c9 0%, transparent 70%);
		animation: drift-3 40s ease-in-out infinite alternate;
	}

	/* the interactive bit: a soft glow that lazily follows the cursor */
	.chaser {
		width: 44vmax;
		left: var(--mx);
		top: var(--my);
		translate: -50% -50%;
		background: radial-gradient(circle, #f3e3cf 0%, transparent 62%);
		opacity: 0.75;
		transition:
			left 2.4s cubic-bezier(0.2, 0.8, 0.2, 1),
			top 2.4s cubic-bezier(0.2, 0.8, 0.2, 1);
	}

	@media (prefers-color-scheme: dark) {
		.b1 {
			background: radial-gradient(circle at 35% 35%, #262219 0%, transparent 68%);
		}
		.b2 {
			background: radial-gradient(circle at 60% 40%, #2a231c 0%, transparent 66%);
		}
		.b3 {
			background: radial-gradient(circle at 50% 50%, #201f1a 0%, transparent 70%);
		}
		.chaser {
			background: radial-gradient(circle, #2d2820 0%, transparent 62%);
			opacity: 0.9;
		}
	}

	/* fine film grain so the gradients don't band */
	.grain {
		position: absolute;
		inset: 0;
		opacity: 0.05;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
	}

	@keyframes drift-1 {
		from {
			transform: translate(0, 0) scale(1);
		}
		to {
			transform: translate(14vmax, 10vmax) scale(1.15);
		}
	}
	@keyframes drift-2 {
		from {
			transform: translate(0, 0) scale(1.1);
		}
		to {
			transform: translate(-16vmax, 14vmax) scale(0.92);
		}
	}
	@keyframes drift-3 {
		from {
			transform: translate(0, 0) scale(0.95);
		}
		to {
			transform: translate(-10vmax, -12vmax) scale(1.12);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.blob {
			animation: none;
		}
		.chaser {
			transition: none;
		}
	}
</style>
