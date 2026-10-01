/**
 * Life Tube - Download Engine Client & Real-time Job Manager
 * Supports both Video and Audio extraction with real-time SSE progress updates,
 * cancel, retry, and binary file delivery.
 */

export const JOB_STATUS = {
  QUEUED: 'QUEUED',
  PREPARING: 'PREPARING',
  DOWNLOADING: 'DOWNLOADING',
  PROCESSING: 'PROCESSING',
  FINALIZING: 'FINALIZING',
  READY: 'READY',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED',
};

// Legacy alias support
export const DOWNLOAD_STATUS = JOB_STATUS;

const getApiBase = () => (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

/**
 * Trigger standard browser download for a ready job
 */
export const triggerBrowserDownload = (jobId, filename) => {
  const downloadUrl = `${getApiBase()}/api/download/file/${jobId}`;
  const anchor = document.createElement('a');
  anchor.style.display = 'none';
  anchor.href = downloadUrl;
  if (filename) {
    anchor.download = filename;
  }
  document.body.appendChild(anchor);
  anchor.click();

  setTimeout(() => {
    document.body.removeChild(anchor);
  }, 2000);
};

/**
 * Start a real-time download job (Video or Audio) with SSE progress updates
 * @param {Object} params
 * @param {'video'|'audio'} params.type
 * @param {string} params.url
 * @param {string} params.format
 * @param {string} params.quality
 * @param {string} [params.title]
 * @param {Function} params.onProgressUpdate - Callback called with safe job update
 * @returns {Promise<Object>} Job control handle with { jobId, cancel }
 */
export const startRealtimeDownloadJob = async ({
  type = 'video',
  url,
  format,
  quality,
  title,
  onProgressUpdate = () => {},
}) => {
  if (!url || !url.trim()) {
    throw new Error('Missing media URL for download.');
  }

  const apiBase = getApiBase();

  // 1. Initiate job on backend
  const response = await fetch(`${apiBase}/api/download/job`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type,
      url: url.trim(),
      format,
      quality,
      title,
    }),
  });

  const responseJson = await response.json().catch(() => null);

  if (!response.ok || !responseJson || !responseJson.success) {
    const errorMsg = typeof responseJson?.error === 'string'
      ? responseJson.error
      : responseJson?.error?.message || responseJson?.details || `Failed to start download (${response.status})`;
    throw new Error(errorMsg);
  }

  const { jobId, job: initialJob } = responseJson;
  onProgressUpdate(initialJob);

  // 2. Connect to SSE progress stream
  let eventSource = null;
  try {
    eventSource = new EventSource(`${apiBase}/api/download/progress/${jobId}`);

    eventSource.onmessage = (event) => {
      try {
        const update = JSON.parse(event.data);
        onProgressUpdate(update);

        if (update.status === JOB_STATUS.READY) {
          // File is processed and ready on server - initiate browser download
          triggerBrowserDownload(jobId, update.filename);
          eventSource.close();
        } else if ([JOB_STATUS.COMPLETED, JOB_STATUS.FAILED, JOB_STATUS.CANCELLED].includes(update.status)) {
          eventSource.close();
        }
      } catch (parseErr) {
        console.warn('[SSE Parse Warning]:', parseErr);
      }
    };

    eventSource.onerror = (err) => {
      console.warn('[SSE Connection Closed/Error]:', err);
      eventSource?.close();
    };
  } catch (sseErr) {
    console.warn('[SSE Init Warning]:', sseErr);
  }

  // Return job handle with cancel capability
  return {
    jobId,
    cancel: async () => {
      eventSource?.close();
      return cancelRealtimeDownloadJob(jobId);
    },
  };
};

/**
 * Cancel a running download job
 */
export const cancelRealtimeDownloadJob = async (jobId) => {
  if (!jobId) return;

  try {
    const apiBase = getApiBase();
    const response = await fetch(`${apiBase}/api/download/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jobId }),
    });

    return await response.json();
  } catch (err) {
    console.error('[Cancel Job Error]:', err);
    throw err;
  }
};

/**
 * Legacy wrapper: downloadVideoMedia
 */
export const downloadVideoMedia = async ({
  url,
  format = 'mp4',
  quality = '1080p',
  title = 'LifeTube_Video',
  onStatusChange = () => {},
}) => {
  return startRealtimeDownloadJob({
    type: 'video',
    url,
    format,
    quality,
    title,
    onProgressUpdate: (jobUpdate) => {
      onStatusChange({
        status: jobUpdate.status,
        message: jobUpdate.statusMessage,
        progress: jobUpdate.progress,
        speed: jobUpdate.speed,
        eta: jobUpdate.eta,
        downloadedText: jobUpdate.downloadedText,
        totalText: jobUpdate.totalText,
        filename: jobUpdate.filename,
      });
    },
  });
};

/**
 * Legacy wrapper: downloadAudioMedia
 */
export const downloadAudioMedia = async ({
  url,
  format = 'mp3',
  quality = '320k',
  title = 'LifeTube_Audio',
  onStatusChange = () => {},
}) => {
  return startRealtimeDownloadJob({
    type: 'audio',
    url,
    format,
    quality,
    title,
    onProgressUpdate: (jobUpdate) => {
      onStatusChange({
        status: jobUpdate.status,
        message: jobUpdate.statusMessage,
        progress: jobUpdate.progress,
        speed: jobUpdate.speed,
        eta: jobUpdate.eta,
        downloadedText: jobUpdate.downloadedText,
        totalText: jobUpdate.totalText,
        filename: jobUpdate.filename,
      });
    },
  });
};
