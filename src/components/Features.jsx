import React from 'react';
import { 
  Film, 
  Music, 
  Sparkles, 
  Layers, 
  Zap, 
  SlidersHorizontal 
} from './Icons';

export default function Features() {
  const featureList = [
    {
      id: 'feat-1',
      title: 'Video Downloader',
      description: 'Capture video streams across popular web media platforms with full resolution preservation.',
      icon: Film,
      color: 'coral',
    },
    {
      id: 'feat-2',
      title: 'Audio Downloader',
      description: 'Extract standalone audio soundtracks with direct demuxing for uncompromised fidelity.',
      icon: Music,
      color: 'cyan',
    },
    {
      id: 'feat-3',
      title: 'HD Quality Options',
      description: 'Configurable output profiles ranging from standard 360p/720p up to Full HD, 2K, and 4K Ultra HD.',
      icon: Sparkles,
      color: 'green',
    },
    {
      id: 'feat-4',
      title: 'Multiple Formats',
      description: 'Comprehensive container support including MP4, WebM, MP3, and M4A with native codec alignment.',
      icon: Layers,
      color: 'coral',
    },
    {
      id: 'feat-5',
      title: 'Fast Processing',
      description: 'Engineered for rapid stream analysis and efficient chunk-based download architecture.',
      icon: Zap,
      color: 'cyan',
    },
    {
      id: 'feat-6',
      title: 'Simple Interface',
      description: 'Clean, distraction-free workflow designed for intuitive URL analysis and instant format selection.',
      icon: SlidersHorizontal,
      color: 'green',
    },
  ];

  return (
    <section id="features" className="features-section">
      <div className="section-header-wrap">
        <div className="section-badge font-mono">
          <span>CAPABILITIES &amp; FEATURES</span>
        </div>
        <h2 className="section-title font-serif">
          Engineered for Media Precision
        </h2>
        <p className="section-description">
          Life Tube delivers a robust interface structure designed for high-resolution video streams and crystal-clear audio extraction.
        </p>
      </div>

      <div className="features-grid">
        {featureList.map((feature) => {
          const Icon = feature.icon;
          return (
            <div key={feature.id} className="feature-card glass-panel">
              <div className={`feature-icon-wrapper ${feature.color}`}>
                <Icon size={20} className={`f-icon ${feature.color}`} />
              </div>
              <h3 className="feature-card-title">{feature.title}</h3>
              <p className="feature-card-desc">{feature.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
