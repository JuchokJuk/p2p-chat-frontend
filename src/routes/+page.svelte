<script lang="ts">
	import { onMount } from 'svelte';

	import { send } from '$lib/send';

	import BestFitLayout from '$lib/BestFitLayout.svelte';
	import Call from '$lib/Call.svelte';
	import Video from '$lib/Video.svelte';
	import Card from '$lib/Card.svelte';

	import Peer from 'peerjs';

	import type { Connection } from '$lib/Connection';

	import { PUBLIC_PEER_SERVER_HOST } from '$env/static/public';
	import { PUBLIC_PEER_SERVER_PORT } from '$env/static/public';
	import { PUBLIC_ROOM_SERVER_URL } from '$env/static/public';

	let video: HTMLVideoElement;
	let stream: MediaStream;

	let socket: WebSocket;
	let UUID: string;

	let connections: Connection[] = [];

	async function startWebCam() {
		try {
			const videoStream = await navigator.mediaDevices.getUserMedia({
				video: { width: 64, height: 48 },
				audio: true
			});
			stream = videoStream;
			video.srcObject = stream;
		} catch (error) {
			console.warn(error);
		}
	}

	onMount(async () => {
		socket = new WebSocket(PUBLIC_ROOM_SERVER_URL);

		socket.addEventListener('message', (event) => {
			const message = JSON.parse(event.data);

			if (message.action === 'init first user') {
				console.log('GOT init first user', message.payload);
				UUID = message.payload;

				send(socket, {
					action: 'save first user',
					payload: null
				});

				console.log('SEND save first user', null);
			}

			if (message.action === 'generate peers for existing users') {
				console.log('GOT generate peers for existing users', message.payload);
				for (const existingUserUUID of message.payload) {
					const peer = new Peer({
						host: PUBLIC_PEER_SERVER_HOST,
						port: PUBLIC_PEER_SERVER_PORT ? Number(PUBLIC_PEER_SERVER_PORT) : undefined
					});
					peer.on('open', (UUID: string) => {
						connections.push({
							sender: { peerUUID: UUID, peer },
							receiver: { peerUUID: undefined, UUID: existingUserUUID }
						});
						connections = connections;

						send(socket, {
							action: 'set peer for existing user',
							payload: {
								sender: { peerUUID: UUID },
								receiver: { peerUUID: undefined, UUID: existingUserUUID }
							}
						});
						console.log('SEND set peer for new user', {
							sender: { peerUUID: UUID },
							receiver: { peerUUID: undefined, UUID: existingUserUUID }
						});
					});
				}
				console.log('DONE generate peers for existing users', connections);
			}

			if (message.action === 'generate peer for new user') {
				console.log('GOT generate peer for new user', message.payload);
				const peer = new Peer({
					host: PUBLIC_PEER_SERVER_HOST,
					port: PUBLIC_PEER_SERVER_PORT ? Number(PUBLIC_PEER_SERVER_PORT) : undefined
				});

				peer.on('open', (UUID: string) => {
					connections.push({
						sender: { peerUUID: UUID, peer },
						receiver: {
							peerUUID: message.payload.newUserPeerUUID,
							UUID: message.payload.newUserUUID
						}
					});
					connections = connections;

					console.log('DONE generate peer for new user', connections);

					send(socket, {
						action: 'set peer for new user',
						payload: {
							newUserUUID: message.payload.newUserUUID,
							existingUserUUID: message.payload.existingUserUUID,
							peerUUID: UUID
						}
					});

					console.log('SEND set peer for new user', {
						newUserUUID: message.payload.newUserUUID,
						existingUserUUID: message.payload.existingUserUUID,
						peerUUID: UUID
					});
				});
			}

			if (message.action === 'save peer from existed user') {
				console.log('GOT save peer from existed user', message.payload);

				const existingUser = connections.find(
					(connection) => connection.receiver.UUID === message.payload.existingUserUUID
				);
				if (!existingUser) return;
				existingUser.receiver.peerUUID = message.payload.peerUUID;

				connections = connections;

				console.log('DONE ave peer from existed user', connections);
			}

			if (message.action === 'remove user') {
				console.log('GOT remove user', message.payload);
				connections = connections.filter(
					(connection) => connection.receiver.UUID !== message.payload
				);
				connections = connections;
				console.log('DONE remove user', connections);
			}
		});

		socket.addEventListener('close', (event) => {
			console.warn('socket was closed', event);
		});

		startWebCam();
	});

	let establishedConnections: Connection[] = [];

	$: {
		establishedConnections = connections.filter(
			(connection: Connection) =>
				connection.sender.peer &&
				connection.receiver.peerUUID &&
				connection.receiver.UUID !== UUID &&
				stream
		);
	}
</script>

<div class="page">
	<BestFitLayout
		childCount={establishedConnections.length + 1}
		childAspectRatio={1.3333333333333333}
		let:itemWidth
		let:itemHeight
		let:positions
	>
		{#if positions.length >= 1}
			<Card width={itemWidth} height={itemHeight} x={positions[0].x} y={positions[0].y}>
				<Video bind:video mirrored={true} />
			</Card>
		{/if}
		{#each establishedConnections as connection, i (connection)}
			<Card width={itemWidth} height={itemHeight} x={positions[i + 1].x} y={positions[i + 1].y}>
				<Call {connection} {stream} />
			</Card>
		{/each}
	</BestFitLayout>
</div>

<style lang="scss">
	.page {
		height: 100%;
		padding: 16px;
	}
</style>
