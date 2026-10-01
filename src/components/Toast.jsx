import React from 'react';
import { Sparkles, X } from './Icons';

export default function Toast({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="toast-notification-wrap">
      <div className="toast-notification glass-panel">
        <div className="toast-icon-wrap">
          <Sparkles size={14} className="toast-sparkle coral" />
        </div>
        <span className="toast-text font-mono">{message}</span>
        <button className="toast-close-btn" onClick={onClose}>
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
