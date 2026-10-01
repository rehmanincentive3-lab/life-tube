import React from 'react';
import { 
  DownloadCloud, 
  Layers, 
  Music, 
  RefreshCw, 
  Terminal, 
  Github, 
  Menu, 
  X,
  Cpu
} from './Icons';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  sidebarOpen, 
  setSidebarOpen,
  onOpenSettings,
  onShowToast
}) {
  const tabs = [
    { id: 'downloader', label: 'Downloader', icon: DownloadCloud },
    { id: 'batch', label: 'Batch Processing', icon: Layers },
    { id: 'audio', label: 'Audio Extractor', icon: Music },
    { id: 'converter', label: 'Format Converter', icon: RefreshCw },
    { id: 'docs', label: 'API & CLI Docs', icon: Terminal },
  ];

  return (
    <header className="site-header">
      <div className="header-left">
        {/* Mobile menu hamburger */}
        <button 
          className="mobile-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle navigation menu"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Life Tube Brand Logo */}
        <div className="brand-container" onClick={() => setActiveTab('downloader')}>
          <div className="logo-symbol">
            <svg viewBox="0 0 32 32" fill="none" className="logo-svg">
              <polygon points="16,2 30,10 30,22 16,30 2,22 2,10" fill="url(#brandGrad)" stroke="#ff4d4d" strokeWidth="1.5" />
              <polygon points="13,10 23,16 13,22" fill="#ffffff" />
              <defs>
                <linearGradient id="brandGrad" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#ff416c" />
                  <stop offset="1" stopColor="#ff4b2b" />
                </linearGradient>
              </defs>
            </svg>
            <span className="logo-pulse"></span>
          </div>

          <div className="brand-text">
            <span className="brand-name">LIFE TUBE</span>
            <span className="brand-slash">//</span>
            <span className="brand-sub">DLP-CORE</span>
          </div>
        </div>
      </div>

      {/* Center Navigation Tabs */}
      <nav className="header-nav">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`nav-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(tab.id);
                onShowToast(`Switched to ${tab.label}`);
              }}
            >
              <Icon size={14} className="tab-icon" />
              <span>{tab.label}</span>
              {isActive && <div className="tab-indicator-glow"></div>}
            </button>
          );
        })}
      </nav>

      {/* Right Telemetry & Status Badges */}
      <div className="header-right">
        {/* yt-dlp Engine Version Pill */}
        <div className="engine-pill" onClick={onOpenSettings} title="Engine version details">
          <Cpu size={12} className="engine-icon" />
          <span className="engine-label">CORE</span>
          <span className="engine-version">yt-dlp v2026.03.1</span>
        </div>

        {/* Ping / Latency Badge */}
        <div className="latency-badge" title="Cluster node latency">
          <span className="ping-dot"></span>
          <span className="latency-text">14ms</span>
        </div>

        {/* GitHub Link */}
        <a 
          href="https://github.com/yt-dlp/yt-dlp" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="header-action-btn github-btn"
          title="View GitHub Repository"
        >
          <Github size={14} />
          <span className="btn-label">GitHub</span>
        </a>

        {/* User / Settings Avatar */}
        <button 
          className="user-avatar-btn" 
          onClick={onOpenSettings}
          title="Engine Configuration & Vault"
        >
          <div className="avatar-circle">
            <span>LT</span>
            <span className="avatar-online-dot"></span>
          </div>
        </button>
      </div>
    </header>
  );
}
