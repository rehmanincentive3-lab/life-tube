import React, { useState, useRef, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import DownloaderCard from './components/DownloaderCard';
import DownloadHistory from './components/DownloadHistory';
import Features from './components/Features';
import About from './components/About';
import Footer from './components/Footer';
import Toast from './components/Toast';
import { analyzeMediaUrl } from './services/analysisService';
import { startRealtimeDownloadJob, JOB_STATUS } from './services/downloadService';
import {
  getDownloadHistory,
  addDownloadHistoryItem,
  removeDownloadHistoryItem,
  clearAllDownloadHistory,
  subscribeToHistoryUpdates,
} from './services/historyService';
import { MEDIA_MODES, UI_STATES } from './types/mediaTypes';
import './App.css';

function App() {
  // Navigation & section active tracking
  const [activeSection, setActiveSection] = useState('home');

  // URL Input State
  const [urlInput, setUrlInput] = useState('');
  const [uiState, setUiState] = useState(UI_STATES.EMPTY);
  const [mediaData, setMediaData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Selected format and quality state
  const [mediaMode, setMediaMode] = useState(MEDIA_MODES.VIDEO);
  const [selectedFormat, setSelectedFormat] = useState('mp4');
  const [selectedQuality, setSelectedQuality] = useState('1080p');

  // Real-time Download Job State
  const [activeJob, setActiveJob] = useState(null);
  const activeJobHandleRef = useRef(null);
  const savedJobsHistoryRef = useRef(new Set());

  // Download History State
  const [history, setHistory] = useState(() => getDownloadHistory());

  // Real-time toast feedback
  const [toastMessage, setToastMessage] = useState(null);
  const [toastTimeout, setToastTimeout] = useState(null);

  // Subscribe to reactive history updates
  useEffect(() => {
    const unsubscribe = subscribeToHistoryUpdates((updatedHistory) => {
      setHistory(updatedHistory);
    });
    return unsubscribe;
  }, []);

  const showToast = (msg) => {
    if (toastTimeout) clearTimeout(toastTimeout);
    setToastMessage(msg);
    const id = setTimeout(() => {
      setToastMessage(null);
    }, 3500);
    setToastTimeout(id);
  };

  // Scroll / Navigate to section smoothly
  const handleNavigate = (sectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Analyze media URL handler
  const handleAnalyze = async () => {
    if (uiState === UI_STATES.LOADING) return;

    if (!urlInput || !urlInput.trim()) {
      showToast('Please paste a video URL.');
      return;
    }

    setUiState(UI_STATES.LOADING);
    setErrorMessage('');
    setActiveJob(null);
    showToast('Analyzing media streams...');

    try {
      const data = await analyzeMediaUrl(urlInput);
      setMediaData(data);
      setUiState(UI_STATES.SUCCESS);

      // Auto-set optimal initial format and quality based on current mode
      if (mediaMode === MEDIA_MODES.VIDEO) {
        if (data.videoFormats && data.videoFormats.length > 0) {
          setSelectedQuality(data.videoFormats[0].id);
        }
        setSelectedFormat('mp4');
      } else {
        if (data.audioFormats && data.audioFormats.length > 0) {
          setSelectedQuality(data.audioFormats[0].id);
        }
        setSelectedFormat('mp3');
      }

      showToast('Media analyzed successfully!');
      
      // Smoothly scroll down to the downloader card result
      const downloaderElem = document.getElementById('downloader');
      if (downloaderElem) {
        downloaderElem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Unable to analyze this video right now. Please try again.');
      setUiState(UI_STATES.ERROR);
      showToast(err.message || 'Analysis error occurred.');
    }
  };

  // Real-time Download Job Dispatcher (Video / Audio)
  const handleStartDownload = async () => {
    if (!mediaData) {
      showToast('Please analyze a video first.');
      return;
    }

    const videoUrl = mediaData.webpageUrl || urlInput;
    const isVideo = mediaMode === MEDIA_MODES.VIDEO;

    showToast(`Starting ${isVideo ? 'video' : 'audio'} download: ${selectedFormat.toUpperCase()} (${selectedQuality})...`);

    // Initialize job in state
    setActiveJob({
      id: `init_${Date.now()}`,
      type: mediaMode,
      url: videoUrl,
      title: mediaData.title || 'LifeTube Media',
      format: selectedFormat,
      quality: selectedQuality,
      status: JOB_STATUS.PREPARING,
      statusMessage: `Connecting to download engine for ${selectedFormat.toUpperCase()}...`,
      progress: 0,
      downloadedText: '0 MB',
      totalText: 'Calculating...',
      speed: 'Calculating...',
      eta: 'Calculating remaining time...',
      filename: null,
      error: null,
    });

    try {
      const jobHandle = await startRealtimeDownloadJob({
        type: mediaMode,
        url: videoUrl,
        format: selectedFormat,
        quality: selectedQuality,
        title: mediaData.title || 'LifeTube Media',
        onProgressUpdate: (jobUpdate) => {
          setActiveJob(jobUpdate);

          if (jobUpdate.status === JOB_STATUS.READY) {
            if (!savedJobsHistoryRef.current.has(jobUpdate.id)) {
              savedJobsHistoryRef.current.add(jobUpdate.id);
              addDownloadHistoryItem({
                title: mediaData?.title || jobUpdate.title || 'LifeTube Media',
                thumbnail: mediaData?.thumbnail || null,
                platform: mediaData?.platform || 'Online Media',
                type: mediaMode,
                format: selectedFormat,
                quality: selectedQuality,
                duration: mediaData?.durationFormatted || mediaData?.duration || null,
                fileSize: jobUpdate.totalText || (mediaData ? (mediaMode === MEDIA_MODES.VIDEO ? mediaData.estimatedSize : mediaData.audioSize) : null),
                url: videoUrl,
                filename: jobUpdate.filename,
              });
            }
            showToast('Download complete! File saved.');
          } else if (jobUpdate.status === JOB_STATUS.PROCESSING) {
            showToast(isVideo ? 'Merging video & audio streams with FFmpeg...' : 'Encoding audio with FFmpeg...');
          }
        },
      });

      activeJobHandleRef.current = jobHandle;
    } catch (err) {
      setActiveJob((prev) => ({
        ...(prev || {}),
        status: JOB_STATUS.FAILED,
        error: err.message || 'Failed to initiate download job.',
        statusMessage: err.message || 'Download failed. Please try another quality.',
      }));
      showToast(err.message || 'Download failed. Please try another quality.');
    }
  };

  // Cancel Download Handler
  const handleCancelJob = async () => {
    if (activeJobHandleRef.current && activeJobHandleRef.current.cancel) {
      try {
        await activeJobHandleRef.current.cancel();
      } catch (err) {
        console.warn('[Cancel error]:', err);
      }
    }

    setActiveJob((prev) => (prev ? {
      ...prev,
      status: JOB_STATUS.CANCELLED,
      statusMessage: 'Download cancelled by user.',
      error: 'Download cancelled.',
    } : null));

    showToast('Download cancelled.');
  };

  // Retry Download Handler
  const handleRetryJob = () => {
    handleStartDownload();
  };

  // Dismiss / Change options handler
  const handleDismissProgress = () => {
    setActiveJob(null);
    activeJobHandleRef.current = null;
  };

  // Download Again Handler from History
  const handleDownloadAgain = async (item) => {
    if (!item) return;
    const mode = item.type === 'audio' ? MEDIA_MODES.AUDIO : MEDIA_MODES.VIDEO;
    const isVideo = mode === MEDIA_MODES.VIDEO;

    setMediaMode(mode);
    setSelectedFormat(item.format || (isVideo ? 'mp4' : 'mp3'));
    setSelectedQuality(item.quality || (isVideo ? '1080p' : '320k'));

    if (item.url) {
      setUrlInput(item.url);
      handleNavigate('downloader');
      showToast(`Initiating re-download: ${item.title}...`);

      // If current mediaData is for this exact URL, we can start downloading immediately
      if (mediaData && (mediaData.webpageUrl === item.url || urlInput === item.url)) {
        setTimeout(() => {
          handleStartDownload();
        }, 150);
      } else {
        // Auto-analyze and initiate download job
        setUiState(UI_STATES.LOADING);
        setErrorMessage('');
        setActiveJob(null);

        try {
          const data = await analyzeMediaUrl(item.url);
          setMediaData(data);
          setUiState(UI_STATES.SUCCESS);

          const targetUrl = data.webpageUrl || item.url;
          const targetFormat = item.format || (isVideo ? 'mp4' : 'mp3');
          const targetQuality = item.quality || (isVideo ? '1080p' : '320k');

          setActiveJob({
            id: `init_${Date.now()}`,
            type: mode,
            url: targetUrl,
            title: data.title || item.title || 'LifeTube Media',
            format: targetFormat,
            quality: targetQuality,
            status: JOB_STATUS.PREPARING,
            statusMessage: `Connecting to download engine for ${targetFormat.toUpperCase()}...`,
            progress: 0,
            downloadedText: '0 MB',
            totalText: 'Calculating...',
            speed: 'Calculating...',
            eta: 'Calculating remaining time...',
            filename: null,
            error: null,
          });

          const jobHandle = await startRealtimeDownloadJob({
            type: mode,
            url: targetUrl,
            format: targetFormat,
            quality: targetQuality,
            title: data.title || item.title || 'LifeTube Media',
            onProgressUpdate: (jobUpdate) => {
              setActiveJob(jobUpdate);
              if (jobUpdate.status === JOB_STATUS.READY) {
                if (!savedJobsHistoryRef.current.has(jobUpdate.id)) {
                  savedJobsHistoryRef.current.add(jobUpdate.id);
                  addDownloadHistoryItem({
                    title: data.title || item.title,
                    thumbnail: data.thumbnail || item.thumbnail || null,
                    platform: data.platform || item.platform || 'Online Media',
                    type: mode,
                    format: targetFormat,
                    quality: targetQuality,
                    duration: data.durationFormatted || item.duration || null,
                    fileSize: jobUpdate.totalText || null,
                    url: targetUrl,
                    filename: jobUpdate.filename,
                  });
                }
                showToast('Download complete! File saved.');
              } else if (jobUpdate.status === JOB_STATUS.PROCESSING) {
                showToast(isVideo ? 'Merging video & audio streams with FFmpeg...' : 'Encoding audio with FFmpeg...');
              }
            },
          });

          activeJobHandleRef.current = jobHandle;
        } catch (err) {
          console.error('[Download Again Error]:', err);
          setErrorMessage(err.message || 'Unable to re-download this media. Please check the URL.');
          setUiState(UI_STATES.ERROR);
          showToast(err.message || 'Analysis error occurred.');
        }
      }
    } else {
      handleNavigate('downloader');
      showToast('Media URL not found in history record.');
    }
  };

  // Remove single history item
  const handleRemoveHistoryItem = (id) => {
    removeDownloadHistoryItem(id);
    showToast('Removed item from download history.');
  };

  // Clear all history records
  const handleClearAllHistory = () => {
    clearAllDownloadHistory();
    showToast('Cleared all download history.');
  };

  // Retry action
  const handleRetry = () => {
    handleAnalyze();
  };

  // Edit URL action (focuses the hero input)
  const handleEditUrl = () => {
    const heroInput = document.querySelector('.unified-text-input');
    if (heroInput) {
      heroInput.focus();
      heroInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Reset to initial empty state
  const handleReset = () => {
    if (activeJobHandleRef.current?.cancel) {
      activeJobHandleRef.current.cancel().catch(() => {});
    }
    setUrlInput('');
    setMediaData(null);
    setErrorMessage('');
    setUiState(UI_STATES.EMPTY);
    setActiveJob(null);
    activeJobHandleRef.current = null;
    showToast('Reset downloader to empty state.');
  };

  return (
    <div className="life-tube-app">
      {/* Top Navigation Bar */}
      <Navbar
        activeSection={activeSection}
        onNavigate={handleNavigate}
      />

      {/* Main Page Content */}
      <main className="main-content-flow">
        {/* 1. Hero Section with Unified URL Input */}
        <Hero
          urlInput={urlInput}
          setUrlInput={setUrlInput}
          onAnalyze={handleAnalyze}
          isLoading={uiState === UI_STATES.LOADING}
          onShowToast={showToast}
        />

        {/* 2. Central Downloader Card (Empty, Loading, Analyzed, Real-time Progress, Error) */}
        <DownloaderCard
          uiState={uiState}
          mediaData={mediaData}
          mediaMode={mediaMode}
          setMediaMode={setMediaMode}
          selectedFormat={selectedFormat}
          setSelectedFormat={setSelectedFormat}
          selectedQuality={selectedQuality}
          setSelectedQuality={setSelectedQuality}
          errorMessage={errorMessage}
          onRetry={handleRetry}
          onEditUrl={handleEditUrl}
          onReset={handleReset}
          onShowToast={showToast}
          activeJob={activeJob}
          onStartDownload={handleStartDownload}
          onCancelJob={handleCancelJob}
          onRetryJob={handleRetryJob}
          onDismissProgress={handleDismissProgress}
          onResetDownloadState={() => setActiveJob(null)}
        />

        {/* 3. Download History Section */}
        <DownloadHistory
          history={history}
          onDownloadAgain={handleDownloadAgain}
          onRemoveItem={handleRemoveHistoryItem}
          onClearAll={handleClearAllHistory}
          onStartNewDownload={() => handleNavigate('downloader')}
        />

        {/* 4. Features Section (6 Cards) */}
        <Features />

        {/* 5. About Section */}
        <About />
      </main>

      {/* 5. Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
}

export default App;
