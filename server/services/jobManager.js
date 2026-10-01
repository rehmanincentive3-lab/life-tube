import { spawn, exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { CONFIG } from '../config.js';
import { createJobVault, cleanupJobVault } from './tempManager.js';
import { sanitizeFilename } from '../utils/sanitizer.js';

// Height map for video resolutions
const QUALITY_HEIGHT_MAP = {
  '144p': 144,
  '240p': 240,
  '360p': 360,
  '480p': 480,
  '720p': 720,
  '1080p': 1080,
  '1440p': 1440,
  '2160p': 2160,
};

// In-memory active jobs map
const jobs = new Map();

/**
 * Convert ETA string (e.g., '00:45' or '01:23:45') into human-readable label
 */
const formatEta = (rawEta) => {
  if (!rawEta) return 'Calculating remaining time...';
  const parts = rawEta.split(':').map((p) => parseInt(p, 10));
  if (parts.some((n) => isNaN(n))) return rawEta;

  if (parts.length === 2) {
    const [mins, secs] = parts;
    if (mins === 0) return `${secs} sec remaining`;
    return `${mins} min ${secs} sec remaining`;
  }
  if (parts.length === 3) {
    const [hrs, mins, secs] = parts;
    return `${hrs} hr ${mins} min ${secs} sec remaining`;
  }
  return rawEta;
};

/**
 * Format bytes into human-readable string
 */
const formatBytes = (bytes) => {
  if (typeof bytes !== 'number' || isNaN(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

/**
 * Get safe public representation of a job (without server paths or internal objects)
 */
export const getSafeJob = (job) => {
  if (!job) return null;
  return {
    id: job.id,
    type: job.type,
    url: job.url,
    title: job.title || 'LifeTube Media',
    format: job.format,
    quality: job.quality,
    status: job.status,
    statusMessage: job.statusMessage || '',
    progress: Math.min(100, Math.max(0, Math.round(job.progress * 10) / 10)),
    downloadedText: job.downloadedText || '',
    totalText: job.totalText || '',
    speed: job.speed || '',
    eta: job.eta || '',
    filename: job.filename || '',
    fileSize: job.fileSize || 0,
    fileSizeText: job.fileSize ? formatBytes(job.fileSize) : '',
    mimeType: job.mimeType || '',
    error: job.error || null,
    createdAt: job.createdAt,
    completedAt: job.completedAt || null,
  };
};

/**
 * Broadcast SSE event to all connected clients for a job
 */
const broadcastJobUpdate = (job) => {
  if (!job || !job.sseClients) return;
  const payload = `data: ${JSON.stringify(getSafeJob(job))}\n\n`;

  for (const client of job.sseClients) {
    try {
      client.write(payload);
    } catch {
      job.sseClients.delete(client);
    }
  }
};

/**
 * Parse standard yt-dlp progress line output
 */
const parseProgressOutput = (job, text) => {
  const lines = text.split(/\r|\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // 1. Check for download percentage line
    // e.g. [download]  45.2% of  120.50MiB at    5.40MiB/s ETA 00:12
    // e.g. [download]  100% of  120.50MiB in 00:22
    const downloadMatch = trimmed.match(/\[download\]\s+(\d{1,3}(?:\.\d+)?)%\s+of\s+~?(\S+)(?:\s+at\s+(\S+))?(?:\s+ETA\s+(\S+))?/i);
    if (downloadMatch) {
      const percent = parseFloat(downloadMatch[1]);
      const totalStr = downloadMatch[2] || '';
      const speedStr = downloadMatch[3] || '';
      const etaStr = downloadMatch[4] || '';

      if (!isNaN(percent)) {
        job.progress = percent;
        job.status = 'DOWNLOADING';
        job.statusMessage = job.type === 'video' ? 'Downloading video & audio streams...' : 'Downloading audio stream...';
        job.totalText = totalStr;

        // Estimate downloaded amount from percent and totalStr
        if (totalStr) {
          job.downloadedText = `${((percent / 100) * parseFloat(totalStr)).toFixed(1)} ${totalStr.replace(/[0-9.]/g, '')}`;
        }
        if (speedStr && speedStr !== 'N/A') {
          job.speed = speedStr;
        }
        if (etaStr && etaStr !== 'N/A') {
          job.eta = formatEta(etaStr);
        }

        broadcastJobUpdate(job);
      }
      continue;
    }

    // 2. Check for Merger/Post-Processing
    if (trimmed.includes('[Merger]') || trimmed.includes('Merging formats')) {
      job.status = 'PROCESSING';
      job.statusMessage = 'Merging video and audio streams with FFmpeg...';
      job.eta = 'Finalizing container...';
      broadcastJobUpdate(job);
      continue;
    }

    // 3. Check for Audio Extraction / Conversion
    if (trimmed.includes('[ExtractAudio]') || trimmed.includes('Destination:') || trimmed.includes('[ffmpeg]')) {
      job.status = 'PROCESSING';
      job.statusMessage = `Encoding ${job.format.toUpperCase()} audio at ${job.quality} with FFmpeg...`;
      job.eta = 'Encoding audio...';
      broadcastJobUpdate(job);
      continue;
    }

    // 4. Check for Finalizing container
    if (trimmed.includes('[FixupM4a]') || trimmed.includes('Correcting container')) {
      job.status = 'FINALIZING';
      job.statusMessage = 'Finalizing container and metadata...';
      broadcastJobUpdate(job);
      continue;
    }
  }
};

/**
 * Terminate a running OS process cleanly
 */
const killProcessSafely = (processInstance) => {
  if (!processInstance || !processInstance.pid) return;

  try {
    if (process.platform === 'win32') {
      exec(`taskkill /pid ${processInstance.pid} /T /F`, () => {});
    } else {
      processInstance.kill('SIGKILL');
    }
  } catch {
    // ignore kill errors
  }
};

/**
 * Create and start a background download job
 */
export const createDownloadJob = ({ type = 'video', url, format, quality, title = 'LifeTube Media' }) => {
  // Enforce server concurrency
  let activeRunningJobs = 0;
  for (const j of jobs.values()) {
    if (['QUEUED', 'PREPARING', 'DOWNLOADING', 'PROCESSING', 'FINALIZING'].includes(j.status)) {
      activeRunningJobs++;
    }
  }

  if (activeRunningJobs >= CONFIG.MAX_CONCURRENT_DOWNLOADS) {
    const error = new Error('The download server is currently busy. Please try again in a moment.');
    error.code = 'SERVER_BUSY';
    throw error;
  }

  const { jobId, jobPath } = createJobVault();
  const cleanFormat = (format || (type === 'video' ? 'mp4' : 'mp3')).toLowerCase();
  const cleanQuality = quality || (type === 'video' ? '1080p' : '320k');

  const job = {
    id: jobId,
    jobPath,
    type,
    url,
    title,
    format: cleanFormat,
    quality: cleanQuality,
    status: 'QUEUED',
    statusMessage: 'Job queued for processing...',
    progress: 0,
    downloadedText: '0 MB',
    totalText: 'Calculating...',
    speed: 'Calculating...',
    eta: 'Calculating remaining time...',
    filename: null,
    filePath: null,
    fileSize: 0,
    mimeType: type === 'video'
      ? (cleanFormat === 'webm' ? 'video/webm' : 'video/mp4')
      : (cleanFormat === 'm4a' ? 'audio/mp4' : 'audio/mpeg'),
    error: null,
    processInstance: null,
    createdAt: Date.now(),
    completedAt: null,
    sseClients: new Set(),
  };

  jobs.set(jobId, job);

  // Asynchronously execute download
  startJobExecution(job);

  return job;
};

/**
 * Execute yt-dlp process for the job
 */
const startJobExecution = async (job) => {
  job.status = 'PREPARING';
  job.statusMessage = job.type === 'video' 
    ? `Probing video stream for ${job.quality} ${job.format.toUpperCase()}...`
    : `Probing audio stream for ${job.format.toUpperCase()} (${job.quality})...`;
  broadcastJobUpdate(job);

  const targetExt = job.format.toLowerCase();
  const outputTemplate = path.join(job.jobPath, '%(title)s.%(ext)s');
  let args = [];

  if (job.type === 'video') {
    const targetHeight = QUALITY_HEIGHT_MAP[job.quality] || 1080;
    let formatSelector;
    if (targetExt === 'mp4') {
      formatSelector = `bestvideo[height<=${targetHeight}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${targetHeight}]+bestaudio/best[height<=${targetHeight}][ext=mp4]/best[height<=${targetHeight}]/best`;
    } else {
      formatSelector = `bestvideo[height<=${targetHeight}][ext=webm]+bestaudio[ext=webm]/bestvideo[height<=${targetHeight}]+bestaudio/best[height<=${targetHeight}]/best`;
    }

    args = [
      '-f',
      formatSelector,
      '--merge-output-format',
      targetExt,
      '--ffmpeg-location',
      CONFIG.FFMPEG_PATH,
      '--user-agent',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      '--extractor-args',
      'youtube:player_client=web,android',
      '--newline',
      '-o',
      outputTemplate,
      '--no-playlist',
      '--no-part',
      '--no-warnings',
      '--retries',
      '3',
    ];

    if (CONFIG.DENO_PATH) {
      args.push('--js-runtimes', `deno:${CONFIG.DENO_PATH}`);
    }

    args.push(job.url);
  } else {
    // Audio Extraction
    const numericBitrate = job.quality.replace(/[^0-9]/g, '') || '320';
    const bitrateQuality = `${numericBitrate}K`;
    const formatSelector = targetExt === 'm4a'
      ? 'bestaudio[ext=m4a]/bestaudio/best'
      : 'bestaudio/best';

    args = [
      '-x',
      '--audio-format',
      targetExt,
      '--audio-quality',
      bitrateQuality,
      '-f',
      formatSelector,
      '--ffmpeg-location',
      CONFIG.FFMPEG_PATH,
      '--user-agent',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      '--extractor-args',
      'youtube:player_client=web,android',
      '--newline',
      '-o',
      outputTemplate,
      '--no-playlist',
      '--no-part',
      '--no-warnings',
      '--retries',
      '3',
    ];

    if (CONFIG.DENO_PATH) {
      args.push('--js-runtimes', `deno:${CONFIG.DENO_PATH}`);
    }

    args.push(job.url);
  }

  console.log(`[Job Engine ${job.id}] Starting ${job.type} download: ${job.format} • ${job.quality}`);

  const processInstance = spawn(CONFIG.YTDLP_PATH, args, {
    windowsHide: true,
    shell: false,
  });

  job.processInstance = processInstance;

  let stderrData = '';

  processInstance.stdout.on('data', (data) => {
    parseProgressOutput(job, data.toString());
  });

  processInstance.stderr.on('data', (data) => {
    const text = data.toString();
    stderrData += text;
    parseProgressOutput(job, text);
  });

  // Timeout protection
  const timeoutTimer = setTimeout(() => {
    if (['QUEUED', 'PREPARING', 'DOWNLOADING', 'PROCESSING', 'FINALIZING'].includes(job.status)) {
      killProcessSafely(processInstance);
      job.status = 'FAILED';
      job.error = 'Download exceeded maximum time limit of 5 minutes.';
      job.statusMessage = 'Job timed out.';
      broadcastJobUpdate(job);
      cleanupJobVault(job.jobPath);
    }
  }, CONFIG.DOWNLOAD_TIMEOUT_MS);

  processInstance.on('close', (code) => {
    clearTimeout(timeoutTimer);

    if (job.status === 'CANCELLED') {
      cleanupJobVault(job.jobPath);
      return;
    }

    if (code !== 0) {
      console.error(`[Job Engine Failed ${job.id} code=${code}]:`, stderrData);
      job.status = 'FAILED';

      const errorLower = stderrData.toLowerCase();
      let userMessage = 'Failed to process media stream from provider.';

      if (errorLower.includes('sign in to confirm') || errorLower.includes('not a bot')) {
        userMessage = 'Platform requires anti-bot verification or sign-in for this stream. Please try another video.';
      } else if (errorLower.includes('private video') || errorLower.includes('private') || errorLower.includes('login')) {
        userMessage = 'This video is private, age-restricted, or requires login.';
      } else if (errorLower.includes('not available') || errorLower.includes('unavailable') || errorLower.includes('deleted')) {
        userMessage = 'This video is unavailable or has been deleted.';
      } else if (errorLower.includes('requested format is not available')) {
        userMessage = `The requested quality (${job.quality}) is unavailable. Please try another quality option.`;
      } else if (errorLower.includes('403') || errorLower.includes('forbidden')) {
        userMessage = 'Access to this video stream was blocked by provider (HTTP 403).';
      } else if (errorLower.includes('ffmpeg') || errorLower.includes('muxer')) {
        userMessage = 'Media processing error during video/audio merging.';
      }

      job.statusMessage = userMessage;
      job.error = userMessage;
      broadcastJobUpdate(job);
      cleanupJobVault(job.jobPath);
      return;
    }

    // Locate generated file in jobPath
    try {
      const files = fs.readdirSync(job.jobPath);
      const mediaFile = files.find((f) => f.endsWith(`.${targetExt}`) || (job.type === 'audio' && (f.endsWith('.mp3') || f.endsWith('.m4a'))) || (job.type === 'video' && (f.endsWith('.mp4') || f.endsWith('.webm'))));

      if (!mediaFile) {
        job.status = 'FAILED';
        job.error = 'Generated media file was not found on disk.';
        job.statusMessage = 'Output file missing.';
        broadcastJobUpdate(job);
        cleanupJobVault(job.jobPath);
        return;
      }

      const filePath = path.join(job.jobPath, mediaFile);
      const stats = fs.statSync(filePath);

      if (stats.size === 0) {
        job.status = 'FAILED';
        job.error = 'Generated media file is empty.';
        job.statusMessage = 'Empty file generated.';
        broadcastJobUpdate(job);
        cleanupJobVault(job.jobPath);
        return;
      }

      const rawTitle = path.parse(mediaFile).name;
      const safeName = sanitizeFilename(rawTitle, targetExt);

      job.status = 'READY';
      job.statusMessage = 'File processing complete! Ready for download.';
      job.progress = 100;
      job.filename = safeName;
      job.filePath = filePath;
      job.fileSize = stats.size;
      job.completedAt = Date.now();

      broadcastJobUpdate(job);
      console.log(`[Job Engine Ready ${job.id}] ${safeName} (${formatBytes(stats.size)})`);
    } catch (fsErr) {
      console.error(`[Job Engine File Error ${job.id}]:`, fsErr);
      job.status = 'FAILED';
      job.error = 'Error retrieving processed media file.';
      job.statusMessage = 'File access error.';
      broadcastJobUpdate(job);
      cleanupJobVault(job.jobPath);
    }
  });

  processInstance.on('error', (err) => {
    clearTimeout(timeoutTimer);
    if (job.status === 'CANCELLED') return;

    console.error(`[Job Engine Spawn Error ${job.id}]:`, err);
    job.status = 'FAILED';
    job.error = 'Failed to initiate downloader process.';
    job.statusMessage = 'Downloader process error.';
    broadcastJobUpdate(job);
    cleanupJobVault(job.jobPath);
  });
};

/**
 * Retrieve a job by ID
 */
export const getJob = (jobId) => {
  if (!jobId || typeof jobId !== 'string') return null;
  return jobs.get(jobId) || null;
};

/**
 * Cancel an active job and clean up its resources
 */
export const cancelJob = (jobId) => {
  const job = jobs.get(jobId);
  if (!job) {
    return { success: false, message: 'Job not found.' };
  }

  if (['COMPLETED', 'CANCELLED'].includes(job.status)) {
    return { success: true, status: job.status };
  }

  console.log(`[Job Engine Cancel] Terminating job: ${jobId}`);
  job.status = 'CANCELLED';
  job.statusMessage = 'Download cancelled by user.';
  job.error = 'Download cancelled.';

  killProcessSafely(job.processInstance);
  cleanupJobVault(job.jobPath);
  broadcastJobUpdate(job);

  // Close SSE clients
  for (const client of job.sseClients) {
    try {
      client.end();
    } catch {
      // ignore
    }
  }
  job.sseClients.clear();

  return { success: true, status: 'CANCELLED' };
};

/**
 * Register SSE client for live progress updates
 */
export const subscribeToJobProgress = (jobId, res) => {
  const job = jobs.get(jobId);
  if (!job) {
    res.status(404).json({ error: 'Job not found.' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  // Send initial snapshot
  res.write(`data: ${JSON.stringify(getSafeJob(job))}\n\n`);

  // If already finished, close after sending snapshot
  if (['COMPLETED', 'CANCELLED', 'FAILED'].includes(job.status)) {
    res.end();
    return;
  }

  job.sseClients.add(res);

  res.on('close', () => {
    job.sseClients.delete(res);
  });
};

/**
 * Periodic cleanup of stale jobs (>15 min old)
 */
export const startStaleJobCleanup = () => {
  setInterval(() => {
    const now = Date.now();
    for (const [jobId, job] of jobs.entries()) {
      const ageMs = now - job.createdAt;
      if (ageMs > 15 * 60 * 1000) {
        if (job.processInstance) {
          killProcessSafely(job.processInstance);
        }
        cleanupJobVault(job.jobPath);
        jobs.delete(jobId);
        console.log(`[Job GC] Removed expired job: ${jobId}`);
      }
    }
  }, 5 * 60 * 1000);
};
