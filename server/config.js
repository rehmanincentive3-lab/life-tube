import path from 'path';
import fs from 'fs';
import os from 'os';

// Search candidate locations for yt-dlp.exe
const getBinaryPath = (binaryName) => {
  const localWingetPath = path.join(
    os.homedir(),
    'AppData/Local/Microsoft/WinGet/Packages/yt-dlp.yt-dlp_Microsoft.Winget.Source_8wekyb3d8bbwe',
    binaryName
  );
  if (fs.existsSync(localWingetPath)) {
    return localWingetPath;
  }

  const projectBinPath = path.join(process.cwd(), 'bin', binaryName);
  if (fs.existsSync(projectBinPath)) {
    return projectBinPath;
  }

  return binaryName; // Fallback to system PATH
};

const getFFmpegPath = () => {
  const gyanFFmpegPath = path.join(
    os.homedir(),
    'AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0-full_build/bin/ffmpeg.exe'
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
};

const getDenoPath = () => {
  const localWingetPath = path.join(
    os.homedir(),
    'AppData/Local/Microsoft/WinGet/Packages/DenoLand.Deno_Microsoft.Winget.Source_8wekyb3d8bbwe/deno.exe'
  );
  if (fs.existsSync(localWingetPath)) {
    return localWingetPath;
  }
  return 'deno';
};

export const CONFIG = {
  PORT: process.env.PORT || 3001,
  YTDLP_PATH: getBinaryPath('yt-dlp.exe'),
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
