import React from 'react';
import { Film, Music } from './Icons';
import { MEDIA_MODES } from '../types/formatTypes';

export default function VideoAudioSwitcher({ mode, onModeChange }) {
  const isVideo = mode === MEDIA_MODES.VIDEO;
  const isAudio = mode === MEDIA_MODES.AUDIO;

  return (
    <div className="video-audio-switcher-container">
      <div className="switcher-segmented-bar glass-panel">
        <button
          type="button"
          className={`switcher-tab-btn video-tab ${isVideo ? 'active' : ''}`}
          onClick={() => onModeChange(MEDIA_MODES.VIDEO)}
        >
          <Film size={16} className="switcher-icon" />
          <span className="switcher-text font-bold">VIDEO</span>
          {isVideo && <span className="switcher-active-glow"></span>}
        </button>

        <button
          type="button"
          className={`switcher-tab-btn audio-tab ${isAudio ? 'active' : ''}`}
          onClick={() => onModeChange(MEDIA_MODES.AUDIO)}
        >
          <Music size={16} className="switcher-icon" />
          <span className="switcher-text font-bold">AUDIO</span>
          {isAudio && <span className="switcher-active-glow green"></span>}
        </button>
      </div>
    </div>
  );
}
