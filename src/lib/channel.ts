import type { SyncMessage, SyncState } from '../types';

const CHANNEL_NAME = 'projection-mapping';

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel {
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME);
  }
  return channel;
}

export function postMessage(message: SyncMessage): void {
  getChannel().postMessage(message);
}

export function sendState(state: SyncState): void {
  postMessage({ type: 'state', state });
}

export function subscribe(handler: (message: SyncMessage) => void): () => void {
  const current = getChannel();
  const listener = (event: MessageEvent<SyncMessage>) => handler(event.data);
  current.addEventListener('message', listener);
  return () => current.removeEventListener('message', listener);
}

export function closeChannel(): void {
  channel?.close();
  channel = null;
}
