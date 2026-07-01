import { useState, useMemo } from 'react'

type SortDirection = 'asc' | 'desc'

export interface SortConfig {
  key: string
  direction: SortDirection
}

export function useSort<T>(data: T[], defaultKey?: string) {
  const [sort, setSort] = useState<SortConfig>({
    key: defaultKey || '',
    direction: 'asc',
  })

  const sorted = useMemo(() => {
    if (!sort.key) return data
    return [...data].sort((a, b) => {
      const aVal = (a as any)[sort.key]
      const bVal = (b as any)[sort.key]
      if (aVal == null) return 1
      if (bVal == null) return -1
      const cmp = String(aVal).localeCompare(String(bVal), 'id', { numeric: true })
      return sort.direction === 'asc' ? cmp : -cmp
    })
  }, [data, sort])

  const toggle = (key: string) => {
    setSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  return { sorted, sort, toggle }
}
