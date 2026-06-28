'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import KesiswaanContent from '@/components/kesiswaan/KesiswaanContent'

export default function TkKbKesiswaanPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const role = (session?.user as any)?.role
  const sekolahJenjang = (session?.user as any)?.sekolah_jenjang

  useEffect(() => {
    if (role !== 'operator_sekolah') return
    if (sekolahJenjang === 'sd') router.replace('/sd/kesiswaan')
  }, [role, sekolahJenjang, router])

  if (role === 'operator_sekolah' && sekolahJenjang === 'sd') {
    return <div className="p-8 text-center text-zinc-500">Mengalihkan...</div>
  }

  return <KesiswaanContent allowedJenjang={['tk', 'kb']} defaultJenjang="tk" />
}
