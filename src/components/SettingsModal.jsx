import React, { useState } from 'react';
import { 
  X, 
  Radio, 
  Key, 
  Cpu, 
  Check, 
  Activity
} from './Icons';

export default function SettingsModal({ isOpen, onClose, initialTab = 'proxy', onShowToast }) {
  const [activeSubTab, setActiveSubTab] = useState(initialTab || 'proxy');
  const [proxyEnabled, setProxyEnabled] = useState(false);
  const [proxyAddress, setProxyAddress] = useState('socks5://127.0.0.1:9050');
  const [cookieVault, setCookieVault] = useState('');
  const [threads, setThreads] = useState(16);
  const [chunkSize, setChunkSize] = useState('16M');

  if (!isOpen) return null;

  const handleSave = () => {
    onShowToast('Engine settings updated successfully');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="settings-modal-dialog glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="settings-modal-header">
          <div className="settings-title-group">
            <Cpu size={18} className="feature-icon coral" />
            <h3 className="settings-title font-mono">ENGINE CORE CONFIGURATION</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="settings-tabs-bar">
          <button 
            className={`settings-nav-btn ${activeSubTab === 'proxy' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('proxy')}
          >
            <Radio size={14} />
            <span>Proxy &amp; Tor</span>
          </button>
          <button 
            className={`settings-nav-btn ${activeSubTab === 'auth' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('auth')}
          >
            <Key size={14} />
            <span>Auth &amp; Cookie Vault</span>
          </button>
          <button 
            className={`settings-nav-btn ${activeSubTab === 'threads' || activeSubTab === 'telemetry' || activeSubTab === 'storage' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('threads')}
          >
            <Activity size={14} />
            <span>Threads &amp; Telemetry</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="settings-body-content">
          {activeSubTab === 'proxy' && (
            <div className="settings-tab-pane">
              <label className="toggle-item">
                <input 
                  type="checkbox" 
                  checked={proxyEnabled} 
                  onChange={(e) => setProxyEnabled(e.target.checked)} 
                />
                <span className="toggle-text font-bold">Route Traffic Through Tor / SOCKS5 Proxy</span>
              </label>

              <div className="setting-input-field">
                <label className="field-label font-mono">Proxy Host / Tor Daemon SOCKS5 URL</label>
                <input 
                  type="text" 
                  value={proxyAddress} 
                  onChange={(e) => setProxyAddress(e.target.value)}
                  disabled={!proxyEnabled}
                  className="setting-text-input font-mono"
                />
                <span className="field-help">Bypasses regional rate limits and geo-locked stream restrictions.</span>
              </div>
            </div>
          )}

          {activeSubTab === 'auth' && (
            <div className="settings-tab-pane">
              <div className="setting-input-field">
                <label className="field-label font-mono">Netscape HTTP Cookie File / Cookies.txt</label>
                <textarea 
                  value={cookieVault} 
                  onChange={(e) => setCookieVault(e.target.value)}
                  rows={5}
                  placeholder="# Netscape HTTP Cookie File&#10;.youtube.com TRUE / TRUE 1759281920 SID ..."
                  className="setting-textarea font-mono"
                />
                <span className="field-help">Required for age-restricted videos and member-only 4K streams.</span>
              </div>
            </div>
          )}

          {(activeSubTab === 'threads' || activeSubTab === 'telemetry' || activeSubTab === 'storage') && (
            <div className="settings-tab-pane">
              <div className="setting-input-field">
                <label className="field-label font-mono">Concurrent Stream Extraction Threads: {threads}</label>
                <input 
                  type="range" 
                  min="4" 
                  max="32" 
                  step="2" 
                  value={threads} 
                  onChange={(e) => setThreads(Number(e.target.value))}
                  className="setting-range-slider"
                />
                <div className="slider-ticks font-mono">
                  <span>4 Threads</span>
                  <span>16 (Recommended)</span>
                  <span>32 Max Turbo</span>
                </div>
              </div>

              <div className="setting-input-field" style={{ marginTop: '16px' }}>
                <label className="field-label font-mono">Fragment Buffer Chunk Size</label>
                <div className="bitrate-pills-list">
                  {['4M', '8M', '16M', '32M'].map((c) => (
                    <button 
                      key={c} 
                      className={`bitrate-pill ${chunkSize === c ? 'active' : ''}`}
                      onClick={() => setChunkSize(c)}
                    >
                      {c} Chunk Buffer
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="settings-modal-footer">
          <button className="action-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="action-btn-primary" onClick={handleSave}>
            <Check size={15} />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>
    </div>
  );
}
