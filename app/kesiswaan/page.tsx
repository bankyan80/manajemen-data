'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import KesiswaanContent from '@/components/kesiswaan/KesiswaanContent'

export default function KesiswaanPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const role = (session?.user as any)?.role
  const sekolahJenjang = (session?.user as any)?.sekolah_jenjang
  const userSekolahId = (session?.user as any)?.sekolah_id
  const redirected = useRef(false)

  useEffect(() => {
    if (status !== 'authenticated' || role !== 'operator_sekolah' || redirected.current) return

    if (sekolahJenjang === 'sd') { redirected.current = true; router.replace('/sd/kesiswaan'); return }
    if (sekolahJenjang === 'tk' || sekolahJenjang === 'kb') { redirected.current = true; router.replace('/tk-kb/kesiswaan'); return }

    // Fallback: old JWT without sekolah_jenjang — fetch from API
    if (userSekolahId) {
      fetch(`/api/schools/${userSekolahId}`).then(r => r.json()).then(data => {
        if (data?.jenjang === 'sd') { redirected.current = true; router.replace('/sd/kesiswaan') }
        else if (data?.jenjang === 'tk' || data?.jenjang === 'kb') { redirected.current = true; router.replace('/tk-kb/kesiswaan') }
      }).catch(() => {})
    }
  }, [status, role, sekolahJenjang, userSekolahId, router])

  if (status === 'loading') return <div className="p-8 text-center text-zinc-500">Memuat...</div>
  if (role === 'operator_sekolah') return <div className="p-8 text-center text-zinc-500">Mengalihkan...</div>

  return <KesiswaanContent />
}
