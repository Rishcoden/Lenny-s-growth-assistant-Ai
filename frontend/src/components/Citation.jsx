import React from 'react';

export default function Citation({ id, isActive, onClick }) {
  return (
    <button
      type="button"
      className={`citation-chip ${isActive ? 'active' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick(id);
      }}
      title={`Inspect supporting podcast passage for [${id}]`}
      aria-label={`Citation ${id}`}
    >
      [{id}]
    </button>
  );
}
