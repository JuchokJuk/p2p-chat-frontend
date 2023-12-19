import type Peer from "peerjs";

export type Connection = {
	sender: { peerUUID?: string; peer?: Peer };
	receiver: { peerUUID?: string; UUID?: string };
};