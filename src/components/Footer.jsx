import React from 'react';

export default function Footer({ onNavigate }) {
  return (
    <footer className="site-footer">
      <div className="footer-inner-container">
        <div className="footer-top-grid">
          {/* Brand Info */}
          <div className="footer-brand-column">
            <div className="brand-group" onClick={() => onNavigate('home')}>
              <div className="brand-logo-emblem">
                <svg viewBox="0 0 32 32" fill="none" className="brand-logo-svg">
                  <polygon
                    points="16,2 30,10 30,22 16,30 2,22 2,10"
                    fill="url(#brandGradFooter)"
                    stroke="#ff4d4d"
                    strokeWidth="1.5"
                  />
                  <polygon points="13,10 23,16 13,22" fill="#ffffff" />
                  <defs>
                    <linearGradient id="brandGradFooter" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#ff416c" />
                      <stop offset="1" stopColor="#ff4b2b" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="brand-title-wrap">
                <span className="brand-title-primary">Life Tube</span>
              </div>
            </div>
            <p className="footer-brand-desc">
              A modern, high-precision media downloader interface engineered for clean multi-format stream analysis and lossless audio extraction.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="footer-nav-column">
            <h4 className="footer-heading font-mono">NAVIGATION</h4>
            <ul className="footer-links-list">
              <li>
                <button type="button" onClick={() => onNavigate('home')}>
                  Home
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('downloader')}>
                  Downloader
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('history')}>
                  History
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('features')}>
                  Features
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('about')}>
                  About
                </button>
              </li>
            </ul>
          </div>

          {/* Formats & Qualities Supported */}
          <div className="footer-nav-column">
            <h4 className="footer-heading font-mono">SUPPORTED FORMATS</h4>
            <ul className="footer-links-list font-mono text-xs">
              <li>Video: MP4 &amp; WebM (144p - 4K)</li>
              <li>Audio: MP3 &amp; M4A (64k - 320kbps)</li>
              <li>Multi-Stream Dash Demuxing</li>
              <li>FFmpeg Compatible Containers</li>
            </ul>
          </div>

          {/* Community & Legal */}
          <div className="footer-nav-column">
            <h4 className="footer-heading font-mono">ENGINE CORE</h4>
            <div className="footer-engine-badge glass-panel">
              <span className="green-pulse-dot"></span>
              <span className="font-mono text-xs">yt-dlp Engine Ready</span>
            </div>
            <p className="footer-disclaimer">
              Life Tube is designed for personal archival and educational stream inspection. Always respect content creator copyright.
            </p>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="footer-bottom-bar">
          <span className="copyright-text font-mono">
            &copy; {new Date().getFullYear()} Life Tube. All rights reserved.
          </span>
          <span className="footer-sub-text font-mono">
            Crafted for high-fidelity media extraction.
          </span>
        </div>
      </div>
    </footer>
  );
}
