<script lang="ts">
	// lucide-style basketball (lucide has no basketball icon) — circle, equator, two seams
	let { size = 16 }: { size?: number } = $props();
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	<circle cx="12" cy="12" r="10" />
	<path d="M2 12h20" />
	<path d="M7.4 4.8C9 7 9.9 9.4 9.9 12s-.9 5-2.5 7.2" />
	<path d="M16.6 4.8C15 7 14.1 9.4 14.1 12s.9 5 2.5 7.2" />
</svg>
