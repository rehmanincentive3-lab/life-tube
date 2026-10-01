import express from 'express';
import fs from 'fs';
import path from 'path';
import { extractMetadata, downloadVideo, downloadAudio } from '../services/ytdlpService.js';
import { 
  validateSafeUrl, 
  validateDownloadRequest, 
  validateAudioDownloadRequest 
} from '../utils/sanitizer.js';
import { createJobVault, cleanupJobVault } from '../services/tempManager.js';
import { 
  createDownloadJob, 
  getJob, 
  getSafeJob, 
  cancelJob, 
  subscribeToJobProgress 
} from '../services/jobManager.js';
import { analyzeRateLimiter, downloadRateLimiter } from '../middleware/rateLimiter.js';
import { CONFIG } from '../config.js';

const router = express.Router();

// Active concurrent direct downloads counter
let activeDownloadsCount = 0;

/**
 * POST /api/analyze
 * Extracts real stream metadata via yt-dlp with rate limiting & SSRF validation
 */
router.post('/analyze', analyzeRateLimiter, async (req, res) => {
  try {
    const { url } = req.body || {};

    const urlCheck = validateSafeUrl(url);
    if (!urlCheck.isValid) {
      return res.status(400).json({ 
        success: false, 
        error: {
          code: urlCheck.errorCode || 'INVALID_URL',
          message: urlCheck.error || 'Please paste a valid video URL.',
        }
      });
    }

    const metadata = await extractMetadata(urlCheck.cleanUrl);
    return res.status(200).json(metadata);
  } catch (err) {
    console.error('[API /api/analyze Error]:', err.message);
    const safeErrorMessage = err.message || 'Unable to analyze this video URL. Please check the link and try again.';
    const errorCode = err.code || 'ANALYSIS_FAILED';

    return res.status(400).json({
      success: false,
      error: safeErrorMessage,
      details: safeErrorMessage,
      errorCode: errorCode,
    });
  }
});

/**
 * POST /api/download/job
 * Creates an asynchronous video/audio download job tracked via real-time progress engine
 */
router.post('/download/job', downloadRateLimiter, async (req, res) => {
  try {
    const { type = 'video', url, format, quality, title } = req.body || {};

    // 1. Validate by type
    if (type === 'audio') {
      const validation = validateAudioDownloadRequest({ url, format, quality });
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: {
            code: validation.errorCode || 'INVALID_PARAMETERS',
            message: validation.error,
          }
        });
      }

      const job = createDownloadJob({
        type: 'audio',
        url: validation.cleanUrl,
        format: validation.cleanFormat,
        quality: validation.cleanQuality,
        title,
      });

      return res.status(200).json({
        success: true,
        jobId: job.id,
        job: getSafeJob(job),
      });
    } else {
      // Video
      const validation = validateDownloadRequest({ url, format, quality });
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: {
            code: validation.errorCode || 'INVALID_PARAMETERS',
            message: validation.error,
          }
        });
      }

      const job = createDownloadJob({
        type: 'video',
        url: validation.cleanUrl,
        format: validation.cleanFormat,
        quality: validation.cleanQuality,
        title,
      });

      return res.status(200).json({
        success: true,
        jobId: job.id,
        job: getSafeJob(job),
      });
    }
  } catch (err) {
    console.error('[API /api/download/job Error]:', err.message);
    const statusCode = err.code === 'SERVER_BUSY' ? 429 : 500;
    return res.status(statusCode).json({
      success: false,
      error: {
        code: err.code || 'JOB_CREATION_FAILED',
        message: err.code === 'SERVER_BUSY'
          ? 'The download server is currently busy. Please try again shortly.'
          : 'Unable to start download job. Please try again.',
      }
    });
  }
});

/**
 * GET /api/download/progress/:jobId
 * Server-Sent Events (SSE) stream for real-time progress updates
 */
router.get('/download/progress/:jobId', (req, res) => {
  const { jobId } = req.params;
  if (!jobId || !/^job_[0-9]+_[a-f0-9]+$/.test(jobId)) {
    return res.status(400).json({ error: 'Invalid job ID format.' });
  }

  subscribeToJobProgress(jobId, res);
});

/**
 * POST /api/download/cancel
 * Safely cancels a running job and removes its process & temp files
 */
router.post('/download/cancel', (req, res) => {
  const { jobId } = req.body || {};
  if (!jobId || typeof jobId !== 'string' || !/^job_[0-9]+_[a-f0-9]+$/.test(jobId)) {
    return res.status(400).json({ success: false, error: 'Valid job ID is required.' });
  }

  const result = cancelJob(jobId);
  return res.status(200).json(result);
});

/**
 * GET /api/download/file/:jobId
 * Streams the completed file to the browser with strict path traversal & header verification
 */
