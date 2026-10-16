import { useCallback, useEffect, useState } from "react"
import { translate } from "@/lib/language"

export function useData<T>(loader: () => Promise<T>, reloadKey: unknown = 0) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    loader()
      .then((d) => {
        if (active) {
          setData(d)
          setError(null)
          setLoading(false)
        }
      })
      .catch((e: unknown) => {
        if (active) {
          setError(e instanceof Error ? e : new Error(translate("Something went wrong while loading data.")))
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [loader, reloadKey, version])

  const reload = useCallback(() => setVersion((v) => v + 1), [])
  return { data, loading, error, reload }
}
