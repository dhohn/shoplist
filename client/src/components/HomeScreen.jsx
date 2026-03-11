import { useListIndex } from '../useListIndex.js';
import { getIndexDoc } from '../ydoc.js';
import { StatusBar } from './StatusBar.jsx';

export function HomeScreen({ onOpenList }) {
  const { lists, addList, removeList, indexReady } = useListIndex();
  const { wsProvider, idbPersistence } = getIndexDoc();

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

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">My Lists</h1>
        <StatusBar wsProvider={wsProvider} idbPersistence={idbPersistence} />
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
                  {list.isForeign && <span className="list-row__syncing"> (syncing…)</span>}
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
    </div>
  );
}
