import { auth } from '@/lib/auth-v2'
import { redirect } from 'next/navigation'
import MutasiMasukClient from './mutasi-masuk-client'

export default async function MutasiMasukPage() {
  const session = await auth()
  if (!session) redirect('/login')
  return <MutasiMasukClient />
}
