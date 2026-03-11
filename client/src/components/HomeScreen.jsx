import { useState } from 'react';
import { useListIndex } from '../useListIndex.js';
import { getIndexDoc } from '../ydoc.js';
import { StatusBar } from './StatusBar.jsx';

export function HomeScreen({ onOpenList }) {
  const { lists, addList, removeList, indexReady, householdName, setHouseholdName } = useListIndex();
  const { wsProvider, idbPersistence } = getIndexDoc();
  const [showInstructions, setShowInstructions] = useState(false);

  function handleNewList() {
    const name = window.prompt('List name:');
    if (!name || !name.trim()) return;
    const id = addList(name.trim());
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
