import React from 'react';
import { Volume2, Check } from './Icons';

export default function AudioQualityGrid({ audioFormats = [], selectedQuality, onSelectQuality }) {
  if (!audioFormats || audioFormats.length === 0) {
    return (
      <div className="quality-empty-notice font-mono">
        <span>No audio streams detected for this media URL.</span>
      </div>
    );
  }

  return (
    <div className="quality-matrix-block audio-block">
      <div className="matrix-header-row">
        <div className="matrix-title-group">
          <Volume2 size={15} className="feature-icon cyan" />
          <h3 className="matrix-heading">Available Audio Bitrates ({audioFormats.length} Tracks)</h3>
        </div>
        <span className="matrix-meta font-mono">Lossless Audio Pipeline</span>
      </div>

      <div className="audio-matrix-grid">
        {audioFormats.map((item) => {
          const isSelected = selectedQuality === item.id;
          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              aria-label={`Select ${item.label} audio bitrate`}
              className={`matrix-card audio-card ${isSelected ? 'selected-audio' : ''}`}
              onClick={() => onSelectQuality(item.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectQuality(item.id);
                }
              }}
            >
              <div className="matrix-card-top">
                <div className="card-res-group">
                  <span className="res-title font-mono">{item.label}</span>
                  <span className="res-details">{item.subtitle}</span>
                  {item.codec && (
                    <span className="res-codec-info font-mono">{item.codec}</span>
                  )}
                </div>

                {item.badge && (
                  <span className={`badge-tag badge-${item.badgeType || 'neutral'}`}>
                    {item.badge}
                  </span>
                )}
              </div>

              <div className="matrix-card-bottom">
                <span className="card-filesize font-mono">{item.filesize || '~Variable'}</span>
                <div className="custom-radio-indicator">
                  {isSelected ? (
                    <div className="radio-dot-selected-green">
                      <Check size={11} className="check-glyph" />
                    </div>
                  ) : (
                    <div className="radio-dot-unselected"></div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
