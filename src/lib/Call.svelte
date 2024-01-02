<script lang="ts">
	import { onMount } from 'svelte';
	import Video from './Video.svelte';
	import type Peer from 'peerjs';

	export let peer: Peer;
	export let receiverPeerUUID: string;

	export let stream: MediaStream;

	let video: HTMLVideoElement;

	onMount(() => {
		peer.call(receiverPeerUUID, stream);

		peer.on('call', (call) => {
			call.answer(stream);
			call.on('stream', async (remoteStream) => {
				video.srcObject = remoteStream;
			});
		});
	});
</script>

<Video bind:video />
