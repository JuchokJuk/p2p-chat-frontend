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
	import Debug from '$lib/Debug.svelte';

	let video: HTMLVideoElement;
	let stream: MediaStream;

	let socket: WebSocket;
	let UUID: string;

	let connections: Connection[] = [];

	let logs: { text: string; data: any }[] = [];

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
				logs.push({ text: 'GOT init first user', data: message.payload });
				logs = logs;

				UUID = message.payload;

				send(socket, {
					action: 'save first user',
					payload: null
				});

				logs.push({ text: 'SEND save first user', data: null });
				logs = logs;
			}

			if (message.action === 'generate peers for existing users') {
				logs.push({ text: 'GOT generate peers for existing users', data: message.payload });
				logs = logs;

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

						logs.push({
							text: 'SEND set peer for new user',
							data: {
								sender: { peerUUID: UUID },
								receiver: { peerUUID: undefined, UUID: existingUserUUID }
							}
						});
						logs = logs;
					});
				}
				logs.push({ text: 'DONE generate peers for existing users', data: connections });
				logs = logs;
			}

			if (message.action === 'generate peer for new user') {
				logs.push({ text: 'GOT generate peer for new user', data: message.payload });
				logs = logs;

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

					logs.push({ text: 'DONE generate peer for new user', data: connections });
					logs = logs;

					send(socket, {
						action: 'set peer for new user',
						payload: {
							newUserUUID: message.payload.newUserUUID,
							existingUserUUID: message.payload.existingUserUUID,
							peerUUID: UUID
						}
					});

					logs.push({
						text: 'SEND set peer for new user',
						data: {
							newUserUUID: message.payload.newUserUUID,
							existingUserUUID: message.payload.existingUserUUID,
							peerUUID: UUID
						}
					});
					logs = logs;
				});
			}

			if (message.action === 'save peer from existed user') {
				logs.push({ text: 'GOT save peer from existed user', data: message.payload });
				logs = logs;

				const existingUser = connections.find(
					(connection) => connection.receiver.UUID === message.payload.existingUserUUID
				);
				if (!existingUser) return;
				existingUser.receiver.peerUUID = message.payload.peerUUID;

				connections = connections;

				logs.push({ text: 'DONE ave peer from existed user', data: connections });
				logs = logs;
			}

			if (message.action === 'remove user') {
				logs.push({ text: 'GOT remove user', data: message.payload });
				logs = logs;
				connections = connections.filter(
					(connection) => connection.receiver.UUID !== message.payload
				);
				connections = connections;

				logs.push({ text: 'DONE remove user', data: connections });
				logs = logs;
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

	let debug = false;

	function toggleDebug() {
		debug = !debug;
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

{#if debug}
	<div class="modal">
		<Debug {logs} {connections} />
	</div>
{/if}

<button on:click={toggleDebug}>toggle debug</button>

<style lang="scss">
	.page {
		height: 100%;
		padding: 16px;
	}

	button {
		position: fixed;
		top: 16px;
		right: 16px;
		background: black;
		color: white;
		padding: 8px 12px;
		border: none;
		border-radius: 8px;
	}

	.modal {
		position: fixed;
		top: 0;
		right: 0;
		width: 100%;
		height: 100%;
	}
</style>
