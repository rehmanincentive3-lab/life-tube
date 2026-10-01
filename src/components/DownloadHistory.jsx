import React, { useState, useMemo } from 'react';
import { 
  Film, 
  Music, 
  Download, 
  Trash2, 
  Search, 
  X, 
  Clock, 
  AlertCircle,
  DownloadCloud
} from './Icons';

export default function DownloadHistory({
  history = [],
  onDownloadAgain,
  onRemoveItem,
  onClearAll,
  onStartNewDownload,
}) {
  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'video' | 'audio'
  const [formatFilter, setFormatFilter] = useState('all'); // 'all' | 'mp4' | 'webm' | 'mp3' | 'm4a'

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null, // 'clear_all' | 'remove_item'
    targetId: null,
    targetTitle: '',
  });

  // Calculate statistics
  const videoCount = history.filter((i) => i.type === 'video').length;
  const audioCount = history.filter((i) => i.type === 'audio').length;

  // Filtered history list
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      // 1. Type filter
      if (typeFilter !== 'all' && item.type !== typeFilter) {
        return false;
      }

      // 2. Format filter
      if (formatFilter !== 'all' && item.format?.toLowerCase() !== formatFilter.toLowerCase()) {
        return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = item.title?.toLowerCase().includes(q);
        const formatMatch = item.format?.toLowerCase().includes(q);
        const qualityMatch = item.quality?.toLowerCase().includes(q);
        const typeMatch = item.type?.toLowerCase().includes(q);
        return titleMatch || formatMatch || qualityMatch || typeMatch;
      }

      return true;
    });
  }, [history, typeFilter, formatFilter, searchQuery]);

  // Modal actions
  const openClearAllModal = () => {
    setConfirmModal({
      isOpen: true,
      type: 'clear_all',
      targetId: null,
      targetTitle: '',
    });
  };

  const openRemoveModal = (item) => {
    setConfirmModal({
      isOpen: true,
      type: 'remove_item',
      targetId: item.id,
      targetTitle: item.title,
    });
  };

  const handleConfirmModal = () => {
    if (confirmModal.type === 'clear_all') {
      onClearAll();
    } else if (confirmModal.type === 'remove_item' && confirmModal.targetId) {
      onRemoveItem(confirmModal.targetId);
    }
    setConfirmModal({ isOpen: false, type: null, targetId: null, targetTitle: '' });
  };

  return (
    <section id="history" className="download-history-section">
      <div className="history-container glass-panel">
        
        {/* 1. Header with Stats & Clear Action */}
        <div className="history-header-row">
          <div className="history-title-group">
            <div className="history-title-with-badge">
              <h2 className="history-main-heading font-serif">Download History</h2>
              <span className="history-count-badge font-mono">
                {history.length} {history.length === 1 ? 'Download' : 'Downloads'}
              </span>
            </div>
            <span className="history-subtitle font-mono">
              {videoCount} Video • {audioCount} Audio recorded locally
            </span>
          </div>

          {history.length > 0 && (
            <button
              type="button"
              className="btn-clear-history font-mono"
              onClick={openClearAllModal}
            >
              <Trash2 size={13} />
              <span>Clear History</span>
            </button>
          )}
        </div>

        {/* 2. Search & Filter Toolbar (shown when history has items) */}
        {history.length > 0 && (
          <div className="history-toolbar">
            {/* Search Box */}
            <div className="history-search-wrap">
              <Search size={14} className="history-search-icon" />
              <input
                type="text"
                placeholder="Search downloads by title, format, quality..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="history-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="history-search-clear"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear Search"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Type Filter Segmented Control */}
            <div className="history-type-filters font-mono">
              <button
                type="button"
                className={`filter-pill ${typeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setTypeFilter('all')}
              >
                All ({history.length})
              </button>
              <button
                type="button"
                className={`filter-pill ${typeFilter === 'video' ? 'active-coral' : ''}`}
                onClick={() => setTypeFilter('video')}
              >
                Video ({videoCount})
              </button>
              <button
                type="button"
                className={`filter-pill ${typeFilter === 'audio' ? 'active-green' : ''}`}
                onClick={() => setTypeFilter('audio')}
              >
                Audio ({audioCount})
              </button>
            </div>
          </div>
        )}

        {/* 3. History Content List / Grid */}
        {history.length === 0 ? (
          /* Empty State */
          <div className="history-empty-state">
            <div className="history-empty-icon-wrap">
              <DownloadCloud size={36} className="coral" />
              <span className="empty-aura-ring"></span>
            </div>
            <h3 className="history-empty-heading font-serif">No downloads yet</h3>
            <p className="history-empty-desc">
              Your completed video and audio downloads will appear here for easy reference and re-downloading.
            </p>
            <button
              type="button"
              className="btn-analyze-action"
              onClick={onStartNewDownload}
            >
              <Download size={15} />
              <span>Start Downloading</span>
            </button>
          </div>
        ) : filteredHistory.length === 0 ? (
          /* No Search Results */
          <div className="history-no-results font-mono">
            <AlertCircle size={22} className="coral" />
            <p>No downloads match your search query: "{searchQuery}"</p>
            <button
              type="button"
              className="btn-action-secondary"
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('all');
                setFormatFilter('all');
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Render History Items List */
          <div className="history-items-grid">
            {filteredHistory.map((item) => {
              const isVideo = item.type === 'video';
              return (
                <div key={item.id} className="history-item-card glass-panel">
                  {/* Thumbnail Frame */}
                  <div className="history-item-thumb">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="history-thumb-img"
                        loading="lazy"
                      />
                    ) : (
                      <div className="history-thumb-fallback">
                        {isVideo ? (
                          <Film size={22} className="coral" />
                        ) : (
                          <Music size={22} className="green" />
                        )}
                      </div>
                    )}

                    {/* Duration Badge */}
                    {item.duration && (
                      <span className="history-duration-pill font-mono">
                        {item.duration}
                      </span>
                    )}

                    {/* Type Badge Top Left */}
                    <span className={`history-type-tag font-mono ${isVideo ? 'tag-coral' : 'tag-green'}`}>
                      {isVideo ? 'VIDEO' : 'AUDIO'}
                    </span>
                  </div>

                  {/* Metadata Info Column */}
                  <div className="history-item-info">
                    <div className="history-item-meta-top">
                      <div className="history-meta-badges">
                        {item.platform && (
                          <span className="platform-badge font-mono">
                            {item.platform}
                          </span>
                        )}
                        <span className="format-badge font-mono">
                          {item.format?.toUpperCase()}
                        </span>
                        <span className="quality-badge font-mono">
                          {item.quality}
                        </span>
                        {item.fileSize && (
                          <span className="size-badge font-mono">
                            {item.fileSize}
                          </span>
                        )}
                      </div>

                      <div className="history-time-meta font-mono">
                        <Clock size={11} />
                        <span>{item.formattedDate || 'Recently'}</span>
                      </div>
                    </div>

                    <h3 className="history-item-title" title={item.title}>
                      {item.title}
                    </h3>

                    {/* Actions Row */}
                    <div className="history-item-actions">
                      <button
                        type="button"
                        className={`btn-history-again font-mono ${isVideo ? 'btn-again-video' : 'btn-again-audio'}`}
                        onClick={() => onDownloadAgain(item)}
                      >
                        <Download size={13} />
                        <span>Download Again</span>
                      </button>

                      <button
                        type="button"
                        className="btn-history-remove"
                        onClick={() => openRemoveModal(item)}
                        aria-label={`Remove ${item.title} from history`}
                        title="Remove from history"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Confirmation Modal Dialog */}
      {confirmModal.isOpen && (
        <div className="modal-backdrop-overlay" onClick={() => setConfirmModal({ isOpen: false, type: null, targetId: null, targetTitle: '' })}>
          <div className="confirmation-dialog glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon-box">
              <AlertCircle size={28} className="coral" />
            </div>

            <h3 className="confirm-title font-serif">
              {confirmModal.type === 'clear_all'
                ? 'Clear all download history?'
                : 'Remove item from history?'}
            </h3>

            <p className="confirm-desc">
              {confirmModal.type === 'clear_all'
                ? 'This will permanently remove all history records from this browser. Your downloaded files on your device will not be deleted.'
                : `Remove "${confirmModal.targetTitle}" from your history? Your downloaded file will remain on your device.`}
            </p>

            <div className="confirm-btn-actions">
              <button
                type="button"
                className="btn-confirm-cancel font-mono"
                onClick={() => setConfirmModal({ isOpen: false, type: null, targetId: null, targetTitle: '' })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-confirm-danger font-mono"
                onClick={handleConfirmModal}
              >
                {confirmModal.type === 'clear_all' ? 'Clear History' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
