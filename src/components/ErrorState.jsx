import React from 'react';
import { AlertCircle, RotateCcw, X, Link2 } from './Icons';

export default function ErrorState({ errorMessage, onRetry, onEditUrl, onReset }) {
  return (
    <div className="downloader-error-card">
      <div className="error-icon-box">
        <AlertCircle size={36} className="error-alert-glyph coral" />
        <span className="error-pulse-ring"></span>
      </div>

      <div className="error-text-group">
        <h3 className="error-card-title font-serif">Analysis Failed</h3>
        <p className="error-card-description">
          {errorMessage || 'Unable to parse media stream. Please verify the URL and try again.'}
        </p>
      </div>

      <div className="error-actions-group">
        {onRetry && (
          <button type="button" className="btn-analyze-action" onClick={onRetry}>
            <RotateCcw size={14} />
            <span>Retry Analysis</span>
          </button>
        )}

        {onEditUrl && (
          <button type="button" className="action-btn-secondary" onClick={onEditUrl}>
            <Link2 size={14} />
            <span>Edit URL</span>
          </button>
        )}

        {onReset && (
          <button type="button" className="action-btn-secondary" onClick={onReset}>
            <X size={14} />
            <span>Clear / Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}
