import { auth } from '@/lib/auth-v2'
import { redirect } from 'next/navigation'
import SchoolsClient from './schools-client'

export default async function SchoolsPage() {
  const session = await auth()
  if (!session) redirect('/login')
  return <SchoolsClient />
}
