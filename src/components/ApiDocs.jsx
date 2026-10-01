import React, { useState } from 'react';
import { 
  Terminal, 
  Copy, 
  Check, 
  Code, 
  Zap
} from './Icons';

export default function ApiDocs({ onShowToast }) {
  const [copiedId, setCopiedId] = useState(null);
  const [activeLang, setActiveLang] = useState('cli');

  const copyCode = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    onShowToast('Snippet copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const cliCode = `# 1. Highest quality 4K video with uncompressed master audio
yt-dlp -f "bestvideo[height<=2160]+bestaudio/best" --merge-output-format mp4 https://www.youtube.com/watch?v=dQw4w9WgXcQ

# 2. Extract lossless 320kbps MP3 with embedded high-res cover art
yt-dlp -x --audio-format mp3 --audio-quality 320k --embed-thumbnail --embed-metadata https://www.youtube.com/watch?v=dQw4w9WgXcQ

# 3. High-throughput multi-threaded chunk harvester (16 connections)
yt-dlp -N 16 --concurrent-fragments 16 --buffer-size 16M https://www.youtube.com/watch?v=dQw4w9WgXcQ`;

  const pythonCode = `import yt_dlp

ydl_opts = {
    'format': 'bestvideo[height<=2160]+bestaudio/best',
    'outtmpl': '%(title)s.%(ext)s',
    'merge_output_format': 'mp4',
    'postprocessors': [{
        'key': 'FFmpegVideoRemuxer',
        'preferedformat': 'mp4',
    }],
    'n_threads': 16,
    'quiet': False
}

with yt_dlp.YoutubeDL(ydl_opts) as ydl:
    ydl.download(['https://www.youtube.com/watch?v=dQw4w9WgXcQ'])`;

  const curlCode = `# REST API endpoint for remote cluster processing
curl -X POST "https://api.lifetube.core/v1/extract" \\
  -H "Authorization: Bearer lt_live_key_9981248" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "resolution": "2160p",
    "format": "mp4",
    "audio_bitrate": "320k",
    "muxer": "ffmpeg_direct"
  }'`;

  return (
    <div className="stream-harvester-container">
      {/* Top Status Pill */}
      <div className="engine-status-pill-row">
        <div className="status-pill glass-pill">
          <span className="green-pulse-dot"></span>
          <span className="pill-text-strong">CLI &amp; Core Engine API</span>
          <span className="pill-separator">•</span>
          <span className="pill-text-muted">REST v1.4 Enabled</span>
          <span className="pill-separator">•</span>
          <span className="pill-text-muted">Python SDK 2026.03 Ready</span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="harvester-hero-header">
        <h1 className="hero-title font-serif">
          Developer CLI <span className="coral-ampersand">&amp;</span> REST API Reference
        </h1>
        <p className="hero-subtitle">
          Direct programmatic access to Life Tube's high-speed extraction engine, custom format pipelines, and multi-thread hardware muxing.
        </p>
      </div>

      {/* Code Tabs Panel */}
      <div className="code-docs-panel glass-panel">
        <div className="code-docs-header">
          <div className="code-tabs-list">
            <button 
              className={`code-tab-btn ${activeLang === 'cli' ? 'active' : ''}`}
              onClick={() => setActiveLang('cli')}
            >
              <Terminal size={14} />
              <span>yt-dlp CLI</span>
            </button>
            <button 
              className={`code-tab-btn ${activeLang === 'python' ? 'active' : ''}`}
              onClick={() => setActiveLang('python')}
            >
              <Code size={14} />
              <span>Python SDK</span>
            </button>
            <button 
              className={`code-tab-btn ${activeLang === 'curl' ? 'active' : ''}`}
              onClick={() => setActiveLang('curl')}
            >
              <Zap size={14} />
              <span>REST cURL</span>
            </button>
          </div>

          <button 
            className="copy-snippet-btn font-mono"
            onClick={() => {
              const code = activeLang === 'cli' ? cliCode : activeLang === 'python' ? pythonCode : curlCode;
              copyCode(activeLang, code);
            }}
          >
            {copiedId === activeLang ? <Check size={14} className="green" /> : <Copy size={14} />}
            <span>{copiedId === activeLang ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>

        <div className="code-box-body">
          <pre className="code-pre font-mono">
            <code>
              {activeLang === 'cli' && cliCode}
              {activeLang === 'python' && pythonCode}
              {activeLang === 'curl' && curlCode}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}
