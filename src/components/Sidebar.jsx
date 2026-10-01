import React from 'react';
import { 
  Download, 
  Layers, 
  Music, 
  SlidersHorizontal, 
  Activity, 
  Terminal, 
  Key, 
  Radio, 
  HardDrive
} from './Icons';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  sidebarOpen, 
  setSidebarOpen,
  onOpenSettings,
  workerStats = { active: 12, total: 16 }
}) {
  const pipelineItems = [
    { id: 'downloader', label: 'Single Stream Harvester', icon: Download },
    { id: 'batch', label: 'Batch Multiplexer', icon: Layers, badge: 'READY' },
    { id: 'audio', label: 'Audio Extraction Hub', icon: Music },
    { id: 'converter', label: 'Transcode Matrix', icon: SlidersHorizontal },
    { id: 'telemetry', label: 'Live Telemetry', icon: Activity, pulse: true },
    { id: 'docs', label: 'CLI & Engine Logs', icon: Terminal },
  ];

  const engineSettings = [
    { id: 'proxy', label: 'Proxy Pool & Tor', icon: Radio },
    { id: 'auth', label: 'Cookie & Auth Vault', icon: Key },
    { id: 'storage', label: 'Storage & Scratch Dir', icon: HardDrive },
  ];

  const handleNavClick = (id) => {
    if (id === 'proxy' || id === 'auth' || id === 'storage' || id === 'telemetry') {
      onOpenSettings(id);
    } else {
      setActiveTab(id);
    }
    // Close sidebar on mobile when clicked
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`site-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-content">
          {/* Section: Pipelines & Queues */}
          <div className="sidebar-section">
            <h3 className="section-label">PIPELINES &amp; QUEUES</h3>
            <ul className="sidebar-nav-list">
              {pipelineItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <li key={item.id}>
                    <button
                      className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => handleNavClick(item.id)}
                    >
                      <div className="nav-item-icon-wrapper">
                        <Icon size={16} className="nav-item-icon" />
                        {item.pulse && <span className="icon-pulse-dot"></span>}
                      </div>
                      <span className="nav-item-text">{item.label}</span>
                      {item.badge && (
                        <span className="nav-item-badge">{item.badge}</span>
                      )}
                      {isActive && <div className="active-glow-bar"></div>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Section: Engine Settings */}
          <div className="sidebar-section">
            <h3 className="section-label">ENGINE SETTINGS</h3>
            <ul className="sidebar-nav-list">
              {engineSettings.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      className="sidebar-nav-item"
                      onClick={() => handleNavClick(item.id)}
                    >
                      <div className="nav-item-icon-wrapper">
                        <Icon size={16} className="nav-item-icon" />
                      </div>
                      <span className="nav-item-text">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Sidebar Bottom Engine Status Widget */}
        <div className="sidebar-footer-widget">
          <div className="engine-status-header">
            <div className="status-indicator-group">
              <span className="engine-status-dot"></span>
              <span className="engine-status-title">ACTIVE ENGINE</span>
            </div>
            <span className="engine-ready-badge">READY</span>
          </div>

          {/* Worker pool allocation progress bar */}
          <div className="worker-pool-info">
            <div className="worker-pool-labels">
              <span className="pool-label">Worker Pool</span>
              <span className="pool-count font-mono">{workerStats.active} / {workerStats.total} Cores</span>
            </div>
            <div className="worker-progress-track">
              <div 
                className="worker-progress-bar"
                style={{ width: `${(workerStats.active / workerStats.total) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
