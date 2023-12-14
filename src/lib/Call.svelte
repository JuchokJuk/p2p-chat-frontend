<script lang="ts">
	import { onMount } from 'svelte';
	import type { Connection } from '../stores/user';

	export let connection: Connection;
	export let stream: MediaStream;

	let video: HTMLVideoElement;

	onMount(() => {
		connection.sender.peer!.call(connection.receiver.peerUUID!, stream);

		connection.sender.peer!.on('call', (call) => {
			call.answer(stream);
			call.on('stream', (remoteStream) => {
				video.srcObject = remoteStream;
				video.play();
			});
		});
	});
</script>

<video bind:this={video} width={256} height={256} playsinline autoplay>
	<track kind="captions" />
</video>

<style>
	video {
		background: rgb(236, 236, 236);
		object-fit: cover;
		border-radius: 8px;
	}
</style>
