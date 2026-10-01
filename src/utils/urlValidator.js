/**
 * Life Tube - URL Validation & Sanitization Utility
 */

import { ERROR_TYPES, ERROR_MESSAGES } from '../types/mediaTypes';

// Supported platform domains and patterns for media analysis
const SUPPORTED_DOMAINS = [
  'youtube.com',
  'youtu.be',
  'm.youtube.com',
  'vimeo.com',
  'player.vimeo.com',
  'tiktok.com',
  'm.tiktok.com',
  'dailymotion.com',
  'dai.ly',
  'soundcloud.com',
  'twitch.tv',
  'clips.twitch.tv',
  'x.com',
  'twitter.com',
  'reddit.com',
  'instagram.com',
  'facebook.com',
  'fb.watch',
];

/**
 * Validate media stream URL and return sanitized URL or error details
 */
export const validateMediaUrl = (rawUrl) => {
  // 1. Check for empty or whitespace-only input
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return {
      isValid: false,
      errorType: ERROR_TYPES.EMPTY_URL,
      errorMessage: ERROR_MESSAGES[ERROR_TYPES.EMPTY_URL],
      sanitizedUrl: '',
    };
  }

  const trimmed = rawUrl.trim();

  // 2. Parse URL and check for valid HTTP / HTTPS protocol
  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      isValid: false,
      errorType: ERROR_TYPES.INVALID_URL,
      errorMessage: ERROR_MESSAGES[ERROR_TYPES.INVALID_URL],
      sanitizedUrl: '',
    };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      isValid: false,
      errorType: ERROR_TYPES.INVALID_URL,
      errorMessage: ERROR_MESSAGES[ERROR_TYPES.INVALID_URL],
      sanitizedUrl: '',
    };
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');

  // 3. Check if domain is in supported list or is a direct media stream
  const isSupportedDomain = SUPPORTED_DOMAINS.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
  );

  const isDirectMediaFile = /\.(mp4|m4v|webm|mkv|mov|avi|flv|mp3|m4a|aac|wav|ogg|m3u8|mpd)(\?.*)?$/i.test(
    parsed.pathname
  );

  if (!isSupportedDomain && !isDirectMediaFile) {
    return {
      isValid: false,
      errorType: ERROR_TYPES.UNSUPPORTED_URL,
      errorMessage: ERROR_MESSAGES[ERROR_TYPES.UNSUPPORTED_URL],
      sanitizedUrl: trimmed,
    };
  }

  return {
    isValid: true,
    errorType: null,
    errorMessage: null,
    sanitizedUrl: trimmed,
    hostname,
  };
};
