'use client'

import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  IdCard,
  BookOpen,
  Building2,
  Landmark,
  ClipboardList,
  ArrowRightLeft,
  Trophy,
  MonitorCheck,
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
    icon: <LayoutDashboard className="h-5 w-5" />,
    roles: ['admin_kecamatan', 'operator_sekolah', 'pegawai'],
  },
  {
    label: 'Kesiswaan',
    href: '/kesiswaan',
    icon: <Users className="h-5 w-5" />,
    roles: ['admin_kecamatan', 'operator_sekolah'],
  },
  {
    label: 'GTK',
    href: '/gtk',
    icon: <IdCard className="h-5 w-5" />,
    roles: ['admin_kecamatan', 'operator_sekolah'],
  },
  {
    label: 'Kurikulum',
    href: '/kurikulum',
    icon: <BookOpen className="h-5 w-5" />,
    roles: ['admin_kecamatan', 'operator_sekolah'],
  },
  {
    label: 'Sarpras',
    href: '/sarpras',
    icon: <Building2 className="h-5 w-5" />,
    roles: ['admin_kecamatan', 'operator_sekolah'],
  },
  {
    label: 'Kelembagaan',
    href: '/kelembagaan',
    icon: <Landmark className="h-5 w-5" />,
    roles: ['admin_kecamatan', 'operator_sekolah'],
  },
  {
    label: 'SPMB',
    href: '/spmb',
    icon: <ClipboardList className="h-5 w-5" />,
    roles: ['admin_kecamatan', 'operator_sekolah'],
  },
  {
    label: 'Transisi',
    href: '/transisi-paud-sd',
    icon: <ArrowRightLeft className="h-5 w-5" />,
    roles: ['admin_kecamatan', 'operator_sekolah'],
  },
  {
    label: 'Prestasi',
    href: '/kegiatan-prestasi',
    icon: <Trophy className="h-5 w-5" />,
    roles: ['admin_kecamatan', 'operator_sekolah'],
  },
  {
    label: 'Monitoring',
    href: '/monitoring',
    icon: <MonitorCheck className="h-5 w-5" />,
    roles: ['admin_kecamatan'],
  },
  {
    label: 'Rekap',
    href: '/rekap-kecamatan',
    icon: <FileText className="h-5 w-5" />,
    roles: ['admin_kecamatan'],
  },
  {
    label: 'Arsip',
    href: '/arsip-dokumen',
    icon: <FolderArchive className="h-5 w-5" />,
    roles: ['admin_kecamatan', 'operator_sekolah', 'pegawai'],
  },
  {
    label: 'Cetak',
    href: '/cetak-export',
    icon: <Printer className="h-5 w-5" />,
    roles: ['admin_kecamatan', 'operator_sekolah'],
  },
  {
    label: 'Pengaturan',
    href: '/pengaturan',
    icon: <Settings className="h-5 w-5" />,
    roles: ['admin_kecamatan', 'operator_sekolah'],
  },
]

interface MobileTopNavigationProps {
  currentPath: string
  userRole: string
}

export default function MobileTopNavigation({
  currentPath,
  userRole,
}: MobileTopNavigationProps) {
  const filteredItems = navItems.filter((item) => item.roles.includes(userRole))

  return (
    <nav className="fixed top-16 left-0 right-0 z-40 flex h-14 items-center border-b border-zinc-200 bg-white shadow-sm sm:hidden">
      <div className="flex w-full items-center gap-1 overflow-x-auto px-2 scrollbar-none">
        {filteredItems.map((item) => {
          const isActive = currentPath === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 transition-colors ${
                isActive
                  ? 'text-teal-600'
                  : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600'
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
