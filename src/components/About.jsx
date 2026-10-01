import React from 'react';
import { ShieldCheck, Cpu, HardDrive } from './Icons';

export default function About() {
  return (
    <section id="about" className="about-section">
      <div className="about-card-container glass-panel">
        <div className="about-left-column">
          <div className="section-badge font-mono">
            <span>ABOUT LIFE TUBE</span>
          </div>
          <h2 className="about-heading font-serif">
            A Modern Media Downloader Platform
          </h2>
          <p className="about-paragraph">
            Life Tube is built to provide users with a clean, structured, and modern web interface for analyzing and organizing online media streams.
          </p>
          <p className="about-paragraph">
            Designed from the ground up for modern web standards, Life Tube separates video containers, audio bitrates, and resolution options into an intuitive layout so you can easily select the format that best fits your playback requirements.
          </p>
        </div>

        <div className="about-right-column">
          <div className="about-pillar-card">
            <div className="pillar-icon-box coral">
              <Cpu size={18} />
            </div>
            <div className="pillar-text">
              <h4 className="pillar-title">Stream-Aware Architecture</h4>
              <p className="pillar-desc">
                Architected to interface cleanly with robust server-side extraction tools like yt-dlp.
              </p>
            </div>
          </div>

          <div className="about-pillar-card">
            <div className="pillar-icon-box green">
              <ShieldCheck size={18} />
            </div>
            <div className="pillar-text">
              <h4 className="pillar-title">Clean &amp; Transparent Workflow</h4>
              <p className="pillar-desc">
                Transparent format information without invasive ads, hidden scripts, or fake download loops.
              </p>
            </div>
          </div>

          <div className="about-pillar-card">
            <div className="pillar-icon-box cyan">
              <HardDrive size={18} />
            </div>
            <div className="pillar-text">
              <h4 className="pillar-title">Format Flexibility</h4>
              <p className="pillar-desc">
                Granular control over MP4 and WebM video formats, alongside MP3 and M4A audio tracks.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
