import { auth } from '@/lib/auth-v2'
import { redirect } from 'next/navigation'
import SimulationClient from './simulation-client'

export default async function SimulationPage() {
  const session = await auth()
  if (!session) redirect('/login')
  return <SimulationClient />
}
