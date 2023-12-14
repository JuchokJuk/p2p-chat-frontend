<script lang="ts">
	import Call from '$lib/Call.svelte';
	import { onMount } from 'svelte';
	import { user } from '../stores/user';
	import { send } from '$lib/send';
	import { PUBLIC_PEER_SERVER_HOST } from '$env/static/public';
	import { PUBLIC_PEER_SERVER_PORT } from '$env/static/public';
	import Peer from 'peerjs';

	let video: HTMLVideoElement;
	let stream: MediaStream;

	let socket: WebSocket;
	let UUID: string;

	function startWebCam() {
		navigator.mediaDevices
			.getUserMedia({
				video: true,
				audio: true
			})
			.then((videoStream) => {
				stream = videoStream;
				video.srcObject = stream;
				video.play();
			})
			.catch((error) => console.warn(error));
	}

	onMount(async () => {
		socket = new WebSocket('ws://localhost:8000/chat');

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
						port: Number(PUBLIC_PEER_SERVER_PORT)
					});
					peer.on('open', (UUID) => {
						$user.connections.push({
							sender: { peerUUID: UUID, peer },
							receiver: { peerUUID: undefined, UUID: existingUserUUID }
						});
						$user = $user;

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
				console.log('DONE generate peers for existing users', $user);
			}

			if (message.action === 'generate peer for new user') {
				console.log('GOT generate peer for new user', message.payload);
				const peer = new Peer({
					host: PUBLIC_PEER_SERVER_HOST,
					port: Number(PUBLIC_PEER_SERVER_PORT)
				});

				peer.on('open', (UUID: string) => {
					$user.connections.push({
						sender: { peerUUID: UUID, peer },
						receiver: {
							peerUUID: message.payload.newUserPeerUUID,
							UUID: message.payload.newUserUUID
						}
					});
					$user = $user;

					console.log('DONE generate peer for new user', $user);

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

				const existingUser = $user.connections.find(
					(connection) => connection.receiver.UUID === message.payload.existingUserUUID
				);
				if (!existingUser) return;
				existingUser.receiver.peerUUID = message.payload.peerUUID;

				$user = $user;

				console.log('DONE ave peer from existed user', $user);
			}

			if (message.action === 'remove user') {
				console.log('GOT remove user', message.payload);
				$user.connections = $user.connections.filter(
					(connection) => connection.receiver.UUID !== message.payload
				);
				$user = $user;
				console.log('DONE remove user', $user);
			}
		});

		socket.addEventListener('close', (event) => {
			console.warn('socket was closed', event);
		});

		startWebCam();
	});
</script>

<div>
	<video bind:this={video} width={256} height={256} playsinline autoplay>
		<track kind="captions" />
	</video>
	{#each $user.connections as connection}
		{#if stream && connection.sender.peer && connection.receiver.peerUUID && connection.receiver.UUID !== UUID}
			<Call {connection} {stream} />
		{/if}
	{/each}
</div>

<style>
	div {
		display: flex;
		flex-wrap: wrap;
		gap: 24px;
	}
	video {
		background: rgb(236, 236, 236);
		object-fit: cover;
		border-radius: 8px;
	}
</style>
