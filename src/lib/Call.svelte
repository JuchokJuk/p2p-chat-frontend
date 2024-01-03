<script lang="ts">
	import Video from './Video.svelte';
	import type Peer from 'peerjs';

	export let peer: Peer;
	export let receiverPeerUUID: string;

	export let stream: MediaStream;

	let video: HTMLVideoElement;

	function start() {
		peer.call(receiverPeerUUID, stream);

		peer.on('call', (mediaConnection) => {
			mediaConnection.answer(stream);
			mediaConnection.on('stream', async (remoteStream) => {
				video.srcObject = remoteStream;
			});
		});
	}
</script>

<Video bind:video onMountCallback={start} />
