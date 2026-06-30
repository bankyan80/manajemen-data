import { auth } from '@/lib/auth-v2'
import { redirect } from 'next/navigation'
import GisClient from './gis-client'

export default async function GisPage() {
  const session = await auth()
  if (!session) redirect('/login')
  const role = (session?.user as unknown as Record<string, unknown>)?.role as string
  if (role !== 'admin_kecamatan') redirect('/dashboard')
  return <GisClient />
}
