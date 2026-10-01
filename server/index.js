import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { CONFIG } from './config.js';
import apiRoutes from './routes/apiRoutes.js';
import { startPeriodicCleanup } from './services/tempManager.js';
import { startStaleJobCleanup } from './services/jobManager.js';

const app = express();

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Middleware
app.use(cors({
  origin: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'Life Tube Media Engine',
    ytdlpConfigured: fs.existsSync(CONFIG.YTDLP_PATH) || CONFIG.YTDLP_PATH === 'yt-dlp.exe' || CONFIG.YTDLP_PATH === 'yt-dlp',
    ffmpegConfigured: fs.existsSync(CONFIG.FFMPEG_PATH) || CONFIG.FFMPEG_PATH === 'ffmpeg',
    vaultReady: fs.existsSync(CONFIG.TEMP_DIR),
    timestamp: new Date().toISOString(),
  });
});

// Mount main API routes
app.use('/api', apiRoutes);

// Global error handler (Sanitizes stack traces from leaking to client)
app.use((err, req, res, _next) => {
  console.error('[Global Server Error]:', err.message);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An internal media processing error occurred. Please try again.',
    }
  });
});

// Start background temporary vault cleanup and stale jobs GC
startPeriodicCleanup();
startStaleJobCleanup();

// Start Express server
const PORT = CONFIG.PORT || 3001;
app.listen(PORT, () => {
  console.log(`[Life Tube Engine] Server running on http://localhost:${PORT}`);
  console.log(`[Life Tube Engine] yt-dlp binary: ${CONFIG.YTDLP_PATH}`);
  console.log(`[Life Tube Engine] FFmpeg binary: ${CONFIG.FFMPEG_PATH}`);
  console.log(`[Life Tube Engine] Temp Vault: ${CONFIG.TEMP_DIR}`);
});
