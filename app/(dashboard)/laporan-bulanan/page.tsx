import { auth } from '@/lib/auth-v2'
import { redirect } from 'next/navigation'
import LaporanBulananClient from './laporan-bulanan-client'

export default async function LaporanBulananPage() {
  const session = await auth()
  if (!session) redirect('/login')
  return <LaporanBulananClient />
}
