import React, { useState } from 'react';
import { 
  Music, 
  Sliders, 
  Download, 
  Check
} from './Icons';

export default function AudioExtractor({ onShowToast }) {
  const [selectedCodec, setSelectedCodec] = useState('mp3');
  const [selectedBitrate, setSelectedBitrate] = useState('320k');
  const [normalizeAudio, setNormalizeAudio] = useState(true);
  const [embedMetadata, setEmbedMetadata] = useState(true);
  const [embedThumbnail, setEmbedThumbnail] = useState(true);

  const codecs = [
    { id: 'mp3', name: 'MP3 (MPEG Audio Layer III)', ext: '.mp3', bestFor: 'Universal compatibility & Cars' },
    { id: 'flac', name: 'FLAC (Free Lossless Audio Codec)', ext: '.flac', bestFor: 'Audiophile bit-perfect archival' },
    { id: 'm4a', name: 'M4A / AAC (Apple Lossless Ready)', ext: '.m4a', bestFor: 'iPhone & Apple Music ecosystem' },
    { id: 'opus', name: 'Opus (Next-Gen Interactive Audio)', ext: '.opus', bestFor: 'Superior quality at lower bitrates' },
    { id: 'wav', name: 'WAV (Uncompressed PCM Studio)', ext: '.wav', bestFor: 'DAW mixing & Master editing' },
  ];

  const bitrates = [
    { id: '128k', label: '128 kbps (Standard)' },
    { id: '192k', label: '192 kbps (High)' },
    { id: '256k', label: '256 kbps (Studio)' },
    { id: '320k', label: '320 kbps (Maximum Master)' },
    { id: 'lossless', label: 'Lossless VBR (Bit-Exact)' },
  ];

  return (
    <div className="stream-harvester-container">
      {/* Top Engine Status Pill */}
      <div className="engine-status-pill-row">
        <div className="status-pill glass-pill">
          <span className="green-pulse-dot"></span>
          <span className="pill-text-strong">FFmpeg Audio Demuxer</span>
          <span className="pill-separator">•</span>
          <span className="pill-text-muted">LAME v3.100 &amp; libopus active</span>
          <span className="pill-separator">•</span>
          <span className="pill-text-muted">48kHz / 24-bit Ready</span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="harvester-hero-header">
        <h1 className="hero-title font-serif">
          Lossless Audio <span className="coral-ampersand">&amp;</span> Master Extractor
        </h1>
        <p className="hero-subtitle">
          Extract pristine audio streams from any video without re-encoding quality degradation. Automatically embed ID3 tags, chapter markers, and high-res cover art.
        </p>
      </div>

      {/* Codec Selection Matrix */}
      <div className="matrix-section">
        <div className="matrix-header-row">
          <div className="matrix-title-group">
            <Music size={16} className="feature-icon coral" />
            <h3 className="matrix-heading">Select Output Audio Codec</h3>
          </div>
          <div className="matrix-meta font-mono">
            Demuxer: Native FFmpeg Pipeline
          </div>
        </div>

        <div className="codecs-grid">
          {codecs.map((c) => {
            const isSelected = selectedCodec === c.id;
            return (
              <div 
                key={c.id} 
                className={`codec-card glass-panel ${isSelected ? 'selected-coral' : ''}`}
                onClick={() => {
                  setSelectedCodec(c.id);
                  onShowToast(`Selected audio format: ${c.name}`);
                }}
              >
                <div className="codec-card-header">
                  <span className="codec-name font-mono">{c.name}</span>
                  <span className="codec-ext badge-tag badge-coral font-mono">{c.ext}</span>
                </div>
                <p className="codec-desc">{c.bestFor}</p>
                <div className="codec-card-footer">
                  <span className="font-mono text-muted text-xs">Direct Stream Copy Compatible</span>
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

      {/* Audio Mastering & Bitrate Controls */}
      <div className="audio-controls-panel glass-panel">
        <div className="audio-controls-header">
          <div className="matrix-title-group">
            <Sliders size={16} className="feature-icon cyan" />
            <h3 className="matrix-heading">Audio Mastering &amp; Post-Processing</h3>
          </div>
        </div>

        <div className="audio-options-grid">
          {/* Bitrate Selector */}
          <div className="option-column">
            <label className="option-label font-mono">Target Bitrate / Sample Rate</label>
            <div className="bitrate-pills-list">
              {bitrates.map((b) => (
                <button
                  key={b.id}
                  className={`bitrate-pill ${selectedBitrate === b.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedBitrate(b.id);
                    onShowToast(`Target bitrate set to: ${b.label}`);
                  }}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="option-column">
            <label className="option-label font-mono">Audio Enhancement Options</label>
            <div className="toggles-list">
              <label className="toggle-item">
                <input 
                  type="checkbox" 
                  checked={normalizeAudio} 
                  onChange={(e) => setNormalizeAudio(e.target.checked)} 
                />
                <span className="toggle-text">EBU R128 Audio Normalization (Peak leveling)</span>
              </label>

              <label className="toggle-item">
                <input 
                  type="checkbox" 
                  checked={embedMetadata} 
                  onChange={(e) => setEmbedMetadata(e.target.checked)} 
                />
                <span className="toggle-text">Embed Artist, Title &amp; Album ID3 Metadata</span>
              </label>

              <label className="toggle-item">
                <input 
                  type="checkbox" 
                  checked={embedThumbnail} 
                  onChange={(e) => setEmbedThumbnail(e.target.checked)} 
                />
                <span className="toggle-text">Embed 4K HQ Thumbnail as Cover Artwork</span>
              </label>
            </div>
          </div>
        </div>

        <div className="audio-panel-footer">
          <button 
            className="action-btn-primary"
            onClick={() => onShowToast(`Extracting audio in ${selectedCodec.toUpperCase()} format...`)}
          >
            <Download size={15} />
            <span>Extract High-Res Audio Track</span>
          </button>
        </div>
      </div>
    </div>
  );
}
