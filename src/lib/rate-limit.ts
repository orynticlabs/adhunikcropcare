import { headers } from "next/headers"

type RateLimitRecord = {
  count: number
  resetAt: number
}

// In-memory high-performance rate limiting store
const rateLimitMap = new Map<string, RateLimitRecord>()

// Periodically purge expired IP tracking keys to avoid memory leaks
if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => {
    const now = Date.now()
    for (const [key, record] of rateLimitMap.entries()) {
      if (record.resetAt <= now) {
        rateLimitMap.delete(key)
      }
    }
  }, 30_000)
  if (timer.unref) timer.unref()
}

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
    // If headers() is unavailable in static render context
  }
  return "127.0.0.1"
}

export async function checkRateLimit(
  keyPrefix: string,
  limit = 10,
  windowMs = 60_000
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  const ip = await getClientIp()
  const key = `${keyPrefix}:${ip}`
  const now = Date.now()
  const record = rateLimitMap.get(key)

  if (!record || record.resetAt <= now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, reset: now + windowMs }
  }

  record.count += 1
  if (record.count > limit) {
    return { allowed: false, remaining: 0, reset: record.resetAt }
  }

  return { allowed: true, remaining: limit - record.count, reset: record.resetAt }
}
