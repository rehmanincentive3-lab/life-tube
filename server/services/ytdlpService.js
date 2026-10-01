import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { CONFIG } from '../config.js';
import { sanitizeFilename } from '../utils/sanitizer.js';

// Height map for standard resolutions
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

/**
 * Detect media platform name from URL and yt-dlp extractor
 */
export const detectPlatform = (url = '', extractor = '') => {
  const urlLower = url.toLowerCase();
  const extractorLower = (extractor || '').toLowerCase();

  if (extractorLower.includes('youtube') || urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
    return 'YouTube';
  }
  if (extractorLower.includes('tiktok') || urlLower.includes('tiktok.com')) {
    return 'TikTok';
  }
  if (extractorLower.includes('instagram') || urlLower.includes('instagram.com')) {
    return 'Instagram';
  }
  if (extractorLower.includes('facebook') || urlLower.includes('facebook.com') || urlLower.includes('fb.watch') || urlLower.includes('fb.com')) {
    return 'Facebook';
  }
  if (extractorLower.includes('vimeo') || urlLower.includes('vimeo.com')) {
    return 'Vimeo';
  }
  if (extractorLower.includes('soundcloud') || urlLower.includes('soundcloud.com')) {
    return 'SoundCloud';
  }
  if (extractorLower.includes('dailymotion') || urlLower.includes('dailymotion.com')) {
    return 'Dailymotion';
  }
  if (extractorLower.includes('twitter') || extractorLower.includes('x.com') || urlLower.includes('twitter.com') || urlLower.includes('x.com')) {
    return 'Twitter / X';
  }

  return 'Online Media';
};

/**
 * Format duration in seconds to MM:SS or HH:MM:SS
 */
