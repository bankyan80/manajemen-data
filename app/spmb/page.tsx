import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SpmbClient from './_client'

export default async function SpmbPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const user = session.user as any
  const isAdmin = user?.role === 'admin_kecamatan'
  return <SpmbClient isAdmin={isAdmin} sekolahId={user?.sekolah_id ?? undefined} />
}
