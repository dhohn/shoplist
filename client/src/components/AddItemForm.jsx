import { useRef } from 'react';

export function AddItemForm({ onAdd }) {
  const inputRef = useRef(null);

  function handleSubmit(e) {
    e.preventDefault();
    const value = inputRef.current.value;
    if (!value.trim()) return;
    onAdd(value);
    inputRef.current.value = '';
    inputRef.current.focus();
  }

  return (
    <form className="add-form" onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        type="text"
        placeholder="Add item…"
        enterKeyHint="done"
        autoComplete="off"
        className="add-input"
      />
      <button type="submit" className="add-btn" aria-label="Add item">
        +
      </button>
    </form>
  );
}
