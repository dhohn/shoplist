import { useEffect } from 'react';
import { useShoppingList } from '../useShoppingList.js';
import { getListDoc } from '../ydoc.js';
import { AddItemForm } from './AddItemForm.jsx';
import { ShoppingItem } from './ShoppingItem.jsx';
import { StatusBar } from './StatusBar.jsx';

export function ListScreen({ listId, listName, onBack }) {
  const { items, addItem, toggleItem, deleteItem, clearItems, highlightedId } = useShoppingList(listId);
  const { wsProvider, idbPersistence } = getListDoc(listId);

  useEffect(() => {
    localStorage.setItem('lastList', listId);
  }, [listId]);

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  return (
    <div className="app">
      <header className="header">
        <button className="back-btn" onClick={onBack} aria-label="Back to lists">
          ←
        </button>
        <h1 className="title">{listName || 'List'}</h1>
        <div className="header-actions">
          <button
            className="clear-btn"
            onClick={() => {
              const url = `${location.origin}${location.pathname}#/list/${listId}`;
              if (navigator.clipboard) {
                navigator.clipboard.writeText(url).catch(() => window.prompt('Copy this link:', url));
              } else {
                window.prompt('Copy this link:', url);
              }
            }}
            aria-label="Share list"
          >
            Share
          </button>
          {items.length > 0 && (
            <button
              className="clear-btn"
              onClick={() => window.confirm('Clear the entire list?') && clearItems()}
              aria-label="Clear all items"
            >
              Clear
            </button>
          )}
          <StatusBar wsProvider={wsProvider} idbPersistence={idbPersistence} />
        </div>
      </header>

      <AddItemForm onAdd={addItem} />

      <main className="list-container">
        <ul className="item-list">
          {unchecked.map((item) => (
            <ShoppingItem
              key={item.id}
              item={item}
              onToggle={toggleItem}
              onDelete={deleteItem}
              highlighted={item.id === highlightedId}
            />
          ))}
        </ul>

        {checked.length > 0 && (
          <>
            <div className="divider">Checked ({checked.length})</div>
            <ul className="item-list">
              {checked.map((item) => (
                <ShoppingItem
                  key={item.id}
                  item={item}
                  onToggle={toggleItem}
                  onDelete={deleteItem}
                />
              ))}
            </ul>
          </>
        )}

        {items.length === 0 && (
          <p className="empty-state">No items yet. Add something above!</p>
        )}
      </main>
    </div>
  );
}
