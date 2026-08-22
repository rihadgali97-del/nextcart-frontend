import React from 'react';

export function ActionButton({ label, color, onClick }) {
  return (
    <button
      type="button"
      className="admin-action-button"
      style={{ '--action-color': color }}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export function Pagination({ page, onChange }) {
  return (
    <div className="admin-pagination">
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} className="admin-pagination__button">
        ← Prev
      </button>
      <span className="admin-pagination__label">Page {page}</span>
      <button type="button" onClick={() => onChange(page + 1)} className="admin-pagination__button">
        Next →
      </button>
    </div>
  );
}

export function SettingRow({ label, children }) {
  return (
    <div className="admin-setting-row">
      <div className="admin-setting-row__label">{label.replace(/([A-Z])/g, ' $1').trim()}</div>
      {children}
    </div>
  );
}
