type CacheEntry<T> = {
  data: T
  expiresAt: number
  tags?: string[]
}

const memoryStore = new Map<string, CacheEntry<unknown>>()

/**
 * High-performance in-memory TTL caching engine
 * Retrieves cached value if present and valid, otherwise executes fallback, caches result, and returns.
 */
export async function getOrSetCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds = 60,
  tags?: string[]
): Promise<T> {
  const now = Date.now()
  const cached = memoryStore.get(key)

  if (cached && cached.expiresAt > now) {
    return cached.data as T
  }

  const freshData = await fetcher()
  memoryStore.set(key, {
    data: freshData,
    expiresAt: now + ttlSeconds * 1000,
    tags,
  })

  return freshData
}

/** Invalidate a specific cache key */
export function invalidateCacheKey(key: string): void {
  memoryStore.delete(key)
}

/** Invalidate all cache entries matching a tag */
export function invalidateCacheTag(tag: string): void {
  for (const [key, entry] of memoryStore.entries()) {
    if (entry.tags && entry.tags.includes(tag)) {
      memoryStore.delete(key)
    }
  }
}

/** Clear all in-memory caches */
export function clearAllMemoryCache(): void {
  memoryStore.clear()
}
