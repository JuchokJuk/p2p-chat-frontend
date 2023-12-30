<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { inscribe } from './inscribe';

	let resizeObserver: ResizeObserver;
	let container: HTMLDivElement;

	export let childCount: number;
	export let childAspectRatio: number;

	let rowCount: number;
	let columnCount: number;

	let itemWidth: number;
	let itemHeight: number;

	let positions: { x: number; y: number }[] = [];

	/*
		нати соседние точки системы
		{
			y = ceil(childCount / (ceil(x / childAspectRatio)))
			x = ceil(childCount / ceil(y)) * childAspectRatio
		}
		c пересечением вектора [container.width, container.height] с функцией y = childCount * childAspectRatio / x

		точки преобразовать в прямоугольники размера [x, y] и вписать в прямоугольник [containerWidth, containerHeight]
		
		прямоугольники поделить на y строк и x / childAspectRatio столбцов
		
		выбрать прямоугольник с наибольшим размером ячейки
	*/

	function calcPositions(childCount: number) {
		const containerPosition = container.getBoundingClientRect();

		const containerWidth = containerPosition.width;
		const containerHeight = containerPosition.height;

		if (containerHeight === 0 || containerWidth === 0) return;

		const containerAspectRatio = containerWidth / containerHeight;

		// get intersection

		const x = Math.sqrt(childCount * childAspectRatio * containerAspectRatio);
		const y = x / containerAspectRatio;

		// get points

		const lowerPoint = { x: 0, y: 0 };
		const upperPoint = { x: 0, y: 0 };

		if (containerAspectRatio > 1) {
			lowerPoint.y = ~~y;
			upperPoint.y = Math.ceil(y);

			if (lowerPoint.y) {
				lowerPoint.x = Math.ceil(childCount / Math.ceil(lowerPoint.y)) * childAspectRatio;
			}
			upperPoint.x = Math.ceil(childCount / Math.ceil(upperPoint.y)) * childAspectRatio;
		} else {
			lowerPoint.x = ~~(x / childAspectRatio) * childAspectRatio;
			upperPoint.x = Math.ceil(x / childAspectRatio) * childAspectRatio;

			if (lowerPoint.x) {
				lowerPoint.y = Math.ceil(childCount / Math.ceil(lowerPoint.x / childAspectRatio));
			}
			upperPoint.y = Math.ceil(childCount / Math.ceil(upperPoint.x / childAspectRatio));
		}

		// inscribe grids

		const inscribedUpperGrid = {
			height: 0,
			width: 0,
			rowCount: upperPoint.y,
			columnCount: upperPoint.x / childAspectRatio
		};

		[inscribedUpperGrid.width, inscribedUpperGrid.height] = inscribe(
			{ width: upperPoint.x, height: upperPoint.y },
			{ width: containerWidth, height: containerHeight },
			containerAspectRatio
		);

		if (lowerPoint.x && lowerPoint.y) {
			const inscribedLowerGrid = {
				height: 0,
				width: 0,
				rowCount: lowerPoint.y,
				columnCount: lowerPoint.x / childAspectRatio
			};

			[inscribedLowerGrid.width, inscribedLowerGrid.height] = inscribe(
				{ width: lowerPoint.x, height: lowerPoint.y },
				{ width: containerWidth, height: containerHeight },
				containerAspectRatio
			);

			var inscribedGrid =
				inscribedLowerGrid.width / inscribedLowerGrid.columnCount >
				inscribedUpperGrid.width / inscribedUpperGrid.columnCount
					? inscribedLowerGrid
					: inscribedUpperGrid;
		} else {
			var inscribedGrid = inscribedUpperGrid;
		}

		// calc positions

		rowCount = inscribedGrid.rowCount;
		columnCount = inscribedGrid.columnCount;

		itemHeight = inscribedGrid.height / rowCount;
		itemWidth = inscribedGrid.width / columnCount;

		const offsetX = containerWidth / 2 - inscribedGrid.width / 2;
		const offsetY = containerHeight / 2 - inscribedGrid.height / 2;

		positions = [];

		for (let i = 0; i < childCount; i++) {
			let rowIndex = ~~(i / columnCount);
			let columnIndex = i % columnCount;
			positions.push({
				x: columnIndex * itemWidth + offsetX,
				y: rowIndex * itemHeight + offsetY
			});
		}

		positions = positions;
	}

	$: {
		if (container) calcPositions(childCount);
	}

	onMount(() => {
		resizeObserver = new ResizeObserver(() => {
			calcPositions(childCount);
		});

		resizeObserver.observe(container);
	});

	onDestroy(() => {
		if (resizeObserver) {
			resizeObserver.disconnect();
		}
	});
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
