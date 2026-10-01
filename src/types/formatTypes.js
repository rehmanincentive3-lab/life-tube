/**
 * Life Tube - Format & Quality Types Definition
 * Prepared architecture for future yt-dlp backend integration
 */

export const MEDIA_MODES = {
  VIDEO: 'VIDEO',
  AUDIO: 'AUDIO',
};

export const UI_STATES = {
  EMPTY: 'EMPTY',
  LOADING: 'LOADING',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
};

export const VIDEO_FORMATS = [
  { id: 'mp4', name: 'MP4', description: 'Universal container, maximum compatibility' },
  { id: 'webm', name: 'WebM', description: 'Open web media format, VP9/AV1 codec' },
];

export const AUDIO_FORMATS = [
  { id: 'mp3', name: 'MP3', description: 'MPEG Layer-3 universal audio' },
  { id: 'm4a', name: 'M4A', description: 'AAC audio codec, optimized for Apple & modern players' },
];

export const VIDEO_QUALITIES = [
  { id: '144p', label: '144p', resolution: '256x144', badge: 'Fast', badgeType: 'dim', estimatedSize: '~32 MB' },
  { id: '240p', label: '240p', resolution: '426x240', badge: 'Fast', badgeType: 'dim', estimatedSize: '~58 MB' },
  { id: '360p', label: '360p', resolution: '640x360', badge: 'SD', badgeType: 'dim', estimatedSize: '~112 MB' },
  { id: '480p', label: '480p', resolution: '854x480', badge: 'SD', badgeType: 'dim', estimatedSize: '~220 MB' },
  { id: '720p', label: '720p HD', resolution: '1280x720', badge: 'Popular', badgeType: 'neutral', estimatedSize: '~450 MB' },
  { id: '1080p', label: '1080p Full HD', resolution: '1920x1080', badge: 'Recommended', badgeType: 'green', estimatedSize: '~890 MB' },
  { id: '1440p', label: '1440p 2K', resolution: '2560x1440', badge: '2K Studio', badgeType: 'neutral', estimatedSize: '~1.15 GB' },
  { id: '2160p', label: '2160p 4K', resolution: '3840x2160', badge: '4K UHD', badgeType: 'coral', estimatedSize: '~1.42 GB' },
];

export const AUDIO_QUALITIES = [
  { id: '64k', label: '64 kbps', subtitle: 'Low Bandwidth / Voice', badge: 'Voice', badgeType: 'dim', estimatedSize: '~6.8 MB' },
  { id: '128k', label: '128 kbps', subtitle: 'Standard Quality', badge: 'Standard', badgeType: 'dim', estimatedSize: '~13.6 MB' },
  { id: '192k', label: '192 kbps', subtitle: 'High Fidelity', badge: 'High', badgeType: 'neutral', estimatedSize: '~20.4 MB' },
  { id: '256k', label: '256 kbps', subtitle: 'Studio Dynamic Range', badge: 'HQ', badgeType: 'neutral', estimatedSize: '~27.2 MB' },
  { id: '320k', label: '320 kbps', subtitle: 'Maximum Bitrate Master', badge: 'Master', badgeType: 'green', estimatedSize: '~34.0 MB' },
];
