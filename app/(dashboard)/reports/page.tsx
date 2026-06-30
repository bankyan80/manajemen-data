import { auth } from '@/lib/auth-v2'
import { redirect } from 'next/navigation'
import ReportsClient from './reports-client'

export default async function ReportsPage() {
  const session = await auth()
  if (!session) redirect('/login')
  return <ReportsClient />
}
