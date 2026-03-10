import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';

const DOC_NAME = 'shoplist';

// Singleton ydoc — lives outside React to survive Strict Mode double-mount
export const ydoc = new Y.Doc();
export const yItems = ydoc.getArray('items');

// Restore state from IndexedDB instantly (enables offline)
export const idbPersistence = new IndexeddbPersistence(DOC_NAME, ydoc);

// In dev, use Vite's /ws proxy → ws://localhost:1234
// In production, VITE_WS_URL points to the deployed server
function getWsUrl() {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${location.host}/ws`;
}

export const wsProvider = new WebsocketProvider(getWsUrl(), DOC_NAME, ydoc);
