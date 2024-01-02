<script lang="ts">
	import { scale } from 'svelte/transition';
	import Animation from './Animation';
	import { browser } from '$app/environment';
	import { onDestroy } from 'svelte';

	export let width: number;
	export let height: number;
	export let x: number;
	export let y: number;

	let currentWidth = width;
	let currentHeight = height;
	let currentX = x;
	let currentY = y;

	const widthAnimation = new Animation(3, 1, width, 0.001, (value) => {
		currentWidth = value;
	});
	const heightAnimation = new Animation(3, 1, height, 0.001, (value) => {
		currentHeight = value;
	});
	const xAnimation = new Animation(3, 1, x, 0.001, (value) => {
		currentX = value;
	});
	const yAnimation = new Animation(3, 1, y, 0.001, (value) => {
		currentY = value;
	});

	$: if (browser) {
		widthAnimation.animate(width);
		heightAnimation.animate(height);
		xAnimation.animate(x);
		yAnimation.animate(y);
	}

	onDestroy(() => {
		widthAnimation.destroy();
		heightAnimation.destroy();
		xAnimation.destroy();
		yAnimation.destroy();
	});
</script>

<div
	class="container"
	style="width: {currentWidth}px; height: {currentHeight}px; transform: translate({currentX}px, {currentY}px);"
>
	<div class="cell" transition:scale|global={{ start: 0.9, duration: 100 }}>
		<slot />
	</div>
</div>

<style lang="scss">
	.container {
		position: absolute;
		.cell {
			height: 100%;
		}
	}
</style>
