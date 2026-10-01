import React, { useState, useEffect } from 'react';
import {
  Link2,
  Clipboard,
  Zap,
  Play,
  Film,
  Music,
  CheckCircle2,
  Pause,
  RotateCcw,
  X,
  Volume2,
  Check,
  HardDriveDownload,
  ShieldCheck
} from './Icons';

export default function StreamHarvester({ onShowToast }) {
  // Input URL State
  const [urlInput, setUrlInput] = useState('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const [isHarvesting, setIsHarvesting] = useState(false);
  const [hasHarvested, setHasHarvested] = useState(true);

  // Extraction mode: 'video' | 'audio'
  const [extractionMode, setExtractionMode] = useState('video');
  const [activePreset, setActivePreset] = useState('best_quality');

  // Selected format states
  const [selectedVideo, setSelectedVideo] = useState('2160p');
  const [selectedAudio, setSelectedAudio] = useState('320k');

  // Pipeline execution & download telemetry state
  const [downloadProgress, setDownloadProgress] = useState(68);
  const [isPaused, setIsPaused] = useState(false);
  const [downloadSpeed, setDownloadSpeed] = useState(48.6);
  const [elapsedSeconds, setElapsedSeconds] = useState(19);
  const [etaSeconds, setEtaSeconds] = useState(8);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Video Matrix Options
  const videoOptions = [
    { id: '144p', res: '144p', details: 'MP4 • 256x144', size: '32 MB', badge: 'Fast', badgeType: 'dim' },
    { id: '240p', res: '240p', details: 'MP4 • 426x240', size: '58 MB', badge: 'Fast', badgeType: 'dim' },
    { id: '360p', res: '360p', details: 'MP4 • 640x360', size: '112 MB', badge: 'SD', badgeType: 'dim' },
    { id: '480p', res: '480p', details: 'MP4 • 854x480', size: '220 MB', badge: 'SD', badgeType: 'dim' },
    { id: '720p', res: '720p HD', details: 'MP4 • 1280x720', size: '450 MB', badge: 'Popular', badgeType: 'neutral' },
    { id: '1080p', res: '1080p FHD', details: 'MP4 • 1920x1080', subtext: '68 FPS Crystal Clear', size: '890 MB', badge: 'Recommended', badgeType: 'green' },
    { id: '1440p', res: '1440p 2K', details: 'QHD • 60 FPS', size: '1.15 GB', badge: '2K Studio', badgeType: 'neutral' },
    { id: '2160p', res: '2160p 4K', details: 'Ultra HD • 60 FPS', size: '1.42 GB', badge: 'HDR', badgeType: 'coral', isSelectedPill: true },
  ];

  // Audio Matrix Options
  const audioOptions = [
    { id: '64k', bitrate: '64 kbps', subtitle: 'Low Bandwidth / Voice', size: '6.8 MB' },
    { id: '128k', bitrate: '128 kbps', subtitle: 'Standard Quality', size: '13.6 MB' },
    { id: '192k', bitrate: '192 kbps', subtitle: 'High Fidelity', size: '20.4 MB' },
    { id: '256k', bitrate: '256 kbps', subtitle: 'Studio Dynamic Range', size: '27.2 MB' },
    { id: '320k', bitrate: '320 kbps', subtitle: 'Maximum Bitrate', size: '34.0 MB', badge: 'Master', badgeType: 'green' },
  ];

  // Presets list
  const presets = [
    { id: 'best_quality', label: 'Best Quality (Recommended)' },
    { id: 'best_audio', label: 'Best Audio' },
    { id: 'mp4', label: 'MP4' },
    { id: 'webm', label: 'WebM' },
    { id: 'm4a', label: 'M4A' },
    { id: 'mp3', label: 'MP3' },
  ];

  // Handle Preset Selection
  const handlePresetSelect = (presetId) => {
    setActivePreset(presetId);
    if (presetId === 'best_quality') {
      setExtractionMode('video');
      setSelectedVideo('2160p');
      setSelectedAudio('320k');
      onShowToast('Applied preset: Best Quality (4K HDR + 320k MP3)');
    } else if (presetId === 'best_audio') {
      setExtractionMode('audio');
      setSelectedAudio('320k');
      onShowToast('Applied preset: Best Audio (320kbps Master)');
    } else if (presetId === 'mp4') {
      setExtractionMode('video');
      setSelectedVideo('1080p');
      onShowToast('Applied preset: Standard 1080p MP4');
    } else if (presetId === 'webm') {
      setExtractionMode('video');
      setSelectedVideo('1440p');
      onShowToast('Applied preset: WebM VP9 1440p');
    } else if (presetId === 'mp3') {
      setExtractionMode('audio');
      setSelectedAudio('256k');
      onShowToast('Applied preset: MP3 256kbps');
    } else if (presetId === 'm4a') {
      setExtractionMode('audio');
      setSelectedAudio('192k');
      onShowToast('Applied preset: Apple AAC / M4A');
    }
  };

  // Live progress simulation ticker
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          return 100;
        }
        return Number((prev + 0.4).toFixed(1));
      });

      setElapsedSeconds((prev) => prev + 1);
      setEtaSeconds((prev) => (prev > 1 ? prev - 1 : 1));

      // Realistic throughput fluctuation
      setDownloadSpeed((prev) => {
        const delta = (Math.random() - 0.48) * 1.5;
        const newSpeed = Math.max(38.0, Math.min(64.2, prev + delta));
        return Number(newSpeed.toFixed(1));
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused]);

  // Handle Paste from Clipboard
  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setUrlInput(text.trim());
          onShowToast('Pasted URL from clipboard');
          return;
        }
      }
      onShowToast('Clipboard accessed: Enter stream URL');
    } catch {
      onShowToast('Paste enabled: Enter URL in the field');
    }
  };

  // Simulate Harvest Stream
  const handleHarvestStream = () => {
    if (!urlInput.trim()) {
      onShowToast('Please enter a valid video stream URL');
      return;
    }
    setIsHarvesting(true);
    onShowToast('Harvesting stream metadata with yt-dlp core...');

    setTimeout(() => {
      setIsHarvesting(false);
      setHasHarvested(true);
      setDownloadProgress(25);
      setElapsedSeconds(3);
      setEtaSeconds(14);
      onShowToast('Stream parsed successfully in 0.28s!');
    }, 900);
  };

  // Handle Download to Disk
  const handleDownloadDisk = () => {
    onShowToast('Dispatched output stream to local disk: Cybernetic_Horizons_4K.mp4');
  };

  // Selected video object for dynamic payload calculation
  const currentVideoObj = videoOptions.find((v) => v.id === selectedVideo) || videoOptions[7];

  return (
    <div className="stream-harvester-container">
      {/* Top Engine Status Pill */}
      <div className="engine-status-pill-row">
        <div className="status-pill glass-pill">
          <span className="green-pulse-dot"></span>
          <span className="pill-text-strong">yt-dlp Engine Ready</span>
          <span className="pill-separator">•</span>
          <span className="pill-text-muted">v2026.03.1 Active</span>
          <span className="pill-separator">•</span>
          <span className="pill-text-muted">Node Cluster US-East</span>
        </div>
      </div>

      {/* Main Hero Header */}
      <div className="harvester-hero-header">
        <h1 className="hero-title font-serif">
          Download Video <span className="coral-ampersand">&amp;</span> Audio
        </h1>
        <p className="hero-subtitle">
          Fast downloads powered by <code className="tech-badge-code">yt-dlp</code> — High-throughput multi-stream extraction with zero transcoding loss.
        </p>
      </div>

      {/* URL Stream Input Bar */}
      <div className="stream-input-wrapper glass-panel">
        <div className="input-icon-group">
          <Link2 size={18} className="link-icon" />
        </div>
        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="Paste YouTube, Vimeo, TikTok or Stream URL here..."
          className="stream-url-input font-mono"
        />
        <div className="input-actions-group">
          <button
            type="button"
            className="action-btn-secondary"
            onClick={handlePasteClipboard}
            title="Paste from clipboard"
          >
            <Clipboard size={15} />
            <span>Paste Clipboard</span>
          </button>
          <button
            type="button"
            className={`action-btn-primary ${isHarvesting ? 'harvesting-pulse' : ''}`}
            onClick={handleHarvestStream}
            disabled={isHarvesting}
          >
            <Zap size={15} className="harvest-bolt" />
            <span>{isHarvesting ? 'Parsing...' : 'Harvest Stream'}</span>
          </button>
        </div>
      </div>

      {/* Quick Feature Badges Row */}
      <div className="feature-badges-row">
        <div className="feature-pill">
          <Zap size={12} className="feature-icon coral" />
          <span>Supports 4K/8K 60FPS</span>
        </div>
        <span className="feature-dot">•</span>
        <div className="feature-pill">
          <Music size={12} className="feature-icon cyan" />
          <span>Lossless FLAC / Opus / MP3 320kbps</span>
        </div>
        <span className="feature-dot">•</span>
        <div className="feature-pill">
          <ShieldCheck size={12} className="feature-icon green" />
          <span>DRM-Free Direct Stream Bypass</span>
        </div>
        <span className="feature-dot">•</span>
        <div className="feature-pill">
          <Zap size={12} className="feature-icon coral" />
          <span>FFmpeg Demuxing Built-in</span>
        </div>
      </div>

      {/* Parsed Video Card (Hero Metadata Preview) */}
      {hasHarvested && (
        <div className="parsed-video-hero-card glass-panel">
          {/* Left: Video 16:9 Thumbnail Preview */}
          <div className="video-thumbnail-container" onClick={() => setIsVideoModalOpen(true)}>
            <div className="thumbnail-art">
              {/* Synthetic Futuristic Waveform / Grid Glow */}
              <div className="thumbnail-overlay-grid"></div>
              <div className="thumbnail-mesh-glow"></div>
              
              {/* Top Resolution and Codec Badges */}
              <div className="thumb-badge-top-left">
                <span className="badge-pill uhd">4K UHD</span>
                <span className="badge-pill codec">AV01 / Opus</span>
              </div>

              {/* Center Play Button */}
              <div className="thumb-play-button-wrap">
                <button className="thumb-play-button" aria-label="Preview video">
                  <Play size={20} fill="#ffffff" />
                </button>
              </div>

              {/* Bottom Duration Badge */}
              <div className="thumb-duration-pill font-mono">
                14:28
              </div>
            </div>
          </div>

          {/* Right: Video Metadata Details */}
          <div className="video-details-column">
            {/* Status & ID bar */}
            <div className="details-header-row">
              <div className="parsed-success-tag">
                <span className="green-dot"></span>
                <span>Parsed successfully in 0.28s</span>
              </div>
              <div className="video-id-badge font-mono">
                ID: #yt-8Fk98Lq
              </div>
            </div>

            {/* Video Title */}
            <h2 className="video-card-title">
              Cybernetic Horizons: Quantum Computing &amp; Deep Spatial Synthesis [Original Score 4K 60FPS]
            </h2>

            {/* Channel & Stats Line */}
            <p className="video-channel-line">
              <span className="channel-author">Aura Studios Lab</span>
              <span className="meta-sep">•</span>
              <span className="channel-views">1.4M views</span>
              <span className="meta-sep">•</span>
              <span className="channel-date">Uploaded 2 days ago</span>
            </p>

            {/* 3 Metrics Grid */}
            <div className="video-metrics-grid">
              {/* Box 1: Duration */}
              <div className="metric-box">
                <span className="metric-title">DURATION</span>
                <span className="metric-value font-mono">14m 28s</span>
                <span className="metric-sub font-mono green">868 total secs</span>
              </div>

              {/* Box 2: Available Streams */}
              <div className="metric-box">
                <span className="metric-title">AVAILABLE STREAMS</span>
                <span className="metric-value font-mono">8 Video / 5 Audio</span>
                <span className="metric-sub font-mono">HDR10+ / Stereo</span>
              </div>

              {/* Box 3: Raw Payload */}
              <div className="metric-box">
                <span className="metric-title">RAW PAYLOAD</span>
                <span className="metric-value font-mono">{currentVideoObj.size}</span>
                <span className="metric-sub font-mono">+48 MB Master Track</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode Selector & Quick Presets Bar */}
      <div className="mode-presets-bar">
        {/* Left Extraction Mode Tabs */}
        <div className="mode-selector-group">
          <button
            className={`mode-btn ${extractionMode === 'video' ? 'active' : ''}`}
            onClick={() => {
              setExtractionMode('video');
              onShowToast('Switched to Video Extraction (MP4 / WebM)');
            }}
          >
            <Film size={15} />
            <span>Video Extraction (MP4 / WebM)</span>
          </button>
          <button
            className={`mode-btn ${extractionMode === 'audio' ? 'active' : ''}`}
            onClick={() => {
              setExtractionMode('audio');
              onShowToast('Switched to Audio Only (MP3 / M4A / FLAC / Opus)');
            }}
          >
            <Music size={15} />
            <span>Audio Only (MP3 / M4A / FLAC / Opus)</span>
          </button>
        </div>

        {/* Right Presets Filter Badges */}
        <div className="presets-filter-group">
          <span className="presets-label">Presets:</span>
          <div className="presets-pills-list">
            {presets.map((p) => {
              const isSelected = activePreset === p.id;
              return (
                <button
                  key={p.id}
                  className={`preset-pill-btn ${isSelected ? 'active-coral' : ''}`}
                  onClick={() => handlePresetSelect(p.id)}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Video Resolution & Bitrate Matrix */}
      {extractionMode === 'video' && (
        <section className="matrix-section">
          <div className="matrix-header-row">
            <div className="matrix-title-group">
              <Film size={16} className="feature-icon coral" />
              <h3 className="matrix-heading">Video Resolution &amp; Bitrate Matrix</h3>
            </div>
            <div className="matrix-meta font-mono">
              Container: Direct FFmpeg Muxer
            </div>
          </div>

          {/* 8 Cards Grid (2 rows x 4 cols) */}
          <div className="video-matrix-grid">
            {videoOptions.map((opt) => {
              const isSelected = selectedVideo === opt.id;
              return (
                <div
                  key={opt.id}
                  className={`matrix-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedVideo(opt.id);
                    onShowToast(`Selected resolution: ${opt.res} (${opt.size})`);
                  }}
                >
                  <div className="matrix-card-top">
                    <div className="card-res-group">
                      <span className="res-title font-mono">{opt.res}</span>
                      <span className="res-details font-mono">{opt.details}</span>
                      {opt.subtext && (
                        <span className="res-subtext font-mono">{opt.subtext}</span>
                      )}
                    </div>
                    
                    <div className="card-badge-group">
                      {opt.badge && (
                        <span className={`badge-tag badge-${opt.badgeType}`}>
                          {opt.badge}
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
                    <span className="card-filesize font-mono">{opt.size}</span>
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
        </section>
      )}

      {/* Audio Bitrate & Demux Streams */}
      <section className="matrix-section audio-matrix-section">
        <div className="matrix-header-row">
          <div className="matrix-title-group">
            <Volume2 size={16} className="feature-icon cyan" />
            <h3 className="matrix-heading">Audio Bitrate &amp; Demux Streams</h3>
          </div>
          <div className="matrix-meta font-mono">
            Codec: LAME / libmp3lame
          </div>
        </div>

        {/* 5 Audio Bitrate Cards */}
        <div className="audio-matrix-grid">
          {audioOptions.map((audio) => {
            const isSelected = selectedAudio === audio.id;
            return (
              <div
                key={audio.id}
                className={`matrix-card audio-card ${isSelected ? 'selected-audio' : ''}`}
                onClick={() => {
                  setSelectedAudio(audio.id);
                  onShowToast(`Selected audio track: ${audio.bitrate}`);
                }}
              >
                <div className="matrix-card-top">
                  <div className="card-res-group">
                    <span className="res-title font-mono">{audio.bitrate}</span>
                    <span className="res-details">{audio.subtitle}</span>
                  </div>

                  {audio.badge && (
                    <span className={`badge-tag badge-${audio.badgeType}`}>
                      {audio.badge}
                    </span>
                  )}
                </div>

                <div className="matrix-card-bottom">
                  <span className="card-filesize font-mono">{audio.size}</span>
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
      </section>

      {/* Active yt-dlp Pipeline Stream / Live Telemetry Monitor */}
      <section className="pipeline-monitor-card glass-panel">
        {/* Header */}
        <div className="pipeline-header-row">
          <div className="pipeline-title-group">
            <span className="pipeline-live-dot"></span>
            <span className="pipeline-name">Active yt-dlp Pipeline Stream #1</span>
            <span className="muxing-badge font-mono">Muxing Queue</span>
          </div>

          <div className="pipeline-submeta font-mono">
            <span>PID: 40992</span>
            <span className="meta-sep">•</span>
            <span>Protocol: HTTPS-DASH-Mux</span>
            <span className="meta-sep">•</span>
            <span>Threads: 16</span>
          </div>

          <div className="socket-status-badge font-mono">
            <span className="green-dot"></span>
            <span>Socket Stable (14ms)</span>
          </div>
        </div>

        {/* 4 Metrics Readout Bar */}
        <div className="pipeline-stats-grid">
          {/* Box 1 */}
          <div className="telemetry-box">
            <span className="telemetry-label">STREAM PROFILE</span>
            <span className="telemetry-value font-mono">
              {extractionMode === 'video' ? `MP4 ${currentVideoObj.res}` : 'Audio Only'}
            </span>
            <span className="telemetry-sub font-mono">60fps HDR (AV01)</span>
          </div>

          {/* Box 2 */}
          <div className="telemetry-box">
            <span className="telemetry-label">PAYLOAD EST.</span>
            <span className="telemetry-value font-mono">{currentVideoObj.size}</span>
            <span className="telemetry-sub font-mono">Chunk 412 of 604</span>
          </div>

          {/* Box 3 */}
          <div className="telemetry-box">
            <span className="telemetry-label">THROUGHPUT</span>
            <span className="telemetry-value font-mono green">
              {isPaused ? '0.0 MB/s' : `${downloadSpeed} MB/s`}
            </span>
            <span className="telemetry-sub font-mono">Peak: 64.2 MB/s</span>
          </div>

          {/* Box 4 */}
          <div className="telemetry-box">
            <span className="telemetry-label">TIME REMAINING</span>
            <span className="telemetry-value font-mono">
              00:{etaSeconds < 10 ? `0${etaSeconds}` : etaSeconds}s ETA
            </span>
            <span className="telemetry-sub font-mono">
              Elapsed: 00:{elapsedSeconds < 10 ? `0${elapsedSeconds}` : elapsedSeconds}s
            </span>
          </div>
        </div>

        {/* Progress Stream Bar */}
        <div className="stream-progress-section">
          <div className="progress-label-row">
            <div className="stream-action-text">
              <RotateCcw size={13} className={`stream-spin ${isPaused ? '' : 'spinning'}`} />
              <span>
                {downloadProgress >= 100 
                  ? 'Stream download complete. Ready for disk export.' 
                  : isPaused 
                  ? 'Stream paused by user' 
                  : 'Downloading stream fragments...'}
              </span>
            </div>
            <div className="progress-fraction font-mono">
              <span>{Math.min(100, Math.round(downloadProgress))}%</span>
              <span className="meta-sep">•</span>
              <span>985.6 MB / {currentVideoObj.size}</span>
            </div>
          </div>

          {/* Glowing Animated Bar */}
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{ width: `${Math.min(100, downloadProgress)}%` }}
            >
              <div className="progress-shimmer"></div>
            </div>
          </div>
        </div>

        {/* Console Log Terminal Strip */}
        <div className="terminal-status-strip font-mono">
          <div className="terminal-left-log">
            <span className="log-tag">[download]</span>
            <span className="log-text">
              {downloadProgress.toFixed(1)}% of ~{currentVideoObj.size} at {downloadSpeed}MiB/s ETA 00:08 (frag 412/604)
            </span>
          </div>
          <div className="terminal-right-status">
            FFmpeg Direct Link Active
          </div>
        </div>

        {/* Action Controls Footer */}
        <div className="pipeline-controls-footer">
          <div className="controls-left-buttons">
            <button
              className="btn-download-disk"
              onClick={handleDownloadDisk}
            >
              <HardDriveDownload size={16} />
              <span>Download to Disk</span>
            </button>

            <button
              className="btn-secondary-action"
              onClick={() => {
                setIsPaused(!isPaused);
                onShowToast(isPaused ? 'Stream pipeline resumed' : 'Stream pipeline paused');
              }}
            >
              {isPaused ? <Play size={15} /> : <Pause size={15} />}
              <span>{isPaused ? 'Resume Stream' : 'Pause Stream'}</span>
            </button>

            <button
              className="btn-secondary-action btn-cancel"
              onClick={() => {
                setDownloadProgress(0);
                onShowToast('Stream extraction cancelled');
              }}
            >
              <X size={15} />
              <span>Cancel</span>
            </button>
          </div>

          <div className="controls-right-status font-mono">
            <CheckCircle2 size={15} className="ready-icon green" />
            <span>Ready for fast export</span>
          </div>
        </div>
      </section>

      {/* Optional Video Playback Modal */}
      {isVideoModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsVideoModalOpen(false)}>
          <div className="video-player-modal glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title font-mono">4K Ultra HD Stream Preview</h3>
              <button className="modal-close-btn" onClick={() => setIsVideoModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-player-body">
              <div className="synthetic-player">
                <div className="player-watermark font-mono">LIFE TUBE // ULTRA PIPELINE 4K 60FPS</div>
                <div className="player-center-content">
                  <Play size={48} className="player-glow-play" />
                  <p className="player-label font-mono">Cybernetic Horizons: Quantum Computing &amp; Deep Spatial Synthesis</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
