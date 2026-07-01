'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, Map, School, Users, Award, Building2, 
  Archive, BarChart4, Brain, FileText, 
  Menu, Bell, ChevronDown, LogOut, User, PanelLeftClose, PanelLeft,
} from 'lucide-react'
import { MENU_ITEMS } from '@/constants'
import { cn } from '@/lib/utils'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, Map, School, Users, Award, Building2,
  Archive, BarChart4, Brain, FileText, User,
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false)
  const [sidebarDesktopOpen, setSidebarDesktopOpen] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const role = ((session?.user as unknown as Record<string, unknown>)?.role as string) || 'guru_tendik'
  const menuItems = MENU_ITEMS[role as keyof typeof MENU_ITEMS] || MENU_ITEMS.guru_tendik

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-border flex flex-col transition-transform duration-200",
        "lg:translate-x-0",
        sidebarMobileOpen ? "translate-x-0" : "-translate-x-full",
        !sidebarDesktopOpen && "lg:-translate-x-full"
      )}>
        <div className="flex items-center gap-3 h-16 px-6 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-white font-bold text-sm">
            TB
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">TIMKER BIDIK</div>
            <div className="text-[10px] text-slate-400 font-medium">Command Center</div>
          </div>
          <button
            onClick={() => setSidebarDesktopOpen(false)}
            className="ml-auto p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hidden lg:flex"
            title="Sembunyikan sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = iconMap[item.icon] || LayoutDashboard
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setSidebarMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon className="w-4.5 h-4.5 flex-shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex-shrink-0 border-t border-border p-4">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
              {(session?.user?.name || 'U').charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{session?.user?.name}</div>
              <div className="text-xs text-slate-400 truncate capitalize">{role.replace('_', ' ')}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarMobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/20 lg:hidden" onClick={() => setSidebarMobileOpen(false)} />
      )}

      {/* Main */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-200",
        sidebarDesktopOpen ? "lg:ml-64" : "lg:ml-0"
      )}>
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarMobileOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
              >
                <Menu className="w-5 h-5 text-slate-600" />
              </button>
              <button
                onClick={() => setSidebarDesktopOpen(prev => !prev)}
                className="hidden lg:flex p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                title={sidebarDesktopOpen ? 'Sembunyikan sidebar' : 'Tampilkan sidebar'}
              >
                {sidebarDesktopOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
              </button>
              <div className="hidden sm:flex items-center gap-2 text-sm text-slate-400">
                <span className="font-medium text-slate-600">Kecamatan Lemahabang</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="relative p-2 rounded-lg hover:bg-slate-100">
                <Bell className="w-5 h-5 text-slate-500" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  3
                </span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    {(session?.user?.name || 'U').charAt(0)}
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 z-20 w-56 bg-white rounded-xl shadow-dropdown border border-border py-1">
                      <div className="px-4 py-2 border-b border-border">
                        <div className="text-sm font-medium">{session?.user?.name}</div>
                        <div className="text-xs text-slate-400">{session?.user?.email}</div>
                      </div>
                      <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                        <User className="w-4 h-4" /> Profil
                      </Link>
                      <button
                        onClick={() => { window.location.href = '/api/auth/signout' }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" /> Keluar
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
