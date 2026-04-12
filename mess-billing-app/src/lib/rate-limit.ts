/**
 * In-memory sliding-window rate limiter.
 * No external dependencies — works for single-instance deployments.
 * Entries are auto-pruned to prevent unbounded memory growth.
 */

interface RateLimitEntry {
  timestamps: number[];
}

interface RateLimiterOptions {
  /** Maximum number of requests allowed within the window. */
  maxRequests: number;
  /** Window size in milliseconds. */
  windowMs: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private maxRequests: number;
  private windowMs: number;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(options: RateLimiterOptions) {
    this.maxRequests = options.maxRequests;
    this.windowMs = options.windowMs;

    // Prune expired entries every 5 minutes to prevent memory leaks
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    // Allow Node to exit even if the interval is still running
    if (this.cleanupInterval?.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Check whether a request identified by `key` should be allowed.
   * Returns `{ allowed: true }` or `{ allowed: false, retryAfterMs }`.
   */
  check(key: string): { allowed: true } | { allowed: false; retryAfterMs: number } {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry) {
      this.store.set(key, { timestamps: [now] });
      return { allowed: true };
    }

    // Remove timestamps outside the current window
    entry.timestamps = entry.timestamps.filter((t) => now - t < this.windowMs);

    if (entry.timestamps.length < this.maxRequests) {
      entry.timestamps.push(now);
      return { allowed: true };
    }

    // Rate limited — calculate when the oldest request expires
    const oldestInWindow = entry.timestamps[0];
    const retryAfterMs = this.windowMs - (now - oldestInWindow);
    return { allowed: false, retryAfterMs };
  }

  /** Remove all entries with no timestamps in the current window. */
  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      entry.timestamps = entry.timestamps.filter((t) => now - t < this.windowMs);
      if (entry.timestamps.length === 0) {
        this.store.delete(key);
      }
    }
  }
}

// ─── Pre-configured limiters ───────────────────────────────────────

/** Login: 5 attempts per IP per 15 minutes */
export const loginLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 15 * 60 * 1000,
});

/** Forgot password: 3 attempts per entry number per hour */
export const forgotPasswordLimiter = new RateLimiter({
  maxRequests: 3,
  windowMs: 60 * 60 * 1000,
});

/** File uploads: 10 requests per session per minute */
export const uploadLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000,
});

// ─── Helper: extract client IP from request headers ────────────────

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}
