import { auth } from '@/lib/auth-v2'
import { redirect } from 'next/navigation'
import DashboardShell from './shell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/login')
  return <DashboardShell>{children}</DashboardShell>
}
