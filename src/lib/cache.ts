/**
 * In-Memory Stale-While-Revalidate (SWR) Cache
 *
 * Caches API responses and data loaders in-memory to provide:
 * 1. 0 ms instant page transitions across tabs (Members, Groups, Dashboard, etc.)
 * 2. Background silent revalidation when data is older than staleTime (default 5 minutes)
 * 3. In-flight request deduplication (prevents redundant concurrent fetches)
 * 4. Automatic cache invalidation when mutations (POST, PUT, PATCH, DELETE) occur
 */

export interface CacheEntry<T = unknown> {
  data: T
  timestamp: number
}

/** Default stale-time: 5 minutes (in milliseconds) */
export const DEFAULT_STALE_TIME = 5 * 60 * 1000

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>()
  private inFlight = new Map<string, Promise<unknown>>()
  private listeners = new Set<(key: string, data: unknown) => void>()

  /**
   * Retrieve cached item if present, along with freshness status.
   */
  get<T>(key: string, maxAge = DEFAULT_STALE_TIME): { data: T; timestamp: number; isStale: boolean } | null {
    const entry = this.store.get(key)
    if (!entry) return null
    const isStale = Date.now() - entry.timestamp > maxAge
    return { data: entry.data as T, timestamp: entry.timestamp, isStale }
  }

  /**
   * Retrieve data only if it is still completely fresh (< maxAge).
   */
  getFresh<T>(key: string, maxAge = DEFAULT_STALE_TIME): T | null {
    const entry = this.store.get(key)
    if (!entry) return null
    if (Date.now() - entry.timestamp > maxAge) return null
    return entry.data as T
  }

  /**
   * Save data into cache with a timestamp and notify active subscribers.
   */
  set<T>(key: string, data: T, timestamp: number = Date.now()): void {
    this.store.set(key, { data, timestamp })
    this.notify(key, data)
  }

  /**
   * Delete a single cache key.
   */
  delete(key: string): boolean {
    return this.store.delete(key)
  }

  /**
   * Invalidate all cache entries matching a prefix or pattern.
   * Useful when mutations (create/update/delete) occur on a resource.
   */
  invalidate(pattern: string | RegExp): number {
    let count = 0
    for (const key of Array.from(this.store.keys())) {
      const matches =
        typeof pattern === "string"
          ? key.includes(pattern) || key.startsWith(pattern)
          : pattern.test(key)
      if (matches) {
        this.store.delete(key)
        count++
      }
    }
    return count
  }

  /**
   * Clear entire cache (e.g. on user logout).
   */
  clear(): void {
    this.store.clear()
    this.inFlight.clear()
  }

  /**
   * Track in-flight requests to deduplicate concurrent calls.
   */
  getInFlight<T>(key: string): Promise<T> | undefined {
    return this.inFlight.get(key) as Promise<T> | undefined
  }

  setInFlight<T>(key: string, promise: Promise<T>): void {
    this.inFlight.set(key, promise as Promise<unknown>)
    promise.finally(() => {
      if (this.inFlight.get(key) === (promise as Promise<unknown>)) {
        this.inFlight.delete(key)
      }
    })
  }

  /**
   * Subscribe to cache updates for real-time reactivity.
   */
  subscribe(listener: (key: string, data: unknown) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify(key: string, data: unknown): void {
    this.listeners.forEach((listener) => {
      try {
        listener(key, data)
      } catch {
        // Safe execution
      }
    })
  }
}

export const memoryCache = new MemoryCache()
