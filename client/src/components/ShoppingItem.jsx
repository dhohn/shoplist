export function ShoppingItem({ item, onToggle, onDelete, highlighted }) {
  return (
    <li className={`item${item.checked ? ' item--checked' : ''}${highlighted ? ' item--highlight' : ''}`}>
      <button
        className="item-check"
        onClick={() => onToggle(item.id)}
        aria-label={item.checked ? 'Uncheck item' : 'Check item'}
        aria-pressed={item.checked}
      >
        {item.checked ? '✓' : ''}
      </button>
      <span className="item-text">{item.text}</span>
      <button
        className="item-delete"
        onClick={() => onDelete(item.id)}
        aria-label="Delete item"
      >
        ×
      </button>
    </li>
  );
}
