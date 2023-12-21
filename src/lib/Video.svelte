<script lang="ts">
	export let video: HTMLVideoElement;
	export let mirrored: boolean | undefined = false;
	export let muted: boolean | undefined = false;
</script>

<div class="container">
	<video bind:this={video} playsinline autoplay class:mirrored {muted}>
		<track kind="captions" />
	</video>
</div>

<style lang="scss">
	.container {
		padding: 16px;
		width: 100%;
		height: 100%;
		video {
			background: rgb(236, 236, 236);
			border-radius: 8px;
			object-fit: cover;
			width: 100%;
			height: 100%;
			display: block;
			&.mirrored {
				transform: scaleX(-1);
			}
		}
	}
</style>
