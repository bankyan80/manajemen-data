import { auth } from '@/lib/auth-v2'
import { redirect } from 'next/navigation'
import AiClient from './ai-client'

export default async function AiPage() {
  const session = await auth()
  if (!session) redirect('/login')
  return <AiClient />
}
