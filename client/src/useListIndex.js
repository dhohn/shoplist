import { useState, useEffect, useCallback } from 'react';
import { getIndexDoc, destroyDoc } from './ydoc.js';
import { log } from './log.js';

const FOREIGN_KEY = 'shoplist:foreign-lists';

function getForeignLists() {
  try {
    return JSON.parse(localStorage.getItem(FOREIGN_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveForeignLists(obj) {
  localStorage.setItem(FOREIGN_KEY, JSON.stringify(obj));
}

export function useListIndex() {
  const { ydoc, idbPersistence } = getIndexDoc();
  const yLists = ydoc.getMap('lists');

  function getSnapshot() {
    const entries = [];
    yLists.forEach((val, uuid) => {
      entries.push({ id: uuid, name: val.name, createdAt: val.createdAt });
    });
    return entries.sort((a, b) => a.createdAt - b.createdAt);
  }

  const [lists, setLists] = useState(getSnapshot);
  const [indexReady, setIndexReady] = useState(idbPersistence.synced);

  // Foreign lists: shared URLs joined offline, not yet in the Y.Map
  const [foreignLists, setForeignLists] = useState(() =>
    Object.entries(getForeignLists()).map(([id, data]) => ({
      id,
      name: data.name || 'Shared List',
      createdAt: data.joinedAt,
      isForeign: true,
    }))
  );

  useEffect(() => {
    const handler = () => {
      const snapshot = getSnapshot();
      log('index:update', snapshot.map((l) => `${l.id.slice(0, 8)}… "${l.name}"`));
      setLists(snapshot);

      // Promote any foreign lists that now appear in the Y.Map
      const foreign = getForeignLists();
      const promoted = Object.keys(foreign).filter((id) => yLists.has(id));
      if (promoted.length > 0) {
        promoted.forEach((id) => {
          log('index:promoted', id, '— real name arrived from server');
          delete foreign[id];
        });
        saveForeignLists(foreign);
        setForeignLists(
          Object.entries(foreign).map(([id, data]) => ({
            id,
            name: data.name || 'Shared List',
            createdAt: data.joinedAt,
            isForeign: true,
          }))
        );
      }
    };
    yLists.observe(handler);
    return () => yLists.unobserve(handler);
  }, []);

  useEffect(() => {
    if (idbPersistence.synced) {
      setIndexReady(true);
      return;
    }
    const handler = () => setIndexReady(true);
    idbPersistence.on('synced', handler);
    return () => idbPersistence.off('synced', handler);
  }, []);

  const addList = useCallback((name, id = crypto.randomUUID()) => {
    log('index:addList', id, `"${name}"`);
    yLists.set(id, { name: name.trim(), createdAt: Date.now() });
    return id;
  }, []);

  const removeList = useCallback((uuid) => {
    log('index:removeList', uuid);
    yLists.delete(uuid);
    destroyDoc(uuid);
    // Also clean up if it was a foreign list
    const foreign = getForeignLists();
    if (foreign[uuid]) {
      delete foreign[uuid];
      saveForeignLists(foreign);
      setForeignLists((prev) => prev.filter((l) => l.id !== uuid));
    }
  }, []);

  // Store a shared list UUID locally without touching the shared Y.Map.
  // The real name will arrive via WS sync and promote it automatically.
  const joinForeignList = useCallback((uuid) => {
    if (yLists.has(uuid)) return; // already synced, nothing to do
    const foreign = getForeignLists();
    if (foreign[uuid]) return; // already tracked
    log('index:joinForeign', uuid);
    foreign[uuid] = { joinedAt: Date.now() };
    saveForeignLists(foreign);
    setForeignLists((prev) => [
      ...prev,
      { id: uuid, name: 'Shared List', createdAt: Date.now(), isForeign: true },
    ]);
  }, []);

  // Combined: real lists + foreign lists not yet promoted
  const allLists = [
    ...lists,
    ...foreignLists.filter((f) => !lists.find((l) => l.id === f.id)),
  ].sort((a, b) => a.createdAt - b.createdAt);

  return { lists: allLists, addList, removeList, indexReady, joinForeignList };
}
