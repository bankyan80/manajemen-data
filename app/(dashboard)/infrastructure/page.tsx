import { auth } from '@/lib/auth-v2'
import { redirect } from 'next/navigation'
import InfrastructureClient from './infrastructure-client'

export default async function InfrastructurePage() {
  const session = await auth()
  if (!session) redirect('/login')
  return <InfrastructureClient />
}
