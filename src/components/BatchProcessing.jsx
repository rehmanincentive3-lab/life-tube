import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Download, 
  ListOrdered, 
  Zap
} from './Icons';

export default function BatchProcessing({ onShowToast }) {
  const [urlsText, setUrlsText] = useState(
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ\nhttps://www.youtube.com/watch?v=3JZ_D3ELwOQ\nhttps://www.youtube.com/watch?v=L_LUpnjgPso'
  );
  const [activeQueue, setActiveQueue] = useState([
    {
      id: 'item-1',
      title: 'Cybernetic Horizons: Quantum Computing & Deep Spatial Synthesis [4K]',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      res: '2160p 4K',
      size: '1.42 GB',
      progress: 68,
      status: 'downloading',
      speed: '48.6 MB/s'
    },
    {
      id: 'item-2',
      title: 'Neural Networks & Real-Time GPU Raymarching Masterclass',
      url: 'https://www.youtube.com/watch?v=3JZ_D3ELwOQ',
      res: '1080p FHD',
      size: '620 MB',
      progress: 100,
      status: 'completed',
      speed: 'Finished'
    },
    {
      id: 'item-3',
      title: 'Ambient Electronic Modular Synthesizer Live Session #42',
      url: 'https://www.youtube.com/watch?v=L_LUpnjgPso',
      res: '320kbps MP3',
      size: '42 MB',
      progress: 0,
      status: 'queued',
      speed: 'Queued'
    }
  ]);

  const [selectedFormat, setSelectedFormat] = useState('best');
  const [concurrentWorkers, setConcurrentWorkers] = useState(4);

  const handleAddBatch = () => {
    const lines = urlsText.split('\n').filter(l => l.trim().length > 0);
    if (lines.length === 0) {
      onShowToast('Please paste or type one URL per line');
      return;
    }
    onShowToast(`Added ${lines.length} streams to the batch queue`);
  };

  const handleClearCompleted = () => {
    setActiveQueue(activeQueue.filter(i => i.status !== 'completed'));
    onShowToast('Removed completed tasks from queue');
  };

  return (
    <div className="stream-harvester-container">
      {/* Top Engine Status Pill */}
      <div className="engine-status-pill-row">
        <div className="status-pill glass-pill">
          <span className="green-pulse-dot"></span>
          <span className="pill-text-strong">Batch Multiplexer Engine</span>
          <span className="pill-separator">•</span>
          <span className="pill-text-muted">4 Concurrent Stream Workers</span>
          <span className="pill-separator">•</span>
          <span className="pill-text-muted">Thread Pool Active</span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="harvester-hero-header">
        <h1 className="hero-title font-serif">
          Batch <span className="coral-ampersand">&amp;</span> Playlist Multiplexer
        </h1>
        <p className="hero-subtitle">
          Queue multiple URLs, YouTube playlists, or channels simultaneously with automated format resolution and high-throughput thread pooling.
        </p>
      </div>

      {/* Batch Input Box */}
      <div className="batch-input-card glass-panel">
        <div className="batch-card-header">
          <div className="batch-title-group">
            <ListOrdered size={16} className="feature-icon coral" />
            <h3 className="matrix-heading">Paste Stream URLs (One per line)</h3>
          </div>
          <div className="batch-options-row">
            <span className="font-mono text-muted">Workers:</span>
            <select 
              value={concurrentWorkers} 
              onChange={(e) => setConcurrentWorkers(Number(e.target.value))}
              className="batch-select font-mono"
            >
              <option value="2">2 Concurrent</option>
              <option value="4">4 Concurrent (Optimal)</option>
              <option value="8">8 Concurrent (Turbo)</option>
            </select>
          </div>
        </div>

        <textarea
          value={urlsText}
          onChange={(e) => setUrlsText(e.target.value)}
          rows={4}
          className="batch-textarea font-mono"
          placeholder="https://www.youtube.com/watch?v=...&#10;https://www.youtube.com/playlist?list=..."
        />

        <div className="batch-card-footer">
          <div className="batch-format-pills">
            <button 
              className={`preset-pill-btn ${selectedFormat === 'best' ? 'active-coral' : ''}`}
              onClick={() => setSelectedFormat('best')}
            >
              Best Available Video (4K/1080p)
            </button>
            <button 
              className={`preset-pill-btn ${selectedFormat === '1080p' ? 'active-coral' : ''}`}
              onClick={() => setSelectedFormat('1080p')}
            >
              Standard 1080p MP4
            </button>
            <button 
              className={`preset-pill-btn ${selectedFormat === 'audio' ? 'active-coral' : ''}`}
              onClick={() => setSelectedFormat('audio')}
            >
              Audio Only (320kbps MP3)
            </button>
          </div>

          <button className="action-btn-primary" onClick={handleAddBatch}>
            <Plus size={15} />
            <span>Enqueue Batch</span>
          </button>
        </div>
      </div>

      {/* Active Queue Table */}
      <div className="queue-section">
        <div className="matrix-header-row">
          <div className="matrix-title-group">
            <Layers size={16} className="feature-icon cyan" />
            <h3 className="matrix-heading">Active Pipeline Queue ({activeQueue.length} Streams)</h3>
          </div>
          <div className="queue-actions">
            <button className="queue-btn-ghost font-mono" onClick={handleClearCompleted}>
              <Trash2 size={13} />
              <span>Clear Finished</span>
            </button>
          </div>
        </div>

        <div className="queue-cards-list">
          {activeQueue.map((item) => (
            <div key={item.id} className="queue-item-card glass-panel">
              <div className="queue-item-left">
                <div className="queue-icon-wrapper">
                  {item.status === 'completed' ? (
                    <CheckCircle2 size={18} className="green" />
                  ) : item.status === 'downloading' ? (
                    <Zap size={18} className="coral animate-pulse-subtle" />
                  ) : (
                    <Clock size={18} className="text-muted" />
                  )}
                </div>
                <div className="queue-item-info">
                  <h4 className="queue-item-title">{item.title}</h4>
                  <div className="queue-item-meta font-mono">
                    <span className="badge-tag badge-neutral">{item.res}</span>
                    <span className="meta-sep">•</span>
                    <span>{item.size}</span>
                    <span className="meta-sep">•</span>
                    <span className={item.status === 'downloading' ? 'green' : 'text-muted'}>
                      {item.speed}
                    </span>
                  </div>
                </div>
              </div>

              <div className="queue-item-right">
                <div className="queue-progress-column">
                  <span className="queue-pct font-mono">{item.progress}%</span>
                  <div className="queue-bar-track">
                    <div 
                      className={`queue-bar-fill ${item.status === 'completed' ? 'fill-green' : ''}`}
                      style={{ width: `${item.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="queue-item-actions">
                  {item.status === 'completed' ? (
                    <button 
                      className="queue-action-icon-btn green"
                      onClick={() => onShowToast(`Exported ${item.title} to disk`)}
                      title="Export to Disk"
                    >
                      <Download size={15} />
                    </button>
                  ) : (
                    <button 
                      className="queue-action-icon-btn text-muted"
                      onClick={() => {
                        setActiveQueue(activeQueue.filter(i => i.id !== item.id));
                        onShowToast('Removed item from queue');
                      }}
                      title="Remove"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
