import React, { useRef } from 'react';
import { Link2, Clipboard, Zap, ShieldCheck, Music, Film, X, RotateCcw } from './Icons';
import { readTextFromClipboard } from '../utils/helpers';

export default function Hero({
  urlInput,
  setUrlInput,
  onAnalyze,
  isLoading,
  onShowToast,
}) {
  const inputRef = useRef(null);

  const handlePasteClick = async () => {
    try {
      const text = await readTextFromClipboard();
      if (text) {
        setUrlInput(text);
        onShowToast('URL pasted from clipboard');
        if (inputRef.current) {
          inputRef.current.focus();
        }
      } else {
        onShowToast('Clipboard is empty or permissions denied.');
      }
    } catch {
      onShowToast('Paste enabled: Type or paste directly into input.');
    }
  };

  const handleClearClick = () => {
    setUrlInput('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      onAnalyze();
    }
  };

  return (
    <section id="home" className="hero-section">
      {/* Top Engine Pill */}
      <div className="hero-badge-container">
        <div className="status-pill glass-pill">
          <span className="green-pulse-dot"></span>
          <span className="pill-text-strong">Life Tube Engine</span>
          <span className="pill-separator">•</span>
          <span className="pill-text-muted">Multi-Stream Media Analyzer</span>
          <span className="pill-separator">•</span>
          <span className="pill-text-muted">High-Fidelity Extraction</span>
        </div>
      </div>

      {/* Main Heading */}
      <div className="hero-heading-group">
        <h1 className="hero-main-title font-serif">
          Download Video <span className="coral-ampersand">&amp;</span> Audio with Life Tube
        </h1>
        <p className="hero-lead-text">
          A high-performance media downloader interface designed for multiple video resolutions, lossless audio extraction, and container format selection.
        </p>
      </div>

      {/* Upgraded Unified URL Input Box */}
      <div className="hero-input-container">
        <div className={`unified-url-bar glass-panel ${isLoading ? 'disabled-bar' : ''}`}>
          <div className="url-bar-icon-wrap">
            <Link2 size={18} className="url-link-icon" />
          </div>

          <input
            ref={inputRef}
            type="text"
            className="unified-text-input font-mono"
            placeholder="Paste video URL here..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            autoComplete="off"
            spellCheck="false"
          />

          {/* Clear Input Button (Visible when text exists and not loading) */}
          {urlInput && !isLoading && (
            <button
              type="button"
              className="btn-clear-input"
              onClick={handleClearClick}
              title="Clear input"
              aria-label="Clear URL input"
            >
              <X size={14} />
            </button>
          )}

          <div className="url-bar-actions">
            <button
              type="button"
              className="btn-paste-action"
              onClick={handlePasteClick}
              title="Paste from clipboard"
              disabled={isLoading}
            >
              <Clipboard size={14} />
              <span>Paste URL</span>
            </button>

            <button
              type="button"
              className={`btn-analyze-action ${isLoading ? 'loading-pulse' : ''}`}
              onClick={onAnalyze}
              disabled={isLoading}
            >
              {isLoading ? (
                <RotateCcw size={15} className="spin-loading-icon" />
              ) : (
                <Zap size={15} className="bolt-icon" />
              )}
              <span>{isLoading ? 'Analyzing video...' : 'Analyze Video'}</span>
            </button>
          </div>
        </div>

        {/* Feature Badges Strip */}
        <div className="hero-feature-highlights">
          <div className="highlight-item">
            <Film size={13} className="highlight-icon coral" />
            <span>Up to 4K 60FPS Video</span>
          </div>
          <span className="highlight-separator">•</span>
          <div className="highlight-item">
            <Music size={13} className="highlight-icon cyan" />
            <span>Lossless MP3 &amp; M4A Audio</span>
          </div>
          <span className="highlight-separator">•</span>
          <div className="highlight-item">
            <ShieldCheck size={13} className="highlight-icon green" />
            <span>Multi-Format MP4 / WebM</span>
          </div>
        </div>
      </div>
    </section>
  );
}
