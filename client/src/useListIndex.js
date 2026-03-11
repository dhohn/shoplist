import { useState, useEffect, useCallback } from 'react';
import { getIndexDoc, destroyDoc, getListDocName } from './ydoc.js';
import { log } from './log.js';

export function useListIndex() {
  const { ydoc, idbPersistence } = getIndexDoc();
  const yLists = ydoc.getMap('lists');
  const yMeta = ydoc.getMap('meta');

  function getSnapshot() {
    const entries = [];
    yLists.forEach((val, uuid) => {
      entries.push({ id: uuid, name: val.name, createdAt: val.createdAt });
    });
    return entries.sort((a, b) => a.createdAt - b.createdAt);
  }

  const [lists, setLists] = useState(getSnapshot);
  const [indexReady, setIndexReady] = useState(idbPersistence.synced);
  const [householdName, setHouseholdNameState] = useState(
    () => yMeta.get('householdName') || 'My Lists'
  );

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
    const handler = () => setHouseholdNameState(yMeta.get('householdName') || 'My Lists');
    yMeta.observe(handler);
    return () => yMeta.unobserve(handler);
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
    destroyDoc(getListDocName(uuid));
  }, []);

  const setHouseholdName = useCallback((name) => {
    const trimmed = name.trim() || 'My Lists';
    log('index:setHouseholdName', `"${trimmed}"`);
    yMeta.set('householdName', trimmed);
  }, []);

  return { lists, addList, removeList, indexReady, householdName, setHouseholdName };
}
