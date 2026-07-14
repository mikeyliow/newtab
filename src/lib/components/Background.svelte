<script lang="ts">
	// drifting pastel gradient blobs + a two-glow trail that follows the cursor + film grain.
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
	<div class="blob b4"></div>
	<div class="blob b5"></div>
	<div class="blob b6"></div>
	<div class="chaser c1"></div>
	<div class="chaser c2"></div>
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
		filter: blur(64px);
		will-change: transform;
	}

	/* toned-down pastels on near-white — enough colour to feel alive, never loud */
	.b1 {
		width: 52vmax;
		left: -14vmax;
		top: -16vmax;
		background: radial-gradient(circle at 35% 35%, #f6dfc4 0%, transparent 66%);
		animation: drift-1 13s ease-in-out infinite alternate;
	}
	.b2 {
		width: 44vmax;
		right: -8vmax;
		top: -6vmax;
		background: radial-gradient(circle at 60% 40%, #f3d7cf 0%, transparent 64%);
		animation: drift-2 17s ease-in-out infinite alternate;
	}
	.b3 {
		width: 48vmax;
		left: 14vmax;
		bottom: -20vmax;
		background: radial-gradient(circle at 50% 50%, #dbe5d3 0%, transparent 66%);
		animation: drift-3 15s ease-in-out infinite alternate;
	}
	.b4 {
		width: 40vmax;
		right: 4vmax;
		bottom: -10vmax;
		background: radial-gradient(circle at 45% 55%, #d7e0e8 0%, transparent 64%);
		animation: drift-4 19s ease-in-out infinite alternate;
	}
	.b5 {
		width: 34vmax;
		left: 34vmax;
		top: 6vmax;
		background: radial-gradient(circle at 50% 40%, #efe3f0 0%, transparent 62%);
		animation: drift-5 10s ease-in-out infinite alternate;
	}
	.b6 {
		width: 30vmax;
		left: -4vmax;
		top: 32vmax;
		background: radial-gradient(circle at 50% 50%, #f2ecd7 0%, transparent 62%);
		animation: drift-6 8s ease-in-out infinite alternate;
	}

	/* the interactive bit: a warm glow chases the cursor, a cooler one lags behind it */
	.c1 {
		width: 38vmax;
		left: var(--mx);
		top: var(--my);
		translate: -50% -50%;
		background: radial-gradient(circle, #f7e2c4 0%, transparent 60%);
		opacity: 0.85;
		transition:
			left 0.9s cubic-bezier(0.2, 0.8, 0.2, 1),
			top 0.9s cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	.c2 {
		width: 26vmax;
		left: var(--mx);
		top: var(--my);
		translate: -50% -50%;
		background: radial-gradient(circle, #e4dcec 0%, transparent 58%);
		opacity: 0.6;
		transition:
			left 2.4s cubic-bezier(0.2, 0.8, 0.2, 1),
			top 2.4s cubic-bezier(0.2, 0.8, 0.2, 1);
	}

	@media (prefers-color-scheme: dark) {
		.b1 {
			background: radial-gradient(circle at 35% 35%, #2c2418 0%, transparent 66%);
		}
		.b2 {
			background: radial-gradient(circle at 60% 40%, #2c211e 0%, transparent 64%);
		}
		.b3 {
			background: radial-gradient(circle at 50% 50%, #202619 0%, transparent 66%);
		}
		.b4 {
			background: radial-gradient(circle at 45% 55%, #1d2329 0%, transparent 64%);
		}
		.b5 {
			background: radial-gradient(circle at 50% 40%, #271f2a 0%, transparent 62%);
		}
		.b6 {
			background: radial-gradient(circle at 50% 50%, #262415 0%, transparent 62%);
		}
		.c1 {
			background: radial-gradient(circle, #322a1c 0%, transparent 60%);
			opacity: 0.95;
		}
		.c2 {
			background: radial-gradient(circle, #262031 0%, transparent 58%);
			opacity: 0.7;
		}
	}

	/* fine film grain so the gradients don't band */
	.grain {
		position: absolute;
		inset: 0;
		opacity: 0.05;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
	}

	/* every blob travels its own curvy orbit at its own pace — mid keyframes bend the path
	   so the motion reads as wandering, not a back-and-forth slide */
	@keyframes drift-1 {
		33% {
			transform: translate(10vmax, 16vmax) rotate(25deg) scale(1.08);
		}
		66% {
			transform: translate(22vmax, 6vmax) rotate(45deg) scale(1.22);
		}
		100% {
			transform: translate(12vmax, 20vmax) rotate(70deg) scale(1.05);
		}
	}
	@keyframes drift-2 {
		33% {
			transform: translate(-16vmax, 6vmax) rotate(-20deg) scale(1.12);
		}
		66% {
			transform: translate(-8vmax, 20vmax) rotate(-50deg) scale(0.88);
		}
		100% {
			transform: translate(-24vmax, 12vmax) rotate(-70deg) scale(1.02);
		}
	}
	@keyframes drift-3 {
		33% {
			transform: translate(16vmax, -8vmax) rotate(20deg) scale(1.16);
		}
		66% {
			transform: translate(6vmax, -18vmax) rotate(50deg) scale(0.94);
		}
		100% {
			transform: translate(20vmax, -14vmax) rotate(80deg) scale(1.12);
		}
	}
	@keyframes drift-4 {
		33% {
			transform: translate(-10vmax, -12vmax) rotate(-30deg) scale(1.1);
		}
		66% {
			transform: translate(-20vmax, -2vmax) rotate(-60deg) scale(0.9);
		}
		100% {
			transform: translate(-14vmax, -16vmax) rotate(-90deg) scale(1.08);
		}
	}
	@keyframes drift-5 {
		33% {
			transform: translate(-14vmax, 10vmax) rotate(40deg) scale(1.2);
		}
		66% {
			transform: translate(-24vmax, -4vmax) rotate(80deg) scale(0.9);
		}
		100% {
			transform: translate(-10vmax, 16vmax) rotate(120deg) scale(1.28);
		}
	}
	@keyframes drift-6 {
		33% {
			transform: translate(12vmax, -10vmax) rotate(-15deg) scale(1.15);
		}
		66% {
			transform: translate(22vmax, 2vmax) rotate(-40deg) scale(0.82);
		}
		100% {
			transform: translate(14vmax, -12vmax) rotate(-60deg) scale(1.05);
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
