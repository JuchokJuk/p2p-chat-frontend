<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	let resizeObserver: ResizeObserver;
	let container: HTMLDivElement;

	export let childCount: number;
	export let childAspectRatio: number;

	let rowCount: number;
	let columnCount: number;

	let itemWidth: number;
	let itemHeight: number;

	let positions: { x: number; y: number }[] = [];

	function getDimensions(childCount: number) {
		const containerPosition = container.getBoundingClientRect();

		const grids = [];

		let gridColumnCount = childCount;

		for (let gridHeight = 1; gridHeight <= childCount; gridHeight++) {
			for (let gridWidth = 1; gridWidth <= gridColumnCount; gridWidth++) {
				if (gridWidth === gridColumnCount) gridColumnCount--; // skip too large grids

				const area = gridHeight * gridWidth;
				const emptyCells = area - childCount;

				if (
					(emptyCells < gridHeight && emptyCells < gridWidth && area >= childCount) ||
					childCount === area
				) {
					grids.push({ columnCount: gridWidth, rowCount: gridHeight, area });
				}
			}
		}

		const containerWidth = containerPosition.width;
		const containerHeight = containerPosition.height;

		const inscribedGrids = [];

		for (const rectangle of grids) {
			const inscribedGrid = {
				columnCount: rectangle.columnCount,
				rowCount: rectangle.rowCount,
				width: rectangle.columnCount * childAspectRatio,
				height: rectangle.rowCount,
				area: 0
			};

			const containerAspectRatio = containerWidth / containerHeight;
			const inscribedGridAspectRatio = inscribedGrid.width / inscribedGrid.height;

			if (containerAspectRatio >= inscribedGridAspectRatio) {
				const inscribedGridHeight = inscribedGrid.height;
				inscribedGrid.height *= containerHeight / inscribedGridHeight;
				inscribedGrid.width *= containerHeight / inscribedGridHeight;
			} else {
				const inscribedGridWidth = inscribedGrid.width;
				inscribedGrid.width *= containerWidth / inscribedGridWidth;
				inscribedGrid.height *= containerWidth / inscribedGridWidth;
			}
			inscribedGrid.area = inscribedGrid.height * inscribedGrid.width;
			inscribedGrids.push(inscribedGrid);
		}

		const bestFitGrid = inscribedGrids.reduce((prev, curr) =>
			prev.area > curr.area ? prev : curr
		);

		rowCount = bestFitGrid.rowCount;
		columnCount = bestFitGrid.columnCount;
		itemHeight = bestFitGrid.height / rowCount;
		itemWidth = bestFitGrid.width / columnCount;

		const bestFitGridCenter = {
			x: bestFitGrid.width / 2,
			y: bestFitGrid.height / 2
		};
		const containerCenter = {
			x: containerWidth / 2,
			y: containerHeight / 2
		};
		const offsetX = containerCenter.x - bestFitGridCenter.x;
		const offsetY = containerCenter.y - bestFitGridCenter.y;

		positions = [];
		for (let i = 0; i < childCount; i++) {
			let rowIndex = Math.floor(i / columnCount);
			let columnIndex = i % columnCount;
			positions.push({
				x: columnIndex * itemWidth + offsetX,
				y: rowIndex * itemHeight + offsetY
			});
		}
		positions = positions;
	}

	onMount(() => {
		resizeObserver = new ResizeObserver(() => {
			getDimensions(childCount);
		});

		resizeObserver.observe(container);
	});

	onDestroy(() => {
		if (resizeObserver) {
			resizeObserver.disconnect();
		}
	});

	$: {
		if (container) getDimensions(childCount);
	}
</script>

<div class="container" bind:this={container}>
	<slot {itemWidth} {itemHeight} {positions} />
</div>

<style lang="scss">
	.container {
		height: 100%;
		position: relative;
	}
</style>
