import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { serverEnv } from "@/lib/env/server";
import { reportError } from "@/lib/observability/report";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 5000;

/** Per-instance fallback, used in local development and if Upstash is unreachable. */
function memoryLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) {
      for (const [storedKey, stored] of buckets) if (stored.resetAt <= now) buckets.delete(storedKey);
      if (buckets.size >= MAX_BUCKETS) buckets.clear();
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  bucket.count += 1;
  return bucket.count <= limit;
}

const redis =
  serverEnv.UPSTASH_REDIS_REST_URL && serverEnv.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({ url: serverEnv.UPSTASH_REDIS_REST_URL, token: serverEnv.UPSTASH_REDIS_REST_TOKEN })
    : null;

const limiters = new Map<string, Ratelimit>();

function sharedLimiter(limit: number, windowMs: number): Ratelimit | null {
  if (!redis) return null;
  const id = `${limit}:${windowMs}`;
  let limiter = limiters.get(id);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      prefix: "rwy:rl",
      analytics: false,
    });
    limiters.set(id, limiter);
  }
  return limiter;
}

/** Keys must not contain raw PII: pass `hashKey(phone)`, never the phone itself. */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const limiter = sharedLimiter(limit, windowMs);
  // Production must use shared Redis — per-instance memory is trivially bypassed at scale.
  if (!limiter) {
    if (serverEnv.VERCEL_ENV === "production") return false;
    return memoryLimit(key, limit, windowMs);
  }
  try {
    const { success } = await limiter.limit(key);
    return success;
  } catch (error) {
    reportError("rate-limit", error);
    if (serverEnv.VERCEL_ENV === "production") return false;
    return memoryLimit(key, limit, windowMs);
  }
}

export async function hashKey(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value.trim().toLowerCase()));
  return Array.from(new Uint8Array(digest).slice(0, 16), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
