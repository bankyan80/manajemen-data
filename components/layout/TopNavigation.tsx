'use client'

import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  IdCard,
  Building2,
  Landmark,
  ClipboardList,
  ArrowRightLeft,
  FileText,
  FolderArchive,
  Printer,
  Settings,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  roles: string[]
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="h-4 w-4" />,
    roles: ['admin_kecamatan', 'operator_sekolah', 'pegawai'],
  },
  {
    label: 'Kesiswaan',
    href: '/kesiswaan',
    icon: <Users className="h-4 w-4" />,
    roles: ['admin_kecamatan', 'operator_sekolah'],
  },
  {
    label: 'GTK/Kepegawaian',
    href: '/gtk',
    icon: <IdCard className="h-4 w-4" />,
    roles: ['admin_kecamatan', 'operator_sekolah'],
  },
  {
    label: 'Sarpras',
    href: '/sarpras',
    icon: <Building2 className="h-4 w-4" />,
    roles: ['admin_kecamatan', 'operator_sekolah'],
  },
  {
    label: 'Kelembagaan',
    href: '/kelembagaan',
    icon: <Landmark className="h-4 w-4" />,
    roles: ['admin_kecamatan', 'operator_sekolah'],
  },
  {
    label: 'SPMB/PPDB',
    href: '/spmb',
    icon: <ClipboardList className="h-4 w-4" />,
    roles: ['admin_kecamatan', 'operator_sekolah'],
  },
  {
    label: 'Transisi SD-SMP',
    href: '/transisi-sd-smp',
    icon: <ArrowRightLeft className="h-4 w-4" />,
    roles: ['admin_kecamatan', 'operator_sekolah'],
  },
  {
    label: 'Rekap Kecamatan',
    href: '/rekap-kecamatan',
    icon: <FileText className="h-4 w-4" />,
    roles: ['admin_kecamatan'],
  },
  {
    label: 'Arsip Dokumen',
    href: '/arsip-dokumen',
    icon: <FolderArchive className="h-4 w-4" />,
    roles: ['admin_kecamatan', 'operator_sekolah', 'pegawai'],
  },
  {
    label: 'Cetak & Export',
    href: '/cetak-export',
    icon: <Printer className="h-4 w-4" />,
    roles: ['admin_kecamatan', 'operator_sekolah'],
  },
  {
    label: 'Pengaturan',
    href: '/pengaturan',
    icon: <Settings className="h-4 w-4" />,
    roles: ['admin_kecamatan', 'operator_sekolah'],
  },
]

interface TopNavigationProps {
  currentPath: string
  userRole: string
}

export default function TopNavigation({
  currentPath,
  userRole,
}: TopNavigationProps) {
  return (
    <nav className="fixed top-16 left-0 right-0 z-40 border-b border-border bg-surface shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="flex w-full flex-wrap items-center justify-center gap-x-1 gap-y-0 px-2 py-1.5">
        {navItems.map((item) => {
          const isActive = currentPath === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1 rounded-[10px] px-2.5 py-1.5 text-[11px] font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-primary-soft text-primary'
                  : 'text-text-muted hover:bg-zinc-100 hover:text-text-main'
              }`}
            >
              <span className={isActive ? 'text-primary' : 'text-text-muted'}>
                {item.icon}
              </span>
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
