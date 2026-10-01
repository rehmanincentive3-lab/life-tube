import React from 'react';
import { 
  DownloadCloud, 
  RotateCcw, 
  Download,
  Film,
  Music
} from './Icons';
import MediaInfoCard from './MediaInfoCard';
import VideoAudioSwitcher from './VideoAudioSwitcher';
import FormatSelector from './FormatSelector';
import VideoQualityGrid from './VideoQualityGrid';
import AudioQualityGrid from './AudioQualityGrid';
import ErrorState from './ErrorState';
import DownloadProgressCard from './DownloadProgressCard';
import { MEDIA_MODES, UI_STATES } from '../types/mediaTypes';
import { JOB_STATUS } from '../services/downloadService';

export default function DownloaderCard({
  uiState,
  mediaData,
  mediaMode,
  setMediaMode,
  selectedFormat,
  setSelectedFormat,
  selectedQuality,
  setSelectedQuality,
  errorMessage,
  onRetry,
  onEditUrl,
  onReset,
  onShowToast,
  activeJob,
  onStartDownload,
  onCancelJob,
  onRetryJob,
  onDismissProgress,
  onResetDownloadState,
}) {
  const isVideo = mediaMode === MEDIA_MODES.VIDEO;
  const isJobActive = Boolean(activeJob);
  const isDownloading = isJobActive && [
    JOB_STATUS.QUEUED,
    JOB_STATUS.PREPARING,
    JOB_STATUS.DOWNLOADING,
    JOB_STATUS.PROCESSING,
    JOB_STATUS.FINALIZING,
  ].includes(activeJob.status);

  return (
    <section id="downloader" className="main-downloader-section">
      <div className="downloader-card-container glass-panel">
        
        {/* ===================================================================
            1. EMPTY STATE (Default before URL is analyzed)
            =================================================================== */}
        {uiState === UI_STATES.EMPTY && (
          <div className="downloader-empty-state">
            <div className="empty-state-icon-aura">
              <DownloadCloud size={36} className="empty-state-cloud coral" />
              <span className="empty-aura-ring"></span>
            </div>

            <h3 className="empty-state-heading font-serif">
              Ready for Media Extraction
            </h3>

            <p className="empty-state-message">
              Paste a video URL to see available download options.
            </p>

            <div className="empty-state-hints font-mono">
              <span className="hint-pill">YouTube</span>
              <span className="hint-pill">Vimeo</span>
              <span className="hint-pill">TikTok</span>
              <span className="hint-pill">Dailymotion</span>
              <span className="hint-pill">Soundcloud</span>
              <span className="hint-pill">DASH / HLS Streams</span>
            </div>
          </div>
        )}

        {/* ===================================================================
            2. LOADING / ANALYZING STATE
            =================================================================== */}
        {uiState === UI_STATES.LOADING && (
          <div className="downloader-loading-state">
            <div className="loading-radar-spinner">
              <RotateCcw size={32} className="spin-loading-icon coral" />
              <span className="radar-ping"></span>
            </div>

            <h3 className="loading-heading font-serif">
              Analyzing video...
            </h3>

            <p className="loading-message font-mono">
              Probing remote codec profiles, bitrate streams, and available containers...
            </p>
          </div>
        )}

        {/* ===================================================================
            3. ERROR STATE
            =================================================================== */}
        {uiState === UI_STATES.ERROR && (
          <ErrorState
            errorMessage={errorMessage}
            onRetry={onRetry}
            onEditUrl={onEditUrl}
            onReset={onReset}
          />
        )}

        {/* ===================================================================
            4. SUCCESS / ANALYZED STATE (Options Displayed)
            =================================================================== */}
        {uiState === UI_STATES.SUCCESS && mediaData && (
          <div className="downloader-analyzed-content">
            {/* Real Media Preview Card */}
            <MediaInfoCard mediaData={mediaData} />

            {/* Video / Audio Switcher */}
            <VideoAudioSwitcher
              mode={mediaMode}
              onModeChange={(newMode) => {
                if (isDownloading) {
                  onShowToast('Download is in progress. Please wait or cancel it first.');
                  return;
                }
                setMediaMode(newMode);
                if (onResetDownloadState) onResetDownloadState();
                const defaultFormat = newMode === MEDIA_MODES.VIDEO ? 'mp4' : 'mp3';
                const defaultQuality = newMode === MEDIA_MODES.VIDEO
                  ? (mediaData.videoFormats && mediaData.videoFormats[0] ? mediaData.videoFormats[0].id : '1080p')
                  : (mediaData.audioFormats && mediaData.audioFormats[0] ? mediaData.audioFormats[0].id : '320k');

                setSelectedFormat(defaultFormat);
                setSelectedQuality(defaultQuality);
                onShowToast(`Switched mode to ${newMode.toUpperCase()}`);
              }}
            />

            {/* Format Selector (MP4/WebM or MP3/M4A) */}
            <FormatSelector
              mode={mediaMode}
              availableContainers={
                isVideo
                  ? mediaData.availableVideoContainers
                  : mediaData.availableAudioContainers
              }
              selectedFormat={selectedFormat}
              onSelectFormat={(fmt) => {
                if (isDownloading) return;
                setSelectedFormat(fmt);
                if (onResetDownloadState) onResetDownloadState();
                onShowToast(`Selected format: ${fmt.toUpperCase()}`);
              }}
            />

            {/* Dynamic Quality Matrix (Video or Audio) */}
            {isVideo ? (
              <VideoQualityGrid
                videoFormats={mediaData.videoFormats}
                selectedQuality={selectedQuality}
                onSelectQuality={(q) => {
                  if (isDownloading) return;
                  setSelectedQuality(q);
                  if (onResetDownloadState) onResetDownloadState();
                  onShowToast(`Selected video resolution: ${q}`);
                }}
              />
            ) : (
              <AudioQualityGrid
                audioFormats={mediaData.audioFormats}
                selectedQuality={selectedQuality}
                onSelectQuality={(q) => {
                  if (isDownloading) return;
                  setSelectedQuality(q);
                  if (onResetDownloadState) onResetDownloadState();
                  onShowToast(`Selected audio bitrate: ${q}`);
                }}
              />
            )}

            {/* REAL-TIME PROGRESS CARD (When a download job is initiated) */}
            {isJobActive ? (
              <DownloadProgressCard
                job={activeJob}
                mediaData={mediaData}
                onCancel={onCancelJob}
                onRetry={onRetryJob}
                onDismiss={onDismissProgress}
              />
            ) : (
              /* Trigger Download Action Banner */
              <div className="engine-ready-footer-banner glass-panel">
                <div className="banner-left-info">
                  {isVideo ? (
                    <Film size={20} className="banner-icon coral" />
                  ) : (
                    <Music size={20} className="banner-icon green" />
                  )}

                  <div className="banner-text">
                    <span className="banner-title font-mono">
                      {isVideo ? 'Ready to Download Video' : 'Ready to Download Audio'}
                    </span>
                    
                    <span className="banner-desc">
                      {isVideo
                        ? `Stream target: ${selectedFormat.toUpperCase()} at ${selectedQuality} • Powered by server-side yt-dlp & FFmpeg muxer.`
                        : `Audio stream target: ${selectedFormat.toUpperCase()} at ${selectedQuality} • High-fidelity audio extraction via yt-dlp & FFmpeg.`}
                    </span>
                  </div>
                </div>

                <div className="banner-actions">
                  <button
                    type="button"
                    className={`btn-analyze-action ${!isVideo ? 'btn-audio-action' : ''}`}
                    onClick={onStartDownload}
                  >
                    <Download size={16} />
                    <span>
                      {isVideo 
                        ? `Download Video (${selectedFormat.toUpperCase()} • ${selectedQuality})` 
                        : `Download Audio (${selectedFormat.toUpperCase()} • ${selectedQuality})`}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
