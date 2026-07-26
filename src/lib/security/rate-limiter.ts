import { headers } from "next/headers"

type RateLimitRecord = {
  tokens: number
  lastRefill: number
}

const rateLimitMap = new Map<string, RateLimitRecord>()

// Periodically purge stale records every 30 seconds to keep memory lean
if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => {
    const now = Date.now()
    const cutoff = now - 10 * 60_000 // Purge records inactive for > 10 min
    for (const [key, record] of rateLimitMap.entries()) {
      if (record.lastRefill < cutoff) {
        rateLimitMap.delete(key)
      }
    }
  }, 30_000)
  if (timer.unref) timer.unref()
}

/** Extract client IP reliably from request headers */
export async function getClientIp(): Promise<string> {
  try {
    const h = await headers()
    const forwarded = h.get("x-forwarded-for")
    if (forwarded) {
      return forwarded.split(",")[0].trim()
    }
    const realIp = h.get("x-real-ip") || h.get("cf-connecting-ip")
    if (realIp) return realIp.trim()
  } catch {
    // If headers context is not available
  }
  return "127.0.0.1"
}

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  resetMs: number
}

/**
 * High-performance sliding window rate limiter
 * @param keyPrefix Prefix identifying the route/action (e.g., 'login', 'contact')
 * @param limit Maximum allowed requests within the window
 * @param windowMs Time window in milliseconds (default: 60,000 ms = 1 min)
 */
export async function checkRateLimit(
  keyPrefix: string,
  limit = 10,
  windowMs = 60_000,
  customIdentifier?: string
): Promise<RateLimitResult> {
  const ip = customIdentifier ?? (await getClientIp())
  const key = `${keyPrefix}:${ip}`
  const now = Date.now()
  
  const record = rateLimitMap.get(key)

  if (!record) {
    rateLimitMap.set(key, {
      tokens: limit - 1,
      lastRefill: now,
    })
    return {
      allowed: true,
      remaining: limit - 1,
      resetMs: windowMs,
    }
  }

  const timePassed = now - record.lastRefill
  if (timePassed >= windowMs) {
    // Window passed, reset count
    record.tokens = limit - 1
    record.lastRefill = now
    return {
      allowed: true,
      remaining: limit - 1,
      resetMs: windowMs,
    }
  }

  if (record.tokens > 0) {
    record.tokens -= 1
    return {
      allowed: true,
      remaining: record.tokens,
      resetMs: windowMs - timePassed,
    }
  }

  return {
    allowed: false,
    remaining: 0,
    resetMs: windowMs - timePassed,
  }
}
