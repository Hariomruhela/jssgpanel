import { useCallback, useEffect, useRef, useState } from "react"
import { translate } from "@/lib/language"
import { DEFAULT_STALE_TIME, memoryCache } from "@/lib/cache"

export interface UseDataOptions<T> {
  /** Optional custom cache key. If omitted, derived from loader signature and reloadKey. */
  key?: string
  /** Time in ms before cached data is considered stale. Default: 5 minutes (300,000ms). */
  staleTime?: number
  /** If true, bypasses in-memory cache and always fetches fresh. Default: false. */
  skipCache?: boolean
  /** Initial fallback data if cache is empty. */
  initialData?: T
}

function serializeKey(keyPart: unknown): string {
  if (keyPart === undefined || keyPart === null) return ""
  if (
    typeof keyPart === "string" ||
    typeof keyPart === "number" ||
    typeof keyPart === "boolean"
  ) {
    return String(keyPart)
  }
  try {
    return JSON.stringify(keyPart)
  } catch {
    return String(keyPart)
  }
}

function deriveCacheKey(loader: () => Promise<unknown>, reloadKey: unknown): string {
  const loaderStr = loader.toString().replace(/\s+/g, " ").trim()
  const reloadStr = serializeKey(reloadKey)
  return `useData::${loaderStr}::${reloadStr}`
}

export function useData<T>(
  loader: () => Promise<T>,
  reloadKey: unknown = 0,
  options?: UseDataOptions<T> | string
) {
  const opts = typeof options === "string" ? { key: options } : options || {}
  const {
    key: explicitKey,
    staleTime = DEFAULT_STALE_TIME,
    skipCache = false,
    initialData,
  } = opts

  const cacheKey = explicitKey || deriveCacheKey(loader, reloadKey)

  // Initialize data and loading synchronously from cache.
  // This delivers TRUE 0 ms instant rendering when navigating between tabs!
  const [data, setData] = useState<T | null>(() => {
    if (skipCache) return initialData ?? null
    const cached = memoryCache.get<T>(cacheKey, staleTime)
    if (cached) return cached.data
    return initialData ?? null
  })

  const [loading, setLoading] = useState<boolean>(() => {
    if (skipCache) return true
    const cached = memoryCache.get<T>(cacheKey, staleTime)
    // If cached data exists (even if stale), we DO NOT block the UI with a skeleton/spinner.
    // Stale-While-Revalidate: render cached content immediately and revalidate silently.
    if (cached) return false
    return true
  })

  const [error, setError] = useState<Error | null>(null)
  const [version, setVersion] = useState(0)

  const activeRef = useRef(true)
  const loaderRef = useRef(loader)

  useEffect(() => {
    loaderRef.current = loader
  })

  const executeFetch = useCallback(
    async (isBackground = false) => {
      if (!isBackground) {
        setLoading(true)
      }

      try {
        // Deduplicate in-flight promises across components
        let promise = memoryCache.getInFlight<T>(cacheKey)
        if (!promise) {
          promise = loaderRef.current()
          memoryCache.setInFlight(cacheKey, promise)
        }

        const freshData = await promise

        if (activeRef.current) {
          memoryCache.set(cacheKey, freshData)
          setData(freshData)
          setError(null)
          setLoading(false)
        }
        return freshData
      } catch (e: unknown) {
        if (activeRef.current) {
          const err =
            e instanceof Error
              ? e
              : new Error(translate("Something went wrong while loading data."))
          setError(err)
          setLoading(false)
        }
        throw e
      }
    },
    [cacheKey]
  )

  useEffect(() => {
    activeRef.current = true

    const cached = skipCache ? null : memoryCache.get<T>(cacheKey, staleTime)

    if (cached) {
      // If data is stale (> 5 mins), revalidate in the background silently
      if (cached.isStale) {
        executeFetch(true).catch(() => {
          // Background revalidation failure preserves existing cached data
        })
      }
    } else {
      // Cold cache: fetch with loading=true
      executeFetch(false).catch(() => {
        // Error state handled inside executeFetch
      })
    }

    // Subscribe to any cache update for this key (e.g. from background refresh or other tabs)
    const unsubscribe = memoryCache.subscribe((updatedKey, updatedData) => {
      if (updatedKey === cacheKey && activeRef.current) {
        setData(updatedData as T)
        setError(null)
        setLoading(false)
      }
    })

    return () => {
      activeRef.current = false
      unsubscribe()
    }
  }, [cacheKey, staleTime, skipCache, version, executeFetch])

  const reload = useCallback(() => {
    // Explicit user reload: invalidate cache entry and force fresh network call
    memoryCache.delete(cacheKey)
    setVersion((v) => v + 1)
    return executeFetch(false)
  }, [cacheKey, executeFetch])

  return { data, loading, error, reload }
}
