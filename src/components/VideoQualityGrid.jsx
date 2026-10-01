import React from 'react';
import { Film, Check } from './Icons';

export default function VideoQualityGrid({ videoFormats = [], selectedQuality, onSelectQuality }) {
  if (!videoFormats || videoFormats.length === 0) {
    return (
      <div className="quality-empty-notice font-mono">
        <span>No video streams detected for this media URL.</span>
      </div>
    );
  }

  return (
    <div className="quality-matrix-block">
      <div className="matrix-header-row">
        <div className="matrix-title-group">
          <Film size={15} className="feature-icon coral" />
          <h3 className="matrix-heading">Available Video Resolutions ({videoFormats.length} Streams)</h3>
        </div>
        <span className="matrix-meta font-mono">Direct Multi-Stream Alignment</span>
      </div>

      <div className="video-matrix-grid">
        {videoFormats.map((item) => {
          const isSelected = selectedQuality === item.id;
          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              aria-label={`Select ${item.label} resolution`}
              className={`matrix-card ${isSelected ? 'selected' : ''}`}
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
                  <span className="res-details font-mono">
                    {item.resolution} {item.fps ? `• ${item.fps}fps` : ''}
                  </span>
                  {item.vcodec && (
                    <span className="res-codec-info font-mono">{item.vcodec}</span>
                  )}
                </div>

                <div className="card-badge-group">
                  {item.badge && (
                    <span className={`badge-tag badge-${item.badgeType || 'neutral'}`}>
                      {item.badge}
                    </span>
                  )}
                  {isSelected && (
                    <span className="badge-tag badge-selected">
                      <Check size={10} /> Selected
                    </span>
                  )}
                </div>
              </div>

              <div className="matrix-card-bottom">
                <span className="card-filesize font-mono">{item.filesize || '~Variable'}</span>
                <div className="custom-radio-indicator">
                  {isSelected ? (
                    <div className="radio-dot-selected">
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
