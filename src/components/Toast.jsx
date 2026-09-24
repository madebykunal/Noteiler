import React from 'react';

export default function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="toast-item" role="status" aria-live="polite">
      {message}
    </div>
  );
}
