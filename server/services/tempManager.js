import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { CONFIG } from '../config.js';

export const createJobVault = () => {
  const jobId = `job_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const jobPath = path.join(CONFIG.TEMP_DIR, jobId);

  if (!fs.existsSync(jobPath)) {
    fs.mkdirSync(jobPath, { recursive: true });
  }

  return {
    jobId,
    jobPath,
  };
};

export const cleanupJobVault = (jobPath) => {
  if (!jobPath || !jobPath.startsWith(CONFIG.TEMP_DIR)) {
    return; // Prevent path traversal
  }

  try {
    if (fs.existsSync(jobPath)) {
      fs.rmSync(jobPath, { recursive: true, force: true });
    }
  } catch (err) {
    console.error(`[Vault Cleanup Error] Failed to delete ${jobPath}:`, err.message);
  }
};

// Periodic garbage collection for any stale temp directories (>15 min old)
export const startPeriodicCleanup = () => {
  setInterval(() => {
    try {
      if (!fs.existsSync(CONFIG.TEMP_DIR)) return;
      const entries = fs.readdirSync(CONFIG.TEMP_DIR);
      const now = Date.now();

      for (const entry of entries) {
        const fullPath = path.join(CONFIG.TEMP_DIR, entry);
        const stats = fs.statSync(fullPath);
        const ageMs = now - stats.mtimeMs;

        if (ageMs > 15 * 60 * 1000) {
          fs.rmSync(fullPath, { recursive: true, force: true });
          console.log(`[Vault GC] Cleaned up stale directory: ${entry}`);
        }
      }
    } catch (err) {
      console.error('[Vault GC Error]:', err.message);
    }
  }, 10 * 60 * 1000);
};
