'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import KesiswaanContent from '@/components/kesiswaan/KesiswaanContent'

export default function KesiswaanPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const role = (session?.user as any)?.role
  const userSekolahId = (session?.user as any)?.sekolah_id

  useEffect(() => {
    if (status !== 'authenticated' || !role) return
    if (role !== 'operator_sekolah' || !userSekolahId) return

    fetch(`/api/schools/${userSekolahId}`).then(r => r.json()).then(data => {
      if (data?.jenjang === 'sd') router.replace('/sd/kesiswaan')
      else if (data?.jenjang === 'tk' || data?.jenjang === 'kb') router.replace('/tk-kb/kesiswaan')
    }).catch(() => {})
  }, [status, role, userSekolahId, router])

  if (status === 'loading') return <div className="p-8 text-center text-zinc-500">Memuat...</div>
  if (role === 'operator_sekolah') return <div className="p-8 text-center text-zinc-500">Mengalihkan...</div>

  return <KesiswaanContent />
}
