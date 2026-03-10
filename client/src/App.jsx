import { useShoppingList } from './useShoppingList.js';
import { AddItemForm } from './components/AddItemForm.jsx';
import { ShoppingItem } from './components/ShoppingItem.jsx';
import { StatusBar } from './components/StatusBar.jsx';

export function App() {
  const { items, addItem, toggleItem, deleteItem, clearItems, highlightedId } = useShoppingList();

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">Shopping List</h1>
        <div className="header-actions">
          {items.length > 0 && (
            <button
              className="clear-btn"
              onClick={() => window.confirm('Clear the entire list?') && clearItems()}
              aria-label="Clear all items"
            >
              Clear
            </button>
          )}
          <StatusBar />
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

      <IOSInstallBanner />
    </div>
  );
}

function IOSInstallBanner() {
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = navigator.standalone === true;

  if (!isIOS || isStandalone) return null;

  return (
    <div className="ios-banner">
      Tap <strong>Share</strong> → <strong>Add to Home Screen</strong> to install
    </div>
  );
}