const formatDuration = (seconds) => {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) return '00:00';
  const rounded = Math.floor(seconds);
  const hrs = Math.floor(rounded / 3600);
  const mins = Math.floor((rounded % 3600) / 60);
  const secs = rounded % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return hrs > 0 ? `${hrs}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
};

/**
 * Format view count
 */
const formatViewCount = (count) => {
  if (typeof count !== 'number' || isNaN(count) || count < 0) return null;
  if (count >= 1_000_000_000) return `${(count / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B views`;
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M views`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1).replace(/\.0$/, '')}K views`;
  return `${count.toLocaleString()} views`;
};

/**
 * Format file size
 */
const formatFileSize = (bytes) => {
  if (typeof bytes !== 'number' || isNaN(bytes) || bytes <= 0) return 'Variable';
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
 * Extract Real Media Metadata using yt-dlp -J
 */
export const extractMetadata = (url) => {
  return new Promise((resolve, reject) => {
    const args = [
      '-J',
      '--no-playlist',
      '--no-warnings',
      '--skip-download',
      '--ffmpeg-location',
      CONFIG.FFMPEG_PATH,
      '--user-agent',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    ];

    if (CONFIG.DENO_PATH) {
      args.push('--js-runtimes', `deno:${CONFIG.DENO_PATH}`);
    }

    args.push(url);

    console.log(`[yt-dlp] Analyzing metadata for: ${url}`);

    const processInstance = spawn(CONFIG.YTDLP_PATH, args, {
      windowsHide: true,
      shell: false,
    });

    let stdoutData = '';
    let stderrData = '';

    processInstance.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    processInstance.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    // 45s analysis timeout
    const timer = setTimeout(() => {
      processInstance.kill('SIGKILL');
      reject(new Error('Analysis request timed out. Please verify the URL and try again.'));
    }, 45000);

    processInstance.on('close', (code) => {
      clearTimeout(timer);

      if (code !== 0 || !stdoutData.trim()) {
        const errorLower = stderrData.toLowerCase();
        let userMessage = 'Unable to extract stream metadata from this provider. Please check the URL and try again.';
        let errorCode = 'ANALYSIS_FAILED';

        if (errorLower.includes('sign in to confirm') || errorLower.includes('not a bot')) {
          userMessage = 'YouTube requires sign-in or anti-bot verification for this stream. Please try another public video.';
          errorCode = 'BOT_VERIFICATION_REQUIRED';
        } else if (errorLower.includes('private video') || errorLower.includes('private') || errorLower.includes('login') || errorLower.includes('sign in')) {
          userMessage = 'This video is private, age-restricted, or requires login.';
          errorCode = 'PRIVATE_OR_RESTRICTED';
        } else if (errorLower.includes('not available') || errorLower.includes('unavailable') || errorLower.includes('deleted')) {
          userMessage = 'This video is unavailable, deleted, or cannot be accessed.';
          errorCode = 'VIDEO_UNAVAILABLE';
        } else if (errorLower.includes('geo') || errorLower.includes('region') || errorLower.includes('country')) {
          userMessage = 'This video stream is restricted in the server region.';
          errorCode = 'REGION_RESTRICTED';
        } else if (errorLower.includes('403') || errorLower.includes('forbidden')) {
          userMessage = 'Access to this provider stream was denied (HTTP 403).';
          errorCode = 'PROVIDER_FORBIDDEN';
        } else if (errorLower.includes('unsupported url') || errorLower.includes('is not a valid url')) {
          userMessage = 'This media URL is not supported by the extraction engine.';
          errorCode = 'UNSUPPORTED_URL';
        }

        const customError = new Error(userMessage);
        customError.code = errorCode;
        return reject(customError);
      }

      try {
        const rawJson = JSON.parse(stdoutData);
        const rawFormats = rawJson.formats || [];
        const durationSecs = rawJson.duration || 0;
        const platform = detectPlatform(url, rawJson.extractor_key || rawJson.extractor);

        // Identify available heights from real video streams
        const availableHeights = new Set();
        let hasWebm = false;
        let hasMp4 = false;

        for (const f of rawFormats) {
          if (f.vcodec && f.vcodec !== 'none') {
            const effectiveHeight = (f.height && f.width)
              ? Math.min(f.height, f.width)
              : (f.height || (f.resolution ? parseInt(f.resolution.split('x')[1], 10) : null));

            if (effectiveHeight && typeof effectiveHeight === 'number') {
              availableHeights.add(effectiveHeight);
            }

            if (f.ext === 'webm' || f.vcodec?.includes('vp') || f.vcodec?.includes('av01')) {
              hasWebm = true;
            }
            if (f.ext === 'mp4' || f.vcodec?.includes('avc') || f.vcodec?.includes('h264') || f.vcodec?.includes('hevc')) {
              hasMp4 = true;
            }
          }
        }

        // Available video containers
        const availableVideoContainers = [];
        if (hasMp4 || platform !== 'YouTube') availableVideoContainers.push('mp4');
        if (hasWebm || platform === 'YouTube') availableVideoContainers.push('webm');
        if (availableVideoContainers.length === 0) availableVideoContainers.push('mp4');

        const maxAvailableHeight = availableHeights.size > 0 ? Math.max(...availableHeights) : (rawJson.height || 1080);

        // Standard qualities definition
        const allQualities = [
          { id: '144p', label: '144p', height: 144, resolution: '256x144', badge: 'Fast', badgeType: 'dim', bitrateKbps: 300 },
          { id: '240p', label: '240p', height: 240, resolution: '426x240', badge: 'Fast', badgeType: 'dim', bitrateKbps: 500 },
          { id: '360p', label: '360p', height: 360, resolution: '640x360', badge: 'SD', badgeType: 'dim', bitrateKbps: 900 },
          { id: '480p', label: '480p', height: 480, resolution: '854x480', badge: 'SD', badgeType: 'dim', bitrateKbps: 1500 },
          { id: '720p', label: '720p HD', height: 720, resolution: '1280x720', badge: 'Popular', badgeType: 'neutral', bitrateKbps: 3000 },
          { id: '1080p', label: '1080p Full HD', height: 1080, resolution: '1920x1080', badge: 'Recommended', badgeType: 'green', bitrateKbps: 6000 },
          { id: '1440p', label: '1440p 2K', height: 1440, resolution: '2560x1440', badge: '2K Studio', badgeType: 'neutral', bitrateKbps: 10000 },
          { id: '2160p', label: '2160p 4K', height: 2160, resolution: '3840x2160', badge: '4K UHD', badgeType: 'coral', bitrateKbps: 18000 },
        ];

        // Filter qualities that the video source actually supports
        const supportedVideoQualities = allQualities.filter((q) => q.height <= maxAvailableHeight);
        const availableQualities = supportedVideoQualities.map((q) => q.id);

        const videoFormats = supportedVideoQualities.map((spec) => {
          // Calculate realistic file size based on duration and bitrate
          const approxBytes = durationSecs > 0
            ? Math.round((spec.bitrateKbps * 1000 / 8) * durationSecs)
            : spec.bitrateKbps * 15000;

          return {
            id: spec.id,
            label: spec.label,
            resolution: spec.resolution,
            fps: rawJson.fps || 30,
            filesize: formatFileSize(approxBytes),
            approxBytes,
            badge: spec.badge,
            badgeType: spec.badgeType,
            vcodec: spec.id === '2160p' ? 'AV01 / VP9' : 'H.264 / AVC1',
            acodec: 'AAC LC (Stereo)',
            containers: availableVideoContainers,
          };
        });

        // Calculate audio filesize based on real duration
        const audioFormats = [
          {
            id: '64k',
            label: '64 kbps',
            subtitle: 'Low Bandwidth / Voice',
            codec: 'AAC / MP3',
            filesize: formatFileSize(durationSecs > 0 ? (64 * 1000 / 8) * durationSecs : 3500000),
            badge: 'Voice',
            badgeType: 'dim',
            containers: ['mp3', 'm4a'],
          },
          {
            id: '128k',
            label: '128 kbps',
            subtitle: 'Standard Quality',
            codec: 'AAC / MP3',
            filesize: formatFileSize(durationSecs > 0 ? (128 * 1000 / 8) * durationSecs : 7000000),
            badge: 'Standard',
            badgeType: 'dim',
            containers: ['mp3', 'm4a'],
          },
          {
            id: '192k',
            label: '192 kbps',
            subtitle: 'High Fidelity',
            codec: 'AAC / MP3',
            filesize: formatFileSize(durationSecs > 0 ? (192 * 1000 / 8) * durationSecs : 10500000),
            badge: 'High',
            badgeType: 'neutral',
            containers: ['mp3', 'm4a'],
          },
          {
            id: '256k',
            label: '256 kbps',
            subtitle: 'Studio Dynamic Range',
            codec: 'AAC / MP3',
            filesize: formatFileSize(durationSecs > 0 ? (256 * 1000 / 8) * durationSecs : 14000000),
            badge: 'HQ',
            badgeType: 'neutral',
            containers: ['mp3', 'm4a'],
          },
          {
            id: '320k',
            label: '320 kbps',
            subtitle: 'Maximum Bitrate Master',
            codec: 'LAME MP3 / AAC',
            filesize: formatFileSize(durationSecs > 0 ? (320 * 1000 / 8) * durationSecs : 17500000),
            badge: 'Master',
            badgeType: 'green',
            containers: ['mp3', 'm4a'],
          },
        ];

        resolve({
          id: rawJson.id || `media_${Date.now()}`,
          title: rawJson.title || 'Untitled Online Video',
          thumbnail: rawJson.thumbnail || null,
          platform,
          duration: formatDuration(durationSecs),
          durationSeconds: durationSecs,
          uploader: rawJson.uploader || rawJson.channel || rawJson.creator || null,
          channel: rawJson.channel || rawJson.uploader || rawJson.creator || null,
          viewCount: rawJson.view_count || null,
          formattedViews: formatViewCount(rawJson.view_count),
          uploadDate: rawJson.upload_date ? `Uploaded ${rawJson.upload_date}` : null,
          webpageUrl: rawJson.webpage_url || url,
          availableQualities: availableQualities.length > 0 ? availableQualities : ['720p'],
          availableVideoContainers,
          availableAudioContainers: ['mp3', 'm4a'],
          videoFormats: videoFormats.length > 0 ? videoFormats : allQualities.slice(0, 4),
          audioFormats,
        });
      } catch (parseErr) {
        console.error('[yt-dlp JSON parse error]:', parseErr);
        reject(new Error('Unable to parse stream metadata from provider.'));
      }
    });

    processInstance.on('error', (err) => {
      clearTimeout(timer);
      console.error('[yt-dlp spawn error]:', err);
      reject(new Error('Downloader service is temporarily unavailable.'));
    });
  });
};

/**
 * Execute Real Video Download with yt-dlp & FFmpeg Muxing
 */
export const downloadVideo = ({ url, format = 'mp4', quality = '1080p', jobPath }) => {
  return new Promise((resolve, reject) => {
    const targetHeight = QUALITY_HEIGHT_MAP[quality] || 1080;
    const targetExt = format.toLowerCase() === 'webm' ? 'webm' : 'mp4';

    // Build format selector rule with robust fallback for single stream (TikTok, IG, FB) & DASH streams (YouTube)
    let formatSelector;
    if (targetExt === 'mp4') {
      formatSelector = `bestvideo[height<=${targetHeight}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${targetHeight}]+bestaudio/best[height<=${targetHeight}][ext=mp4]/best[height<=${targetHeight}]/best`;
    } else {
      formatSelector = `bestvideo[height<=${targetHeight}][ext=webm]+bestaudio[ext=webm]/bestvideo[height<=${targetHeight}]+bestaudio/best[height<=${targetHeight}][ext=webm]/best[height<=${targetHeight}]/best`;
    }

    const outputTemplate = path.join(jobPath, '%(title)s.%(ext)s');

    const args = [
      '-f',
      formatSelector,
      '--merge-output-format',
      targetExt,
      '--ffmpeg-location',
      CONFIG.FFMPEG_PATH,
      '--user-agent',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
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

    args.push(url);

    console.log(`[yt-dlp Video Download] Starting download: quality=${quality}, format=${targetExt}`);

    const processInstance = spawn(CONFIG.YTDLP_PATH, args, {
      windowsHide: true,
      shell: false,
    });

    let stderrData = '';

    processInstance.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    // 5-minute timeout protection
    const timer = setTimeout(() => {
      processInstance.kill('SIGKILL');
      reject(new Error('Download exceeded maximum timeout of 5 minutes.'));
    }, CONFIG.DOWNLOAD_TIMEOUT_MS);

    processInstance.on('close', (code) => {
      clearTimeout(timer);

      if (code !== 0) {
        console.error(`[yt-dlp Video Download Error code=${code}]:`, stderrData);
        const errorLower = stderrData.toLowerCase();
        let userMessage = 'Failed to generate video stream from provider.';
        if (errorLower.includes('sign in') || errorLower.includes('bot')) {
          userMessage = 'Platform requires anti-bot verification or login to download this video stream.';
        } else if (errorLower.includes('requested format is not available')) {
          userMessage = `The requested quality (${quality}) is unavailable. Please try another quality.`;
        } else if (errorLower.includes('403') || errorLower.includes('forbidden')) {
          userMessage = 'Access to the video stream was denied by provider (HTTP 403).';
        }
        return reject(new Error(userMessage));
      }

      // Locate output file in jobPath
      try {
        const files = fs.readdirSync(jobPath);
        const mediaFile = files.find((f) => f.endsWith(`.${targetExt}`) || f.endsWith('.mp4') || f.endsWith('.webm'));

        if (!mediaFile) {
          return reject(new Error('Generated media file was not found on disk.'));
        }

        const filePath = path.join(jobPath, mediaFile);
        const stats = fs.statSync(filePath);

        if (stats.size === 0) {
          return reject(new Error('Generated media file is empty.'));
        }

        const rawTitle = path.parse(mediaFile).name;
        const safeName = sanitizeFilename(rawTitle, targetExt);

        resolve({
          filePath,
          filename: safeName,
          fileSize: stats.size,
          mimeType: targetExt === 'webm' ? 'video/webm' : 'video/mp4',
        });
      } catch (fsErr) {
        console.error('[yt-dlp File Read Error]:', fsErr);
        reject(new Error('Error retrieving processed media file.'));
      }
    });

    processInstance.on('error', (err) => {
      clearTimeout(timer);
      console.error('[yt-dlp Spawn Error]:', err);
      reject(new Error('Failed to initiate downloader process.'));
    });
  });
};

/**
 * Execute Real Audio Extraction & Bitrate Encoding with yt-dlp & FFmpeg
 */
export const downloadAudio = ({ url, format = 'mp3', numericBitrate = '320', jobPath }) => {
  return new Promise((resolve, reject) => {
    const targetExt = format.toLowerCase() === 'm4a' ? 'm4a' : 'mp3';
    const mimeType = targetExt === 'm4a' ? 'audio/mp4' : 'audio/mpeg';
    const bitrateQuality = `${numericBitrate}K`;

    // Format selection
    const formatSelector = targetExt === 'm4a'
      ? 'bestaudio[ext=m4a]/bestaudio/best'
      : 'bestaudio/best';

    const outputTemplate = path.join(jobPath, '%(title)s.%(ext)s');

    const args = [
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

    args.push(url);

    console.log(`[yt-dlp Audio Download] Starting extraction: format=${targetExt}, bitrate=${bitrateQuality}`);

    const processInstance = spawn(CONFIG.YTDLP_PATH, args, {
      windowsHide: true,
      shell: false,
    });

    let stderrData = '';

    processInstance.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    // 5-minute timeout protection
    const timer = setTimeout(() => {
      processInstance.kill('SIGKILL');
      reject(new Error('Audio download exceeded maximum timeout of 5 minutes.'));
    }, CONFIG.DOWNLOAD_TIMEOUT_MS);

    processInstance.on('close', (code) => {
      clearTimeout(timer);

      if (code !== 0) {
        console.error(`[yt-dlp Audio Download Error code=${code}]:`, stderrData);
        const errorLower = stderrData.toLowerCase();
        let userMessage = 'Failed to extract audio stream from provider.';
        if (errorLower.includes('sign in') || errorLower.includes('bot')) {
          userMessage = 'Platform requires anti-bot verification or login to extract audio from this stream.';
        } else if (errorLower.includes('403') || errorLower.includes('forbidden')) {
          userMessage = 'Access to the audio stream was denied by provider (HTTP 403).';
        }
        return reject(new Error(userMessage));
      }

      // Locate output file in jobPath
      try {
        const files = fs.readdirSync(jobPath);
        const audioFile = files.find((f) => f.endsWith(`.${targetExt}`) || f.endsWith('.mp3') || f.endsWith('.m4a'));

        if (!audioFile) {
          return reject(new Error('Generated audio file was not found on disk.'));
        }

        const filePath = path.join(jobPath, audioFile);
        const stats = fs.statSync(filePath);

        if (stats.size === 0) {
          return reject(new Error('Generated audio file is empty.'));
        }

        const rawTitle = path.parse(audioFile).name;
        const safeName = sanitizeFilename(rawTitle, targetExt);

        resolve({
          filePath,
          filename: safeName,
          fileSize: stats.size,
          mimeType,
          format: targetExt,
          quality: `${numericBitrate}k`,
        });
      } catch (fsErr) {
        console.error('[yt-dlp Audio File Read Error]:', fsErr);
        reject(new Error('Error retrieving processed audio file.'));
      }
    });

    processInstance.on('error', (err) => {
      clearTimeout(timer);
      console.error('[yt-dlp Audio Spawn Error]:', err);
      reject(new Error('Failed to initiate audio downloader process.'));
    });
  });
};
