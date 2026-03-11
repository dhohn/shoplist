import { useState, useEffect } from 'react';
import * as Y from 'yjs';
import { useListIndex } from '../useListIndex.js';
import { getIndexDoc, getListDoc } from '../ydoc.js';
import { StatusBar } from './StatusBar.jsx';

// Fixed UUIDs ensure concurrent first-visits from multiple browsers
// resolve to single entries via Y.js last-write-wins on the same keys
const DEFAULT_LIST_ID = '00000000-0000-0000-0000-000000000001';
const DEFAULT_ITEMS = [
  { id: '00000000-0000-0000-0001-000000000001', text: 'Hafermilch' , checked: false },
  { id: '00000000-0000-0000-0001-000000000002', text: 'Brot', checked: false },
  { id: '00000000-0000-0000-0001-000000000003', text: 'Tomaten' , checked: true },
];

export function HomeScreen({ onOpenList }) {
  const { lists, addList, removeList, indexReady, householdName, setHouseholdName } = useListIndex();
  const { wsProvider, idbPersistence } = getIndexDoc();
  const [showInstructions, setShowInstructions] = useState(false);

  // Seed a default list with items on first visit to a fresh household.
  // Fixed UUIDs for both list and items prevent duplicates from concurrent opens.
  useEffect(() => {
    if (!indexReady || lists.length > 0) return;
    addList('Einkaufen', DEFAULT_LIST_ID);
    const { ydoc } = getListDoc(DEFAULT_LIST_ID);
    const yItems = ydoc.getArray('items');
    if (yItems.length > 0) return;
      const maps = DEFAULT_ITEMS.map(({ id, text, checked }) => {
      const m = new Y.Map();
      m.set('id', id);
      m.set('text', text);
      m.set('checked', checked);
      return m;
    });
    ydoc.transact(() => yItems.push(maps));
  }, [indexReady]);

  function handleNewList() {
    const name = window.prompt('List name:');
    if (!name || !name.trim()) return;
    const trimmed = name.trim();
    const duplicate = lists.find((l) => l.name.toLowerCase() === trimmed.toLowerCase());
    if (duplicate) {
      window.alert(`A list named "${duplicate.name}" already exists.`);
      return;
    }
    const id = addList(trimmed);
    onOpenList(id);
  }

  function handleDelete(id, name) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    removeList(id);
  }

  function handleEditName() {
    const name = window.prompt('Household name:', householdName);
    if (name === null) return; // cancelled
    setHouseholdName(name);
  }

  function handleShare() {
    const url = location.origin + location.pathname;
    if (navigator.share) {
      navigator.share({ title: householdName, url }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => window.prompt('Copy this link:', url));
    } else {
      window.prompt('Copy this link:', url);
    }
  }

  return (
    <div className="app">
      <header className="header">
        <button className="title title--editable" onClick={handleEditName} aria-label="Edit household name">
          {householdName}
        </button>
        <div className="header-actions">
          <button className="icon-btn" onClick={() => setShowInstructions(true)} aria-label="Instructions">
            ⓘ
          </button>
          <StatusBar wsProvider={wsProvider} idbPersistence={idbPersistence} />
        </div>
      </header>

      <main className="list-container">
        {!indexReady ? (
          <p className="empty-state">Loading…</p>
        ) : lists.length === 0 ? (
          <p className="empty-state">No lists yet. Tap + to create one.</p>
        ) : (
          <ul className="item-list">
            {lists.map((list) => (
              <li key={list.id} className="list-row">
                <button
                  className="list-row__name"
                  onClick={() => onOpenList(list.id)}
                >
                  {list.name}
                </button>
                <div className="list-row__actions">
                  <button
                    className="list-row__btn list-row__btn--delete"
                    onClick={() => handleDelete(list.id, list.name)}
                    aria-label="Delete list"
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      <div className="home-footer">
        <button className="new-list-btn" onClick={handleNewList}>
          + New List
        </button>
      </div>

      {showInstructions && (
        <div className="modal-overlay" onClick={() => setShowInstructions(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Household Access</h2>
            <p className="modal-text">
              All lists are visible to <strong>everyone with this link</strong> and sync automatically in real time.
              Share it with anyone you want to give access to all your lists.
            </p>
            <p className="modal-text">
              On iOS: open the link in Safari, then tap Share → Add to Home Screen to install.
            </p>
            <input
              className="modal-url"
              value={location.origin + location.pathname}
              readOnly
              onFocus={(e) => e.target.select()}
            />
            <button className="modal-share-btn" onClick={handleShare}>
              Share household link
            </button>
            <button className="modal-share-btn modal-share-btn--secondary" onClick={() => {
              const url = location.origin + location.pathname;
              navigator.clipboard.writeText(url).catch(() => {});
            }}>
              Copy link
            </button>
            <button className="modal-close-btn" onClick={() => setShowInstructions(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
