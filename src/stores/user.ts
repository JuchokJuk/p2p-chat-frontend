import type Peer from 'peerjs';
import { writable } from 'svelte/store';

export type Connection = {
	sender: { peerUUID?: string; peer?: Peer };
	receiver: { peerUUID?: string; UUID?: string };
};

export type User = {
	connections: Connection[];
};

export const user = writable<User>({
	connections: []
});
