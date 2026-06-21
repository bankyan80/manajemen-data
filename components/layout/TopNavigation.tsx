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
    label: 'Kurikulum & Penilaian',
    href: '/kurikulum',
    icon: <BookOpen className="h-4 w-4" />,
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
    label: 'Transisi PAUD-SD',
    href: '/transisi-paud-sd',
    icon: <ArrowRightLeft className="h-4 w-4" />,
    roles: ['admin_kecamatan', 'operator_sekolah'],
  },
  {
    label: 'Kegiatan & Prestasi',
    href: '/kegiatan-prestasi',
    icon: <Trophy className="h-4 w-4" />,
    roles: ['admin_kecamatan', 'operator_sekolah'],
  },
  {
    label: 'Monitoring',
    href: '/monitoring',
    icon: <MonitorCheck className="h-4 w-4" />,
    roles: ['admin_kecamatan'],
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
  const filteredItems = navItems.filter((item) => item.roles.includes(userRole))

  return (
    <nav className="fixed top-16 left-0 right-0 z-40 flex h-12 items-center border-b border-zinc-200 bg-white shadow-sm">
      <div className="flex w-full items-center gap-1 overflow-x-auto px-4 scrollbar-none">
        {filteredItems.map((item) => {
          const isActive = currentPath === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? 'text-teal-700'
                  : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'
              }`}
            >
              <span
                className={`${isActive ? 'text-teal-600' : 'text-zinc-400'}`}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-1/2 h-0.5 w-3/4 -translate-x-1/2 rounded-full bg-teal-600" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
