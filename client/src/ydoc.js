import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';

function getWsUrl() {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${location.host}/ws`;
}

function indexDocName() {
  // pathname is /<base>/<household> — use household segment as the scope
  // e.g. /xk29qz/shop → 'shop-index', /xk29qz/ → 'default-index'
  const segments = location.pathname.split('/').filter(Boolean);
  const household = segments[1] || 'default';
  return `${household}-index`;
}

// Cache lives at module scope — survives React Strict Mode double-mount
const docCache = new Map();

function getDoc(docName) {
  if (docCache.has(docName)) return docCache.get(docName);

  const ydoc = new Y.Doc();
  const idbPersistence = new IndexeddbPersistence(docName, ydoc);
  const wsProvider = new WebsocketProvider(getWsUrl(), docName, ydoc);

  const entry = { ydoc, wsProvider, idbPersistence };
  docCache.set(docName, entry);
  return entry;
}

export function getIndexDoc() {
  return getDoc(indexDocName());
}

export function getListDoc(uuid) {
  return getDoc(uuid);
}

export function destroyDoc(docName) {
  const entry = docCache.get(docName);
  if (!entry) return;
  entry.wsProvider.destroy();
  entry.idbPersistence.destroy();
  docCache.delete(docName);
}
