'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import KesiswaanContent from '@/components/kesiswaan/KesiswaanContent'

export default function KesiswaanPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const role = (session?.user as any)?.role
  const sekolahJenjang = (session?.user as any)?.sekolah_jenjang

  useEffect(() => {
    if (status !== 'authenticated' || role !== 'operator_sekolah') return
    if (sekolahJenjang === 'sd') router.replace('/sd/kesiswaan')
    else if (sekolahJenjang === 'tk' || sekolahJenjang === 'kb') router.replace('/tk-kb/kesiswaan')
  }, [status, role, sekolahJenjang, router])

  if (status === 'loading') return <div className="p-8 text-center text-zinc-500">Memuat...</div>
  if (role === 'operator_sekolah') return <div className="p-8 text-center text-zinc-500">Mengalihkan...</div>

  return <KesiswaanContent />
}
