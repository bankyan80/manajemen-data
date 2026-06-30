import { auth } from '@/lib/auth-v2'
import { redirect } from 'next/navigation'
import CertificationClient from './certification-client'

export default async function CertificationPage() {
  const session = await auth()
  if (!session) redirect('/login')
  return <CertificationClient />
}
