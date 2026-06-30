import { auth } from '@/lib/auth-v2'
import { redirect } from 'next/navigation'
import ArchivesClient from './archives-client'

export default async function ArchivesPage() {
  const session = await auth()
  if (!session) redirect('/login')
  return <ArchivesClient />
}
