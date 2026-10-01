import React, { useState } from 'react';
import { 
  Play, 
  Eye, 
  Calendar, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp 
} from './Icons';

export default function MediaInfoCard({ mediaData }) {
  const [imageError, setImageError] = useState(false);
  const [isTitleExpanded, setIsTitleExpanded] = useState(false);

  if (!mediaData) return null;

  const isLongTitle = mediaData.title && mediaData.title.length > 70;

  return (
    <div className="media-info-card glass-panel">
      {/* 1. Thumbnail Container (16:9 Aspect Ratio) */}
      <div className="thumbnail-media-frame">
        {mediaData.thumbnail && !imageError ? (
          <img
            src={mediaData.thumbnail}
            alt={mediaData.title || 'Video Thumbnail'}
            className="real-thumbnail-img"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="synthetic-fallback-thumb">
            <div className="thumb-grid-lines"></div>
            <div className="thumb-center-glow"></div>
            <Play size={28} fill="#ffffff" className="thumb-play-center coral" />
          </div>
        )}

        {/* Top Badges */}
        <div className="thumb-badge-top-left">
          {mediaData.availableQualities && mediaData.availableQualities.includes('2160p') ? (
            <span className="badge-pill uhd">4K UHD</span>
          ) : mediaData.availableQualities && mediaData.availableQualities.includes('1080p') ? (
            <span className="badge-pill uhd">1080p FHD</span>
          ) : (
            <span className="badge-pill uhd">HD</span>
          )}
        </div>

        {/* Duration Badge */}
        {mediaData.duration && (
          <div className="thumb-duration-pill font-mono">
            {mediaData.duration}
          </div>
        )}
      </div>

      {/* 2. Media Metadata Column */}
      <div className="media-info-details">
        {/* Status Verification Bar */}
        <div className="info-status-row">
          <div className="status-indicator-pill font-mono">
            <CheckCircle2 size={12} className="green" />
            <span>Stream Validated</span>
          </div>

          {mediaData.platform && (
            <span className="media-platform-badge font-mono">
              {mediaData.platform}
            </span>
          )}

          {mediaData.id && (
            <span className="media-id-tag font-mono">
              ID: #{mediaData.id}
            </span>
          )}
        </div>

        {/* Video Title (with graceful long title handling) */}
        <div className="title-wrapper">
          <h2 className={`media-title-heading ${isTitleExpanded ? 'expanded' : 'clamped'}`}>
            {mediaData.title}
          </h2>

          {isLongTitle && (
            <button
              type="button"
              className="title-expand-btn font-mono"
              onClick={() => setIsTitleExpanded(!isTitleExpanded)}
            >
              <span>{isTitleExpanded ? 'Show less' : 'Show full title'}</span>
              {isTitleExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
        </div>

        {/* Channel & Metadata Stats */}
        <div className="media-metadata-row">
          {/* Uploader / Channel (hidden if unavailable) */}
          {mediaData.uploader && (
            <div className="meta-author-group">
              <span className="author-name font-bold">{mediaData.uploader}</span>
            </div>
          )}

          {mediaData.uploader && (mediaData.formattedViews || mediaData.uploadDate) && (
            <span className="meta-sep">•</span>
          )}

          {/* View Count (hidden if unavailable) */}
          {mediaData.formattedViews && (
            <div className="meta-stat-pill font-mono">
              <Eye size={12} />
              <span>{mediaData.formattedViews}</span>
            </div>
          )}

          {mediaData.formattedViews && mediaData.uploadDate && (
            <span className="meta-sep">•</span>
          )}

          {/* Upload Date (hidden if unavailable) */}
          {mediaData.uploadDate && (
            <div className="meta-stat-pill font-mono">
              <Calendar size={12} />
              <span>{mediaData.uploadDate}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