router.get('/download/file/:jobId', (req, res) => {
  const { jobId } = req.params;
  if (!jobId || !/^job_[0-9]+_[a-f0-9]+$/.test(jobId)) {
    return res.status(400).json({ error: 'Invalid job ID format.' });
  }

  const job = getJob(jobId);
  if (!job) {
    return res.status(404).json({ error: 'Download job not found or expired.' });
  }

  if (job.status !== 'READY' && job.status !== 'COMPLETED') {
    return res.status(400).json({ 
      error: `File is not ready for download. Current status: ${job.status}` 
    });
  }

  if (!job.filePath || !fs.existsSync(job.filePath)) {
    return res.status(404).json({ error: 'Media file not found on server.' });
  }

  // Path Traversal Security: Ensure the file strictly resides within the configured temporary vault
  const normalizedFilePath = path.resolve(job.filePath);
  const normalizedVault = path.resolve(CONFIG.TEMP_DIR);
  if (!normalizedFilePath.startsWith(normalizedVault)) {
    console.error(`[Security Alert] Traversal attempt blocked on job file: ${normalizedFilePath}`);
    return res.status(403).json({ error: 'Access denied.' });
  }

  const safeFilename = encodeURIComponent(job.filename || 'download.mp4');
  res.setHeader('Content-Type', job.mimeType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"; filename*=UTF-8''${safeFilename}`);
  res.setHeader('Content-Length', job.fileSize);
  res.setHeader('X-Content-Type-Options', 'nosniff');

  const fileStream = fs.createReadStream(job.filePath);
  fileStream.pipe(res);

  const onStreamComplete = () => {
    job.status = 'COMPLETED';
    console.log(`[Job File Delivered ${jobId}] File delivered to client.`);
  };

  res.on('finish', onStreamComplete);

  fileStream.on('error', (err) => {
    console.error(`[Job File Stream Error ${jobId}]:`, err.message);
    onStreamComplete();
  });
});

/**
 * Direct Video Download Endpoint (Legacy Direct Streaming)
 * POST /api/download/video
 */
router.post('/download/video', downloadRateLimiter, async (req, res) => {
  if (activeDownloadsCount >= CONFIG.MAX_CONCURRENT_DOWNLOADS) {
    return res.status(429).json({
      success: false,
      error: {
        code: 'SERVER_BUSY',
        message: 'The download server is currently busy. Please try again in a moment.',
      }
    });
  }

  const validation = validateDownloadRequest(req.body);
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: {
        code: validation.errorCode || 'INVALID_PARAMETERS',
        message: validation.error,
      }
    });
  }

  const { cleanUrl, cleanFormat, cleanQuality } = validation;
  const { jobId, jobPath } = createJobVault();
  activeDownloadsCount++;

  try {
    const result = await downloadVideo({
      url: cleanUrl,
      format: cleanFormat,
      quality: cleanQuality,
      jobPath,
    });

    const safeFilename = encodeURIComponent(result.filename);
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"; filename*=UTF-8''${safeFilename}`);
    res.setHeader('Content-Length', result.fileSize);
    res.setHeader('X-Content-Type-Options', 'nosniff');

    const fileStream = fs.createReadStream(result.filePath);
    fileStream.pipe(res);

    const onStreamEnd = () => {
      activeDownloadsCount = Math.max(0, activeDownloadsCount - 1);
      cleanupJobVault(jobPath);
    };

    res.on('finish', onStreamEnd);
    res.on('close', () => {
      if (!res.writableEnded) {
        onStreamEnd();
      }
    });

    fileStream.on('error', (streamErr) => {
      console.error(`[Video Job Stream Error ${jobId}]:`, streamErr.message);
      onStreamEnd();
    });
  } catch (err) {
    console.error(`[Video Processing Error ${jobId}]:`, err.message);
    activeDownloadsCount = Math.max(0, activeDownloadsCount - 1);
    cleanupJobVault(jobPath);

    return res.status(500).json({
      success: false,
      error: {
        code: 'VIDEO_PROCESSING_FAILED',
        message: 'Unable to process video stream. Please check the URL and try again.',
      }
    });
  }
});

/**
 * Direct Audio Download Endpoint (Legacy Direct Streaming)
 * POST /api/download/audio
 */
router.post('/download/audio', downloadRateLimiter, async (req, res) => {
  if (activeDownloadsCount >= CONFIG.MAX_CONCURRENT_DOWNLOADS) {
    return res.status(429).json({
      success: false,
      error: {
        code: 'SERVER_BUSY',
        message: 'The download server is currently busy. Please try again in a moment.',
      }
    });
  }

  const validation = validateAudioDownloadRequest(req.body);
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: {
        code: validation.errorCode || 'INVALID_PARAMETERS',
        message: validation.error,
      }
    });
  }

  const { cleanUrl, cleanFormat, cleanQuality, numericBitrate } = validation;
  const { jobId, jobPath } = createJobVault();
  activeDownloadsCount++;

  try {
    const result = await downloadAudio({
      url: cleanUrl,
      format: cleanFormat,
      quality: cleanQuality,
      numericBitrate,
      jobPath,
    });

    const safeFilename = encodeURIComponent(result.filename);
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"; filename*=UTF-8''${safeFilename}`);
    res.setHeader('Content-Length', result.fileSize);
    res.setHeader('X-Content-Type-Options', 'nosniff');

    const fileStream = fs.createReadStream(result.filePath);
    fileStream.pipe(res);

    const onStreamEnd = () => {
      activeDownloadsCount = Math.max(0, activeDownloadsCount - 1);
      cleanupJobVault(jobPath);
    };

    res.on('finish', onStreamEnd);
    res.on('close', () => {
      if (!res.writableEnded) {
        onStreamEnd();
      }
    });

    fileStream.on('error', (streamErr) => {
      console.error(`[Audio Job Stream Error ${jobId}]:`, streamErr.message);
      onStreamEnd();
    });
  } catch (err) {
    console.error(`[Audio Processing Error ${jobId}]:`, err.message);
    activeDownloadsCount = Math.max(0, activeDownloadsCount - 1);
    cleanupJobVault(jobPath);

    return res.status(500).json({
      success: false,
      error: {
        code: 'AUDIO_PROCESSING_FAILED',
        message: 'Unable to extract audio from video stream. Please try again.',
      }
    });
  }
});

export default router;
