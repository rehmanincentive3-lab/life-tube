import path from 'path';
import fs from 'fs';
import os from 'os';

// Search candidate locations for yt-dlp binary
const getBinaryPath = () => {
  if (process.platform === 'win32') {
    const localWingetPath = path.join(
      os.homedir(),
      'AppData/Local/Microsoft/WinGet/Packages/yt-dlp.yt-dlp_Microsoft.Winget.Source_8wekyb3d8bbwe',
      'yt-dlp.exe'
    );
    if (fs.existsSync(localWingetPath)) {
      return localWingetPath;
    }
    const projectBinPath = path.join(process.cwd(), 'bin', 'yt-dlp.exe');
    if (fs.existsSync(projectBinPath)) {
      return projectBinPath;
    }
    return 'yt-dlp.exe';
  }

  // Linux / macOS / Railway container
  if (fs.existsSync('/usr/local/bin/yt-dlp')) return '/usr/local/bin/yt-dlp';
  if (fs.existsSync('/usr/bin/yt-dlp')) return '/usr/bin/yt-dlp';
  return 'yt-dlp';
};

const getFFmpegPath = () => {
  if (process.platform === 'win32') {
    const gyanFFmpegPath = path.join(
      os.homedir(),
      'AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0-full_build/bin'
    );
    if (fs.existsSync(gyanFFmpegPath)) {
      return gyanFFmpegPath;
    }
    const ytdlpFFmpegPath = path.join(
      os.homedir(),
      'AppData/Local/Microsoft/WinGet/Packages/yt-dlp.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg.exe'
    );
    if (fs.existsSync(ytdlpFFmpegPath)) {
      return ytdlpFFmpegPath;
    }
    return 'ffmpeg';
  }

  // Linux / macOS
  return 'ffmpeg';
};

const getDenoPath = () => {
  if (process.platform === 'win32') {
    const localWingetPath = path.join(
      os.homedir(),
      'AppData/Local/Microsoft/WinGet/Packages/DenoLand.Deno_Microsoft.Winget.Source_8wekyb3d8bbwe/deno.exe'
    );
    if (fs.existsSync(localWingetPath)) {
      return localWingetPath;
    }
    return 'deno';
  }

  if (fs.existsSync('/usr/local/bin/deno')) return '/usr/local/bin/deno';
  if (fs.existsSync('/usr/bin/deno')) return '/usr/bin/deno';
  return '';
};

export const CONFIG = {
  PORT: process.env.PORT || 3001,
  YTDLP_PATH: getBinaryPath(),
  FFMPEG_PATH: getFFmpegPath(),
  DENO_PATH: getDenoPath(),
  TEMP_DIR: path.join(process.cwd(), 'temp_media_vault'),
  MAX_CONCURRENT_DOWNLOADS: 6,
  DOWNLOAD_TIMEOUT_MS: 5 * 60 * 1000, // 5 minutes max download time
  MAX_FILE_SIZE_BYTES: 2 * 1024 * 1024 * 1024, // 2 GB limit per stream
};

// Ensure temp media vault directory exists
if (!fs.existsSync(CONFIG.TEMP_DIR)) {
  fs.mkdirSync(CONFIG.TEMP_DIR, { recursive: true });
}
