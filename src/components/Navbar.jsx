import React, { useState } from 'react';
import { Menu, X, DownloadCloud } from './Icons';

export default function Navbar({ activeSection, onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'downloader', label: 'Downloader' },
    { id: 'history', label: 'History' },
    { id: 'features', label: 'Features' },
    { id: 'about', label: 'About' },
  ];

  const handleNavClick = (id) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="site-navbar">
      <div className="navbar-inner-container">
        {/* Life Tube Brand Logo */}
        <div className="brand-group" onClick={() => handleNavClick('home')}>
          <div className="brand-logo-emblem">
            <svg viewBox="0 0 32 32" fill="none" className="brand-logo-svg">
              <polygon
                points="16,2 30,10 30,22 16,30 2,22 2,10"
                fill="url(#brandGradNavbar)"
                stroke="#ff4d4d"
                strokeWidth="1.5"
              />
              <polygon points="13,10 23,16 13,22" fill="#ffffff" />
              <defs>
                <linearGradient id="brandGradNavbar" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#ff416c" />
                  <stop offset="1" stopColor="#ff4b2b" />
                </linearGradient>
              </defs>
            </svg>
            <span className="brand-pulse-glow"></span>
          </div>

          <div className="brand-title-wrap">
            <span className="brand-title-primary">Life Tube</span>
            <span className="brand-badge-tag font-mono">2026</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="desktop-nav-links">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                className={`nav-link-btn ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                <span>{item.label}</span>
                {isActive && <span className="nav-active-pill-dot"></span>}
              </button>
            );
          })}
        </nav>

        {/* Right CTA / Action */}
        <div className="navbar-right-actions">
          <button
            className="navbar-cta-btn"
            onClick={() => handleNavClick('downloader')}
          >
            <DownloadCloud size={14} />
            <span>Open Downloader</span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            className="mobile-nav-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer glass-panel">
          <div className="mobile-nav-items-list">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  className={`mobile-nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.id)}
                >
                  <span>{item.label}</span>
                  {isActive && <span className="mobile-active-marker"></span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
