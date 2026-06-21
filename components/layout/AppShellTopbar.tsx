'use client'

import { useSession } from 'next-auth/react'
import Topbar from './Topbar'
import TopNavigation from './TopNavigation'
import MobileTopNavigation from './MobileTopNavigation'
import { usePathname } from 'next/navigation'

interface AppShellTopbarProps {
  children: React.ReactNode
}

export default function AppShellTopbar({ children }: AppShellTopbarProps) {
  const { data: session } = useSession()
  const pathname = usePathname()

  const user = session?.user
    ? {
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        avatar_url: session.user.avatar_url,
      }
    : null

  return (
    <>
      <Topbar user={user} />
      <div className="hidden sm:block">
        <TopNavigation
          currentPath={pathname}
          userRole={user?.role || ''}
        />
      </div>
      <div className="sm:hidden">
        <MobileTopNavigation
          currentPath={pathname}
          userRole={user?.role || ''}
        />
      </div>
      <main className="min-h-screen bg-zinc-50 pt-16">
        <div className="hidden sm:block">
          <div className="h-12" />
        </div>
        <div className="sm:hidden">
          <div className="h-14" />
        </div>
        <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </>
  )
}
