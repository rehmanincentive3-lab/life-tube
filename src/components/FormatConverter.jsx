import React, { useState } from 'react';
import { 
  RefreshCw, 
  Film, 
  Cpu, 
  Check
} from './Icons';

export default function FormatConverter({ onShowToast }) {
  const [sourceFormat] = useState('webm');
  const [targetContainer, setTargetContainer] = useState('mp4');
  const [videoCodec] = useState('copy');
  const [audioCodec] = useState('copy');
  const [hardwareAccel, setHardwareAccel] = useState('nvenc');

  const containers = [
    { id: 'mp4', name: 'MP4 (MPEG-4 Part 14)', desc: 'Highest hardware compatibility across TVs, phones and editors' },
    { id: 'mkv', name: 'MKV (Matroska Video)', desc: 'Supports multi-track audio, soft subtitles and chapters' },
    { id: 'webm', name: 'WebM (VP9 / AV1)', desc: 'Optimized for modern browsers, HTML5 and ultra-low bandwidth' },
    { id: 'mov', name: 'MOV (Apple QuickTime)', desc: 'Native Apple ProRes and Final Cut Pro timeline editing' },
  ];

  const handleConvert = () => {
    onShowToast(`Dispatched FFmpeg muxing task: remux.${targetContainer}`);
  };

  return (
    <div className="stream-harvester-container">
      {/* Top Engine Status Pill */}
      <div className="engine-status-pill-row">
        <div className="status-pill glass-pill">
          <span className="green-pulse-dot"></span>
          <span className="pill-text-strong">FFmpeg Remuxing Matrix</span>
          <span className="pill-separator">•</span>
          <span className="pill-text-muted">NVIDIA NVENC &amp; QuickSync Enabled</span>
          <span className="pill-separator">•</span>
          <span className="pill-text-muted">Zero Re-encoding Loss</span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="harvester-hero-header">
        <h1 className="hero-title font-serif">
          Transcode Matrix <span className="coral-ampersand">&amp;</span> Container Remuxer
        </h1>
        <p className="hero-subtitle">
          Instantly convert MKV, WebM, and MP4 containers with direct bitstream stream-copy (no quality loss and 100x faster than full transcoding).
        </p>
      </div>

      {/* Container Picker Grid */}
      <div className="matrix-section">
        <div className="matrix-header-row">
          <div className="matrix-title-group">
            <Film size={16} className="feature-icon coral" />
            <h3 className="matrix-heading">Choose Destination Container</h3>
          </div>
          <div className="matrix-meta font-mono">
            Mode: Direct Stream Copy (-c:v copy -c:a copy)
          </div>
        </div>

        <div className="codecs-grid">
          {containers.map((c) => {
            const isSelected = targetContainer === c.id;
            return (
              <div 
                key={c.id} 
                className={`codec-card glass-panel ${isSelected ? 'selected-coral' : ''}`}
                onClick={() => {
                  setTargetContainer(c.id);
                  onShowToast(`Destination container: ${c.name}`);
                }}
              >
                <div className="codec-card-header">
                  <span className="codec-name font-mono">{c.name}</span>
                  <span className="badge-tag badge-coral font-mono">.{c.id}</span>
                </div>
                <p className="codec-desc">{c.desc}</p>
                <div className="codec-card-footer">
                  <span className="font-mono text-muted text-xs">Direct Stream Copy Enabled</span>
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

      {/* Encoder Hardware Acceleration Settings */}
      <div className="audio-controls-panel glass-panel">
        <div className="audio-controls-header">
          <div className="matrix-title-group">
            <Cpu size={16} className="feature-icon cyan" />
            <h3 className="matrix-heading">Hardware Acceleration &amp; Encoder Engine</h3>
          </div>
        </div>

        <div className="audio-options-grid">
          <div className="option-column">
            <label className="option-label font-mono">GPU Acceleration Core</label>
            <div className="bitrate-pills-list">
              <button 
                className={`bitrate-pill ${hardwareAccel === 'nvenc' ? 'active' : ''}`}
                onClick={() => setHardwareAccel('nvenc')}
              >
                NVIDIA NVENC (RTX Ultra Fast)
              </button>
              <button 
                className={`bitrate-pill ${hardwareAccel === 'qsv' ? 'active' : ''}`}
                onClick={() => setHardwareAccel('qsv')}
              >
                Intel QuickSync (QSV)
              </button>
              <button 
                className={`bitrate-pill ${hardwareAccel === 'cpu' ? 'active' : ''}`}
                onClick={() => setHardwareAccel('cpu')}
              >
                CPU libx264 (Software Master)
              </button>
            </div>
          </div>

          <div className="option-column">
            <label className="option-label font-mono">Pipeline Command Preview</label>
            <div className="cli-snippet font-mono">
              <code>ffmpeg -i input.{sourceFormat} -c:v {videoCodec} -c:a {audioCodec} output.{targetContainer}</code>
            </div>
          </div>
        </div>

        <div className="audio-panel-footer">
          <button className="action-btn-primary" onClick={handleConvert}>
            <RefreshCw size={15} />
            <span>Execute Transcode Pipeline</span>
          </button>
        </div>
      </div>
    </div>
  );
}
