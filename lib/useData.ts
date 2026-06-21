import { useEffect, useState } from 'react'

type CacheEntry<T> = { data: T; timestamp: number }
const cache = new Map<string, CacheEntry<any>>()
const CACHE_TTL = 60_000

export function useData<T>(key: string, fetcher: () => Promise<T>): { data: T | null; loading: boolean; error: string | null } {
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: string | null }>({
    data: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    const cached = cache.get(key)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setState({ data: cached.data, loading: false, error: null })
      return
    }

    fetcher()
      .then((data) => {
        if (!cancelled) {
          cache.set(key, { data, timestamp: Date.now() })
          setState({ data, loading: false, error: null })
        }
      })
      .catch((err) => {
        if (!cancelled) setState({ data: null, loading: false, error: err.message })
      })

    return () => { cancelled = true }
  }, [key])

  return state
}

export async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  return res.json()
}
