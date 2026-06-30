import { auth } from '@/lib/auth-v2'
import { redirect } from 'next/navigation'
import TeachersClient from './teachers-client'

export default async function TeachersPage() {
  const session = await auth()
  if (!session) redirect('/login')
  return <TeachersClient />
}
