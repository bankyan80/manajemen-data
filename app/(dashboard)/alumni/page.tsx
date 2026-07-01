import { auth } from '@/lib/auth-v2'
import { redirect } from 'next/navigation'
import AlumniClient from './alumni-client'

export default async function AlumniPage() {
  const session = await auth()
  if (!session) redirect('/login')
  return <AlumniClient />
}
