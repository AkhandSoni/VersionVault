type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/**
 * Small process-local guard for abuse bursts. Production deployments should
 * replace this with the configured Redis-backed limiter for cross-instance
 * enforcement.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number, now = Date.now()): {
  allowed: boolean;
  retryAfterSeconds: number;
} {
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: Math.ceil(windowMs / 1000) };
  }

  current.count += 1;
  return {
    allowed: current.count <= limit,
    retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
}
