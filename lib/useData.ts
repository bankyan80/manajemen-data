import { useEffect, useState } from 'react'

type CacheEntry<T> = { data: T; timestamp: number }
const cache = new Map<string, CacheEntry<any>>()
const CACHE_TTL = 60_000

export function useData<T>(key: string | null, fetcher: () => Promise<T>): { data: T | null; loading: boolean; error: string | null; mutate: () => void } {
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: string | null }>({
    data: null,
    loading: true,
    error: null,
  })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!key) { setState({ data: null, loading: false, error: null }); return }
    let cancelled = false
    const cached = cache.get(key)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL && version === 0) {
      setState({ data: cached.data, loading: false, error: null })
      return
    }

    setState({ data: null, loading: true, error: null })
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
  }, [key, version])

  const mutate = () => {
    if (key) cache.delete(key)
    setVersion(v => v + 1)
  }

  return { ...state, mutate }
}

export async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  return res.json()
}
