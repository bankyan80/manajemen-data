import { auth } from '@/lib/auth-v2'
import { redirect } from 'next/navigation'
import InfrastructureClient from './infrastructure-client'

export default async function InfrastructurePage() {
  const session = await auth()
  if (!session) redirect('/login')
  const user = session.user as any
  return <InfrastructureClient role={user?.role} userSekolahId={user?.sekolah_id} userSekolahNama={user?.sekolah_nama} />
}
