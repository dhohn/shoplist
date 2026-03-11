import { useState, useEffect, useCallback } from 'react';
import { getIndexDoc, destroyDoc } from './ydoc.js';
import { log } from './log.js';

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

  useEffect(() => {
    const handler = () => {
      const snapshot = getSnapshot();
      log('index:update', snapshot.map((l) => `${l.id.slice(0, 8)}… "${l.name}"`));
      setLists(snapshot);
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

  // id is optional — callers can provide it when joining a shared list
  const addList = useCallback((name, id = crypto.randomUUID()) => {
    log('index:addList', id, `"${name}"`);
    yLists.set(id, { name: name.trim(), createdAt: Date.now() });
    return id;
  }, []);

  const removeList = useCallback((uuid) => {
    log('index:removeList', uuid);
    yLists.delete(uuid);
    destroyDoc(uuid);
  }, []);

  return { lists, addList, removeList, indexReady };
}
