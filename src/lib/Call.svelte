<script lang="ts">
	import { onMount } from 'svelte';
	import Video from './Video.svelte';
	import type { Connection } from './Connection';

	export let connection: Connection;
	export let stream: MediaStream;

	let video: HTMLVideoElement;

	onMount(() => {
		connection.sender.peer!.call(connection.receiver.peerUUID!, stream);

		connection.sender.peer!.on('call', (call) => {
			call.answer(stream);
			call.on('stream', async (remoteStream) => {
				video.srcObject = remoteStream;
			});
		});
	});
</script>

<Video bind:video />
