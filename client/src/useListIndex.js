import { useState, useEffect, useCallback } from 'react';
import { getIndexDoc, destroyDoc } from './ydoc.js';

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
    const handler = () => setLists(getSnapshot());
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
    yLists.set(id, { name: name.trim(), createdAt: Date.now() });
    return id;
  }, []);

  const removeList = useCallback((uuid) => {
    yLists.delete(uuid);
    destroyDoc(uuid);
  }, []);

  return { lists, addList, removeList, indexReady };
}
