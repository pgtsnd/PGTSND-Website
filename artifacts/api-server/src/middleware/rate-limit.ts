import crypto from "crypto";

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const stores = new Map<string, Map<string, Bucket>>();

function getStore(namespace: string): Map<string, Bucket> {
  let store = stores.get(namespace);
  if (!store) {
    store = new Map();
    stores.set(namespace, store);
  }
  return store;
}

function pruneIfLarge(store: Map<string, Bucket>, now: number): void {
  if (store.size < 1024) return;
  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) store.delete(key);
  }
}

export function checkRateLimit(
  namespace: string,
  key: string,
  options: RateLimitOptions,
  now: number = Date.now(),
): { allowed: boolean; remaining: number; resetAt: number } {
  const store = getStore(namespace);
  pruneIfLarge(store, now);
  const existing = store.get(key);
  if (!existing || existing.resetAt <= now) {
    const bucket: Bucket = { count: 1, resetAt: now + options.windowMs };
    store.set(key, bucket);
    return {
      allowed: true,
      remaining: Math.max(0, options.limit - 1),
      resetAt: bucket.resetAt,
    };
  }
  if (existing.count >= options.limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }
  existing.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, options.limit - existing.count),
    resetAt: existing.resetAt,
  };
}

export function resetRateLimitNamespace(namespace: string): void {
  stores.delete(namespace);
}

// Hash a key (e.g. an email address) before using it as the in-memory map key
// so that PII isn't held in process memory in plaintext for the duration of
// the throttle window. The hash is namespaced so the same email in different
// limiters produces different keys.
export function hashRateLimitKey(namespace: string, value: string): string {
  return crypto
    .createHash("sha256")
    .update(`${namespace}:${value}`)
    .digest("hex");
}

// Tunable limits for the unsubscribe-link resend endpoint. Chosen so a real
// recipient retrying once or twice always succeeds, but an attacker can't
// pound the endpoint to spam an inbox or burn through Resend quota.
export const UNSUBSCRIBE_RESEND_LIMITS = {
  perEmail: { limit: 3, windowMs: 60 * 60 * 1000 },
  perIp: { limit: 10, windowMs: 60 * 60 * 1000 },
} as const;
