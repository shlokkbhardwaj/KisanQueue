/*
 * Tiny in-memory rate limiter (single-process). Good enough for a prototype;
 * put a shared store (Redis) or a gateway rate limit in front for production.
 */
export function createRateLimiter({ windowMs, max }) {
  const hits = new Map(); // key -> { count, resetAt }

  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
  }, Math.min(windowMs, 60_000));
  timer.unref?.();

  return {
    /** Registers an attempt. Returns { limited, retryAfterSeconds }. */
    hit(key) {
      const now = Date.now();
      let entry = hits.get(key);
      if (!entry || entry.resetAt <= now) {
        entry = { count: 0, resetAt: now + windowMs };
        hits.set(key, entry);
      }
      entry.count += 1;
      return {
        limited: entry.count > max,
        retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000))
      };
    },
    reset(key) { hits.delete(key); },
    clear() { hits.clear(); }
  };
}
