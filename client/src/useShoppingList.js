import { useState, useEffect, useCallback } from 'react';
import * as Y from 'yjs';
import { getListDoc } from './ydoc.js';

const MAX_ITEM_TEXT = 500;
const MAX_ITEMS = 500;
const HIGHLIGHT_MS = 1500;

export function useShoppingList(listId) {
  const [items, setItems] = useState([]);
  const [highlightedId, setHighlightedId] = useState(null);

  useEffect(() => {
    const { ydoc } = getListDoc(listId);
    const yItems = ydoc.getArray('items');

    function getSnapshot() {
      return yItems.toArray().map((yMap) => ({
        id: yMap.get('id'),
        text: yMap.get('text'),
        checked: yMap.get('checked'),
      }));
    }

    setItems(getSnapshot());
    const handler = () => setItems(getSnapshot());
    yItems.observeDeep(handler);
    return () => yItems.unobserveDeep(handler);
  }, [listId]);

  const highlight = useCallback((id) => {
    setHighlightedId(id);
    setTimeout(() => setHighlightedId((cur) => (cur === id ? null : cur)), HIGHLIGHT_MS);
  }, []);

  const addItem = useCallback((text) => {
    const trimmed = text.trim().slice(0, MAX_ITEM_TEXT);
    if (!trimmed) return;

    const { ydoc } = getListDoc(listId);
    const yItems = ydoc.getArray('items');
    const arr = yItems.toArray();
    const existingIdx = arr.findIndex(
      (m) => m.get('text').toLowerCase() === trimmed.toLowerCase()
    );

    if (existingIdx !== -1) {
      const existing = arr[existingIdx];
      const id = existing.get('id');
      const originalText = existing.get('text');
      ydoc.transact(() => {
        yItems.delete(existingIdx, 1);
        const moved = new Y.Map();
        moved.set('id', id);
        moved.set('text', originalText);
        moved.set('checked', false);
        yItems.insert(0, [moved]);
      });
      highlight(id);
      return;
    }

    if (yItems.length >= MAX_ITEMS) return;
    const yMap = new Y.Map();
    ydoc.transact(() => {
      yMap.set('id', crypto.randomUUID());
      yMap.set('text', trimmed);
      yMap.set('checked', false);
    });
    yItems.push([yMap]);
  }, [listId, highlight]);

  const toggleItem = useCallback((id) => {
    const { ydoc } = getListDoc(listId);
    const yItems = ydoc.getArray('items');
    const arr = yItems.toArray();
    const idx = arr.findIndex((m) => m.get('id') === id);
    if (idx === -1) return;
    arr[idx].set('checked', !arr[idx].get('checked'));
  }, [listId]);

  const deleteItem = useCallback((id) => {
    const { ydoc } = getListDoc(listId);
    const yItems = ydoc.getArray('items');
    const arr = yItems.toArray();
    const idx = arr.findIndex((m) => m.get('id') === id);
    if (idx === -1) return;
    yItems.delete(idx, 1);
  }, [listId]);

  const clearItems = useCallback(() => {
    const { ydoc } = getListDoc(listId);
    const yItems = ydoc.getArray('items');
    yItems.delete(0, yItems.length);
  }, [listId]);

  return { items, addItem, toggleItem, deleteItem, clearItems, highlightedId };
}
