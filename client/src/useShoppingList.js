import { useState, useEffect, useCallback } from 'react';
import * as Y from 'yjs';
import { ydoc, yItems } from './ydoc.js';

const MAX_ITEM_TEXT = 500;
const MAX_ITEMS = 500;
const HIGHLIGHT_MS = 1500;

function getSnapshot() {
  return yItems.toArray().map((yMap) => ({
    id: yMap.get('id'),
    text: yMap.get('text'),
    checked: yMap.get('checked'),
  }));
}

export function useShoppingList() {
  const [items, setItems] = useState(getSnapshot);
  const [highlightedId, setHighlightedId] = useState(null);

  useEffect(() => {
    const handler = () => setItems(getSnapshot());
    yItems.observeDeep(handler);
    return () => yItems.unobserveDeep(handler);
  }, []);

  const highlight = useCallback((id) => {
    setHighlightedId(id);
    setTimeout(() => setHighlightedId((cur) => (cur === id ? null : cur)), HIGHLIGHT_MS);
  }, []);

  const addItem = useCallback((text) => {
    const trimmed = text.trim().slice(0, MAX_ITEM_TEXT);
    if (!trimmed) return;

    const arr = yItems.toArray();
    const existingIdx = arr.findIndex(
      (m) => m.get('text').toLowerCase() === trimmed.toLowerCase()
    );

    if (existingIdx !== -1) {
      // Duplicate: move to top, uncheck, preserve original casing and id
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
  }, [highlight]);

  const toggleItem = useCallback((id) => {
    const arr = yItems.toArray();
    const idx = arr.findIndex((m) => m.get('id') === id);
    if (idx === -1) return;
    arr[idx].set('checked', !arr[idx].get('checked'));
  }, []);

  const deleteItem = useCallback((id) => {
    const arr = yItems.toArray();
    const idx = arr.findIndex((m) => m.get('id') === id);
    if (idx === -1) return;
    yItems.delete(idx, 1);
  }, []);

  const clearItems = useCallback(() => {
    yItems.delete(0, yItems.length);
  }, []);

  return { items, addItem, toggleItem, deleteItem, clearItems, highlightedId };
}
