/**
 * Life Tube - In-Memory Sliding Window Rate Limiter
 * Protects analysis and download endpoints from rapid automated abuse.
 */

const createRateLimiter = ({ windowMs = 60 * 1000, maxRequests = 30, message = 'Too many requests. Please wait a moment and try again.' }) => {
  const ipHits = new Map();

  // Periodic cleanup of stale IP hit trackers (every 2 minutes)
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipHits.entries()) {
      if (now - record.resetTime > windowMs) {
        ipHits.delete(ip);
      }
    }
  }, 2 * 60 * 1000);

  return (req, res, next) => {
    // Determine client IP safely
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : (req.ip || req.socket?.remoteAddress || 'unknown-ip');
    const now = Date.now();

    let record = ipHits.get(clientIp);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      ipHits.set(clientIp, record);
    } else {
      record.count += 1;
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > maxRequests) {
      res.setHeader('Retry-After', Math.ceil((record.resetTime - now) / 1000));
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message,
        },
      });
    }

    next();
  };
};

export const analyzeRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
  message: 'Too many URL analysis requests. Please wait a moment and try again.',
});

export const downloadRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 20,
  message: 'Too many download requests. Please wait a moment and try again.',
});
