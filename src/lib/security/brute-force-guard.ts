import { getClientIp } from "./rate-limiter"

type AttemptRecord = {
  failures: number
  lockoutUntil: number
}

const attemptMap = new Map<string, AttemptRecord>()

const MAX_FAILURES = 5 // Maximum failed attempts allowed before temporary lockout
const LOCKOUT_DURATION_MS = 15 * 60_000 // 15 minute lockout

// Periodic cleanup of expired lockout records
if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => {
    const now = Date.now()
    for (const [key, record] of attemptMap.entries()) {
      if (record.lockoutUntil <= now && record.failures === 0) {
        attemptMap.delete(key)
      }
    }
  }, 60_000)
  if (timer.unref) timer.unref()
}

/** Check if an identifier/IP combination is currently locked out due to repeated failures */
export async function isLockedOut(identifier: string): Promise<{ locked: boolean; remainingSeconds: number }> {
  const ip = await getClientIp()
  const key = `${identifier.toLowerCase()}:${ip}`
  const record = attemptMap.get(key)
  const now = Date.now()

  if (record && record.lockoutUntil > now) {
    const remainingSeconds = Math.ceil((record.lockoutUntil - now) / 1000)
    return { locked: true, remainingSeconds }
  }

  return { locked: false, remainingSeconds: 0 }
}

/** Record a failed authentication attempt */
export async function recordFailedAttempt(identifier: string): Promise<{ failures: number; locked: boolean }> {
  const ip = await getClientIp()
  const key = `${identifier.toLowerCase()}:${ip}`
  const now = Date.now()

  let record = attemptMap.get(key)
  if (!record || record.lockoutUntil <= now) {
    record = { failures: 1, lockoutUntil: 0 }
  } else {
    record.failures += 1
  }

  if (record.failures >= MAX_FAILURES) {
    record.lockoutUntil = now + LOCKOUT_DURATION_MS
    attemptMap.set(key, record)
    return { failures: record.failures, locked: true }
  }

  attemptMap.set(key, record)
  return { failures: record.failures, locked: false }
}

/** Reset failure counters upon successful authentication */
export async function clearFailedAttempts(identifier: string): Promise<void> {
  const ip = await getClientIp()
  const key = `${identifier.toLowerCase()}:${ip}`
  attemptMap.delete(key)
}
