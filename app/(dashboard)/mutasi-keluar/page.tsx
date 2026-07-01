import { auth } from '@/lib/auth-v2'
import { redirect } from 'next/navigation'
import MutasiKeluarClient from './mutasi-keluar-client'

export default async function MutasiKeluarPage() {
  const session = await auth()
  if (!session) redirect('/login')
  return <MutasiKeluarClient />
}
