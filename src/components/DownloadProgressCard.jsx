import React from 'react';
import { 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Film, 
  Music, 
  Download, 
  ArrowLeft,
  Activity,
  Clock,
  HardDrive
} from './Icons';
import { JOB_STATUS } from '../services/downloadService';

export default function DownloadProgressCard({
  job,
  mediaData,
  onCancel,
  onRetry,
  onDismiss,
}) {
  if (!job) return null;

  const isVideo = job.type === 'video';
  const isInProgress = [
    JOB_STATUS.QUEUED,
    JOB_STATUS.PREPARING,
    JOB_STATUS.DOWNLOADING,
    JOB_STATUS.PROCESSING,
    JOB_STATUS.FINALIZING,
  ].includes(job.status);

  const isCompleted = job.status === JOB_STATUS.READY || job.status === JOB_STATUS.COMPLETED;
  const isFailed = job.status === JOB_STATUS.FAILED;
  const isCancelled = job.status === JOB_STATUS.CANCELLED;

  const progressPercent = Math.min(100, Math.max(0, Math.round((job.progress || 0) * 10) / 10));

  return (
    <div 
      className={`download-progress-card glass-panel ${isVideo ? 'theme-video' : 'theme-audio'}`}
      role="region"
      aria-label="Download Progress and Processing Engine"
    >
      {/* 1. Header with Media Meta */}
      <div className="progress-header-row">
        <div className="progress-media-info">
          <div className="progress-media-thumb">
            {mediaData?.thumbnail ? (
              <img 
                src={mediaData.thumbnail} 
                alt={job.title || 'Media thumbnail'} 
                className="progress-thumb-img" 
              />
            ) : (
              <div className="progress-thumb-fallback">
                {isVideo ? <Film size={20} className="coral" /> : <Music size={20} className="green" />}
              </div>
            )}
            <span className="progress-thumb-badge font-mono">
              {job.quality}
            </span>
          </div>

          <div className="progress-text-col">
            <div className="progress-badges-row">
              <span className={`type-tag font-mono ${isVideo ? 'tag-coral' : 'tag-green'}`}>
                {isVideo ? 'VIDEO EXTRACTION' : 'AUDIO EXTRACTION'}
              </span>
              <span className="format-tag font-mono">
                {job.format?.toUpperCase()}
              </span>
              <span className="quality-tag font-mono">
                {job.quality}
              </span>
            </div>

            <h3 className="progress-media-title">
              {job.title || mediaData?.title || 'Online Media Stream'}
            </h3>
          </div>
        </div>

        {/* Status Indicator Pill */}
        <div className="progress-status-badge-wrap">
          {isInProgress && (
            <span className="status-pill status-pill-active font-mono">
              <RotateCcw size={12} className="spin-loading-icon" />
              <span>{job.status}</span>
            </span>
          )}
          {isCompleted && (
            <span className="status-pill status-pill-success font-mono">
              <CheckCircle2 size={13} />
              <span>READY</span>
            </span>
          )}
          {isCancelled && (
            <span className="status-pill status-pill-cancelled font-mono">
              <XCircle size={13} />
              <span>CANCELLED</span>
            </span>
          )}
          {isFailed && (
            <span className="status-pill status-pill-error font-mono">
              <AlertCircle size={13} />
              <span>FAILED</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. Progress Bar & Real-time Percent */}
      <div className="progress-bar-section">
        <div className="progress-labels-row font-mono">
          <span className="progress-status-message">
            {job.statusMessage || (isInProgress ? 'Processing media stream...' : 'Job finished.')}
          </span>
          <span className={`progress-percentage-text ${isVideo ? 'coral' : 'green'}`}>
            {isCompleted ? '100%' : `${progressPercent}%`}
          </span>
        </div>

        <div className="progress-track-outer">
          <div 
            className={`progress-track-fill ${isVideo ? 'fill-coral' : 'fill-green'} ${
              job.status === JOB_STATUS.PROCESSING || job.status === JOB_STATUS.FINALIZING ? 'shimmer-active' : ''
            }`}
            style={{ width: `${isCompleted ? 100 : Math.max(progressPercent, isInProgress ? 4 : 0)}%` }}
          >
            <span className="progress-fill-glow"></span>
          </div>
        </div>
      </div>

      {/* 3. Real-time Live Metrics Grid (Speed, ETA, Downloaded/Total) */}
      <div className="progress-metrics-grid">
        <div className="metric-box">
          <div className="metric-label font-mono">
            <HardDrive size={12} className="metric-icon" />
            <span>DOWNLOADED / TOTAL</span>
          </div>
          <div className="metric-value font-mono">
            {isCompleted && job.fileSizeText ? (
              <span>{job.fileSizeText} (Complete)</span>
            ) : job.downloadedText && job.totalText ? (
              <span>{job.downloadedText} / {job.totalText}</span>
            ) : job.totalText ? (
              <span>{job.totalText}</span>
            ) : (
              <span className="text-dim">Stream probing...</span>
            )}
          </div>
        </div>

        <div className="metric-box">
          <div className="metric-label font-mono">
            <Activity size={12} className="metric-icon" />
            <span>TRANSFER SPEED</span>
          </div>
          <div className="metric-value font-mono">
            {isInProgress ? (
              job.speed || <span className="text-dim">Calculating...</span>
            ) : isCompleted ? (
              <span className="green">Transfer Finished</span>
            ) : (
              <span className="text-dim">—</span>
            )}
          </div>
        </div>

        <div className="metric-box">
          <div className="metric-label font-mono">
            <Clock size={12} className="metric-icon" />
            <span>REMAINING TIME (ETA)</span>
          </div>
          <div className="metric-value font-mono">
            {isInProgress ? (
              job.eta || <span className="text-dim">Estimating...</span>
            ) : isCompleted ? (
              <span className="green">Ready</span>
            ) : (
              <span className="text-dim">—</span>
            )}
          </div>
        </div>
      </div>

      {/* 4. Action Footer Buttons */}
      <div className="progress-footer-actions">
        {isInProgress && (
          <div className="progress-running-actions">
            <button
              type="button"
              className="btn-cancel-job font-mono"
              onClick={onCancel}
            >
              <XCircle size={15} />
              <span>Cancel Download</span>
            </button>
            <span className="job-id-note font-mono">Job #{job.id}</span>
          </div>
        )}

        {isCompleted && (
          <div className="progress-complete-actions">
            <div className="complete-msg font-mono">
              <CheckCircle2 size={16} className="green" />
              <span>Ready: <strong>{job.filename}</strong></span>
            </div>

            <div className="complete-btn-group">
              <a
                href={`/api/download/file/${job.id}`}
                download={job.filename || 'download.mp4'}
                className={`btn-action-primary ${!isVideo ? 'btn-audio-action' : ''}`}
                style={{ textDecoration: 'none' }}
              >
                <Download size={15} />
                <span>Save File to Device</span>
              </a>

              <button
                type="button"
                className="btn-action-secondary font-mono"
                onClick={onDismiss}
              >
                <ArrowLeft size={14} />
                <span>Change Options</span>
              </button>
            </div>
          </div>
        )}

        {(isFailed || isCancelled) && (
          <div className="progress-error-actions">
            <div className="error-note font-mono">
              {isCancelled ? (
                <span>Download was cancelled. Temporary files removed.</span>
              ) : (
                <span className="coral">{job.error || 'Download failed during extraction.'}</span>
              )}
            </div>

            <div className="complete-btn-group">
              <button
                type="button"
                className={`btn-action-primary ${!isVideo ? 'btn-audio-action' : ''}`}
                onClick={onRetry}
              >
                <RotateCcw size={14} />
                <span>Retry Download</span>
              </button>

              <button
                type="button"
                className="btn-action-secondary font-mono"
                onClick={onDismiss}
              >
                <ArrowLeft size={14} />
                <span>Back to Options</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
