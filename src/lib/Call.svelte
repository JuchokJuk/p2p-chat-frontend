<script lang="ts">
	import Video from './Video.svelte';
	import type Peer from 'peerjs';

	export let peer: Peer;
	export let receiverPeerUUID: string;

	export let stream: MediaStream;

	let video: HTMLVideoElement;

	function start() {
		const mediaConnection = peer.call(receiverPeerUUID, stream);

		mediaConnection.on('stream', (remoteStream)=>{
			video.srcObject = remoteStream;
		})
	}
</script>

<Video bind:video onMountCallback={start} />
