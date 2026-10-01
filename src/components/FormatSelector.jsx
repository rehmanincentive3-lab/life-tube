import React from 'react';
import { Film, Music, Check } from './Icons';
import { MEDIA_MODES } from '../types/mediaTypes';

const DEFAULT_VIDEO_FORMATS = [
  { id: 'mp4', name: 'MP4', description: 'Universal container, maximum compatibility' },
  { id: 'webm', name: 'WebM', description: 'Open web media format, VP9/AV1 codec' },
];

const DEFAULT_AUDIO_FORMATS = [
  { id: 'mp3', name: 'MP3', description: 'MPEG Layer-3 universal audio' },
  { id: 'm4a', name: 'M4A', description: 'AAC audio codec, optimized for Apple & modern players' },
];

export default function FormatSelector({ mode, availableContainers, selectedFormat, onSelectFormat }) {
  const isVideo = mode === MEDIA_MODES.VIDEO;
  const baseFormats = isVideo ? DEFAULT_VIDEO_FORMATS : DEFAULT_AUDIO_FORMATS;

  // Filter formats based on availableContainers if provided by API
  const filteredFormats = availableContainers && availableContainers.length > 0
    ? baseFormats.filter((f) => availableContainers.includes(f.id))
    : baseFormats;

  return (
    <div className="format-selector-block">
      <div className="format-header-row">
        <div className="format-title-group">
          {isVideo ? (
            <Film size={15} className="format-type-icon coral" />
          ) : (
            <Music size={15} className="format-type-icon cyan" />
          )}
          <span className="format-label">Container Format</span>
        </div>
        <span className="format-subtext font-mono">Select target format encoding</span>
      </div>

      <div className="formats-options-grid">
        {filteredFormats.map((fmt) => {
          const isSelected = selectedFormat === fmt.id;
          return (
            <div
              key={fmt.id}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              aria-label={`Select container format ${fmt.name}`}
              className={`format-option-card glass-panel ${
                isSelected ? (isVideo ? 'selected-coral' : 'selected-green') : ''
              }`}
              onClick={() => onSelectFormat(fmt.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectFormat(fmt.id);
                }
              }}
            >
              <div className="format-card-main">
                <span className="format-name font-mono">{fmt.name}</span>
                <span className="format-desc">{fmt.description}</span>
              </div>

              <div className="format-radio-wrap">
                {isSelected ? (
                  <div className={`radio-dot-active ${isVideo ? 'coral' : 'green'}`}>
                    <Check size={11} />
                  </div>
                ) : (
                  <div className="radio-dot-idle"></div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
