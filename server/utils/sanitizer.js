/**
 * Life Tube - Server Sanitization & Security Validation
 * Protects against SSRF, Path Traversal, and Header/Command Injections.
 */

// Private & Internal Network Patterns for SSRF Protection
const DISALLOWED_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^0\.0\.0\.0$/,
  /^::1$/,
  /^::$/,
  /^169\.254\.\d{1,3}\.\d{1,3}$/, // Cloud instance metadata
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/, // RFC1918 Class A
  /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/, // RFC1918 Class B
  /^192\.168\.\d{1,3}\.\d{1,3}$/, // RFC1918 Class C
  /^fc00:/i,
  /^fe80:/i,
  /\.local$/i,
  /\.internal$/i,
  /\.lan$/i,
  /\.onion$/i,
];

/**
 * Validate URL for safe media fetching
 */
export const validateSafeUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return { isValid: false, error: 'Please provide a valid video URL.', errorCode: 'INVALID_URL' };
  }

  const cleanUrl = rawUrl.trim();

  // Basic length limit to prevent buffer abuse
  if (cleanUrl.length > 2048) {
    return { isValid: false, error: 'URL is too long.', errorCode: 'URL_TOO_LONG' };
  }

  try {
    const parsed = new URL(cleanUrl);

    // Protocol check
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        isValid: false,
        error: 'Invalid URL protocol. Only HTTP and HTTPS are allowed.',
        errorCode: 'INVALID_PROTOCOL',
      };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Check against disallowed internal / private hostnames
    if (DISALLOWED_HOST_PATTERNS.some((pattern) => pattern.test(hostname))) {
      return {
        isValid: false,
        error: 'Access to internal or local network addresses is not permitted.',
        errorCode: 'SSRF_BLOCKED',
      };
    }

    // Must have a valid domain format
    if (!hostname.includes('.') && hostname !== 'localhost') {
      return {
        isValid: false,
        error: 'Invalid domain name in URL.',
        errorCode: 'INVALID_DOMAIN',
      };
    }

    return {
      isValid: true,
      cleanUrl: parsed.href,
    };
  } catch {
    return { isValid: false, error: 'Invalid URL format.', errorCode: 'INVALID_URL_FORMAT' };
  }
};

/**
 * Sanitize output filename to prevent path traversal and shell execution risks
 */
export const sanitizeFilename = (rawName, extension = 'mp4') => {
  const safeExt = String(extension || 'mp4').toLowerCase().replace(/[^a-z0-9]/g, '');

  if (!rawName || typeof rawName !== 'string') {
    return `Life_Tube_Download_${Date.now()}.${safeExt}`;
  }

  // Remove control characters, path delimiters, and illegal filesystem characters
  // eslint-disable-next-line no-control-regex
  const clean = rawName
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1F\x7F]/g, ' ')
    .replace(/[<>:"/\\|?*#%&{}$!`+~`]/g, ' ')
    .replace(/\.{2,}/g, '') // remove path traversal sequences
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 120);

  const safeBase = clean.length > 0 ? clean : `Life_Tube_${Date.now()}`;
  return `${safeBase}.${safeExt}`;
};

/**
 * Validate Video Download Request
 */
export const validateDownloadRequest = (body) => {
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: 'Malformed request payload.', errorCode: 'INVALID_PAYLOAD' };
  }

  const { url, format, quality } = body;

  const urlValidation = validateSafeUrl(url);
  if (!urlValidation.isValid) {
    return urlValidation;
  }

  // Validate Format
  const allowedFormats = ['mp4', 'webm'];
  const cleanFormat = (format || 'mp4').toLowerCase().trim();
  if (!allowedFormats.includes(cleanFormat)) {
    return {
      isValid: false,
      error: 'Unsupported format. Supported video formats are MP4 and WebM.',
      errorCode: 'UNSUPPORTED_FORMAT',
    };
  }

  // Validate Quality
  const allowedQualities = ['144p', '240p', '360p', '480p', '720p', '1080p', '1440p', '2160p'];
  const cleanQuality = (quality || '1080p').toLowerCase().trim();
  if (!allowedQualities.includes(cleanQuality)) {
    return {
      isValid: false,
      error: 'Unsupported quality resolution.',
      errorCode: 'UNSUPPORTED_QUALITY',
    };
  }

  return {
    isValid: true,
    cleanUrl: urlValidation.cleanUrl,
    cleanFormat,
    cleanQuality,
  };
};

/**
 * Validate Audio Download Request
 */
export const validateAudioDownloadRequest = (body) => {
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: 'Malformed request payload.', errorCode: 'INVALID_PAYLOAD' };
  }

  const { url, format, quality } = body;

  const urlValidation = validateSafeUrl(url);
  if (!urlValidation.isValid) {
    return urlValidation;
  }

  // Validate Audio Format
  const allowedAudioFormats = ['mp3', 'm4a'];
  const cleanFormat = (format || 'mp3').toLowerCase().trim();
  if (!allowedAudioFormats.includes(cleanFormat)) {
    return {
      isValid: false,
      error: 'Unsupported audio format. Supported audio formats are MP3 and M4A.',
      errorCode: 'UNSUPPORTED_AUDIO_FORMAT',
    };
  }

  // Validate Audio Bitrate Quality
  const rawQuality = String(quality || '320k').toLowerCase().trim();
  const numericQuality = rawQuality.replace(/[^0-9]/g, '');
  const allowedBitrates = ['64', '128', '192', '256', '320'];

  if (!allowedBitrates.includes(numericQuality)) {
    return {
      isValid: false,
      error: 'Unsupported audio bitrate. Supported bitrates are 64, 128, 192, 256, and 320 kbps.',
      errorCode: 'UNSUPPORTED_BITRATE',
    };
  }

  return {
    isValid: true,
    cleanUrl: urlValidation.cleanUrl,
    cleanFormat,
    cleanQuality: `${numericQuality}k`,
    numericBitrate: numericQuality,
  };
};
