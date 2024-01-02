<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	import { send } from '$lib/send';

	import BestFitLayout from '$lib/BestFitLayout.svelte';
	import Call from '$lib/Call.svelte';
	import Video from '$lib/Video.svelte';
	import Card from '$lib/Card.svelte';
	import Debug from '$lib/Debug.svelte';

	import Peer from 'peerjs';

	import type { Connection } from '$lib/Connection';

	import { PUBLIC_PEER_SERVER_HOST } from '$env/static/public';
	import { PUBLIC_PEER_SERVER_PORT } from '$env/static/public';
	import { PUBLIC_ROOM_SERVER_WS_URL } from '$env/static/public';
	import { PUBLIC_ROOM_SERVER_HTTP_URL } from '$env/static/public';

	const port = PUBLIC_PEER_SERVER_PORT ? Number(PUBLIC_PEER_SERVER_PORT) : undefined;

	let video: HTMLVideoElement;
	let stream: MediaStream;

	let socket: WebSocket;
	let UUID: string;
	let intervalId: NodeJS.Timeout;

	let connections: Connection[] = [];
	let establishedConnections: Connection[] = [];

	let logs: { text: string; data: any }[] = [];
	let debug = false;

	function toggleDebug() {
		debug = !debug;
	}

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

	async function connect() {
		console.log('CONNECT!');
		const response = await fetch(`${PUBLIC_ROOM_SERVER_HTTP_URL}/users`);
		const users = await response.json();

		socket = new WebSocket(`${PUBLIC_ROOM_SERVER_WS_URL}/chat`);

		socket.addEventListener('open', () => {
			for (const existingUserUUID of users) {
				const peer = new Peer({ host: PUBLIC_PEER_SERVER_HOST, port });
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
				});

				peer.on('disconnected', (error) => {
					console.warn('peer for existing user disconnected', error);
				});

				peer.on('error', (error) => {
					console.warn('peer for existing user error', error);
				});

				logs.push({
					text: 'SEND set peer for new user',
					data: {
						sender: { peerUUID: UUID },
						receiver: { peerUUID: undefined, UUID: existingUserUUID }
					}
				});
				logs = logs;
			}

			intervalId = setInterval(() => {
				send(socket, { action: 'heartbeat', payload: null });
			}, 5000);
		});

		socket.addEventListener('message', (event) => {
			const message = JSON.parse(event.data);

			if (message.action === 'init user') {
				logs.push({ text: 'GOT init user', data: message.payload });
				logs = logs;
				UUID = message.payload;
			} else if (message.action === 'generate peer for new user') {
				logs.push({ text: 'GOT generate peer for new user', data: message.payload });
				logs = logs;

				const peer = new Peer({ host: PUBLIC_PEER_SERVER_HOST, port });

				peer.on('disconnected', (error) => {
					console.warn('peer for new user disconnected', error);
				});

				peer.on('error', (error) => {
					console.warn('peer for new user error', error);
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
			} else if (message.action === 'save peer from existed user') {
				logs.push({ text: 'GOT save peer from existed user', data: message.payload });
				logs = logs;

				const existingUser = connections.find(
					(connection) => connection.receiver.UUID === message.payload.existingUserUUID
				);
				if (!existingUser) return;
				existingUser.receiver.peerUUID = message.payload.peerUUID;

				connections = connections;

				logs.push({ text: 'DONE save peer from existed user', data: connections });
				logs = logs;
			} else if (message.action === 'remove user') {
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
			clearInterval(intervalId);
			console.warn('socket was closed', event);
			connect();
		});

		startWebCam();
	}

	function disconnect(){
		clearInterval(intervalId);
		connections = [];
	}

	$: {
		establishedConnections = connections.filter(
			(connection: Connection) =>
				connection.sender.peer &&
				connection.receiver.peerUUID &&
				connection.receiver.UUID !== UUID &&
				stream
		);
	}

	onMount(() => {
		connect();
	});

	onDestroy(()=>{
		clearInterval(intervalId)
	})
</script>

<svelte:window on:online={connect} on:offline={disconnect}/>

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
				<Video bind:video mirrored={true} muted />
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
