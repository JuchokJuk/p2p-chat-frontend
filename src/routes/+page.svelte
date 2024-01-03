<script lang="ts">
	import { onDestroy } from 'svelte';

	import { send } from '$lib/send';

	import BestFitLayout from '$lib/BestFitLayout.svelte';
	import Call from '$lib/Call.svelte';
	import Video from '$lib/Video.svelte';
	import Card from '$lib/Card.svelte';

	import Peer from 'peerjs';

	import { PUBLIC_PEER_SERVER_HOST } from '$env/static/public';
	import { PUBLIC_PEER_SERVER_PORT } from '$env/static/public';
	import { PUBLIC_ROOM_SERVER_URL } from '$env/static/public';

	const port = PUBLIC_PEER_SERVER_PORT ? Number(PUBLIC_PEER_SERVER_PORT) : undefined;

	let video: HTMLVideoElement;
	let stream: MediaStream;

	let socket: WebSocket;
	let intervalId: NodeJS.Timeout;

	let peer: Peer;

	type User = { UUID: string; peerUUID: string };

	let users: User[] = [];

	const actions = {
		saveUsers: (data: User[]) => {
			users = data;
		},
		addUser: (user: User) => {
			users.push(user);
			users = users;
		},
		removeUser: (userUUID: string) => {
			users = users.filter((user) => user.UUID !== userUUID);
		}
	};

	type Action = keyof typeof actions;
	type Message = { action: Action; payload: any };

	async function startWebCam() {
		try {
			stream = video.srcObject = await navigator.mediaDevices.getUserMedia({
				video: { width: 64, height: 48 },
				audio: true
			});
		} catch (error) {
			console.warn(error);
		}
	}

	async function connect() {
		peer = new Peer({ host: PUBLIC_PEER_SERVER_HOST, port });

		//

		peer.on('disconnected', (error) => {
			console.warn('!!! peer disconnected !!!', error);
		});

		peer.on('error', (error) => {
			console.warn('!!! peer error !!!', error);
		});

		//
		
		peer.on('call', (mediaConnection) => {
			mediaConnection.answer(stream);
		});

		peer.on('open', (UUID: string) => {
			socket = new WebSocket(PUBLIC_ROOM_SERVER_URL);

			socket.onerror = (event) => {
				console.warn('!!! socket error !!!', event)
			}

			socket.onopen = () => {
				intervalId = setInterval(() => {
					send(socket, { action: 'heartbeat', payload: null });
				}, 5000);

				send(socket, { action: 'savePeerUUID', payload: UUID });
			};

			socket.onmessage = (event) => {
				const message = JSON.parse(event.data) as Message;
				actions[message.action](message.payload);
			};

			socket.onclose = (event) => {
				console.warn('socket was closed', event);
				disconnect();
			};
		});
	}

	async function start() {
		await startWebCam();
		connect();
	}

	function disconnect() {
		clearInterval(intervalId);
		users = [];
	}

	onDestroy(() => {
		clearInterval(intervalId);
		peer?.destroy();
	});
</script>

<svelte:window on:online={connect} on:offline={disconnect} />

<div class="page">
	<BestFitLayout
		childCount={users.length + 1}
		childAspectRatio={1.3333333333333333}
		let:itemWidth
		let:itemHeight
		let:positions
	>
		{#if positions.length >= 1}
			<Card width={itemWidth} height={itemHeight} x={positions[0].x} y={positions[0].y}>
				<Video bind:video mirrored={true} muted onMountCallback={start} />
			</Card>
		{/if}
		{#each users as user, i (user.peerUUID)}
			<Card width={itemWidth} height={itemHeight} x={positions[i + 1].x} y={positions[i + 1].y}>
				<Call {peer} receiverPeerUUID={user.peerUUID} {stream} />
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
