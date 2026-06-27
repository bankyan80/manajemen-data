'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export type PermissionFeature =
  | 'dashboard' | 'kesiswaan' | 'gtk' | 'sarpras' | 'kelembagaan'
  | 'spmb' | 'transisi' | 'rekap_kecamatan' | 'cetak_export'
  | 'pengaturan' | 'arsip_dokumen' | 'monitoring'

export function usePermissions() {
  const { data: session } = useSession()
  const [permissions, setPermissions] = useState<Record<string, string[]> | null>(null)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (data?.role_permissions) {
          try {
            setPermissions(JSON.parse(data.role_permissions))
          } catch {
            setPermissions(null)
          }
        } else {
          setPermissions(null)
        }
      })
      .catch(() => setPermissions(null))
  }, [])

  const role = (session?.user as any)?.role as string | undefined

  const can = useCallback((feature: PermissionFeature): boolean => {
    if (!role) return false
    if (!permissions) return true
    const allowed = permissions[role]
    if (!allowed) return true
    return allowed.includes(feature)
  }, [role, permissions])

  return { can, permissions, role }
}
