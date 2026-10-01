/**
 * Life Tube - Download History Storage & Management Service
 * Manages completed download records in local storage with reactive event broadcasting.
 */

const STORAGE_KEY = 'lifetube_history_v1';
const HISTORY_UPDATE_EVENT = 'lifetube:history-updated';

/**
 * Format timestamp into human friendly display
 */
export const formatHistoryDate = (timestamp) => {
  if (!timestamp) return 'Just now';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Recently';

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) {
    return `Today, ${timeString}`;
  }
  if (isYesterday) {
    return `Yesterday, ${timeString}`;
  }

  const dateString = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  return `${dateString} • ${timeString}`;
};

/**
 * Retrieve full download history
 * @returns {Array<Object>} List of history items sorted newest first
 */
export const getDownloadHistory = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Sanitize and ensure valid objects
    return parsed.filter((item) => item && typeof item === 'object' && item.id);
  } catch (err) {
    console.warn('[HistoryService] Error reading history from storage:', err);
    return [];
  }
};

/**
 * Add a completed download to history
 * @param {Object} item - Completed download metadata
 */
export const addDownloadHistoryItem = ({
  title,
  thumbnail,
  platform,
  type = 'video',
  format = 'mp4',
  quality = '1080p',
  duration,
  fileSize,
  url,
  filename,
}) => {
  try {
    const currentHistory = getDownloadHistory();

    const timestamp = Date.now();
    const newItem = {
      id: `hist_${timestamp}_${Math.random().toString(36).substring(2, 7)}`,
      title: title || filename || 'Online Media Download',
      thumbnail: thumbnail || null,
      platform: platform || 'Online Media',
      type: type === 'audio' ? 'audio' : 'video',
      format: (format || (type === 'audio' ? 'mp3' : 'mp4')).toLowerCase(),
      quality: quality || (type === 'audio' ? '320k' : '1080p'),
      duration: duration || null,
      fileSize: fileSize || null,
      filename: filename || null,
      url: url || '',
      downloadedAt: timestamp,
      formattedDate: formatHistoryDate(timestamp),
      status: 'completed',
    };

    // Prepend new item (limit history to 100 most recent items)
    const updatedHistory = [newItem, ...currentHistory.slice(0, 99)];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));

    // Dispatch global event for reactive UI updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(HISTORY_UPDATE_EVENT, { detail: newItem }));
    }

    return newItem;
  } catch (err) {
    console.warn('[HistoryService] Error adding history record:', err);
    return null;
  }
};

/**
 * Remove a specific item from history
 * @param {string} id - History record ID
 */
export const removeDownloadHistoryItem = (id) => {
  try {
    if (!id) return false;
    const currentHistory = getDownloadHistory();
    const updatedHistory = currentHistory.filter((item) => item.id !== id);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(HISTORY_UPDATE_EVENT, { detail: { removedId: id } }));
    }
    return true;
  } catch (err) {
    console.warn('[HistoryService] Error removing history item:', err);
    return false;
  }
};

/**
 * Clear all history records
 */
export const clearAllDownloadHistory = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(HISTORY_UPDATE_EVENT, { detail: { cleared: true } }));
    }
    return true;
  } catch (err) {
    console.warn('[HistoryService] Error clearing history:', err);
    return false;
  }
};

/**
 * Get summary stats from history
 */
export const getHistoryStats = () => {
  const history = getDownloadHistory();
  const videoCount = history.filter((item) => item.type === 'video').length;
  const audioCount = history.filter((item) => item.type === 'audio').length;

  return {
    total: history.length,
    videoCount,
    audioCount,
  };
};

/**
 * Hook subscriber helper for React components
 */
export const subscribeToHistoryUpdates = (callback) => {
  if (typeof window === 'undefined') return () => {};

  const handler = () => {
    callback(getDownloadHistory());
  };

  window.addEventListener(HISTORY_UPDATE_EVENT, handler);
  window.addEventListener('storage', handler);

  return () => {
    window.removeEventListener(HISTORY_UPDATE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
};
