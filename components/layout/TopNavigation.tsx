'use client'

import Link from 'next/link'
import { usePermissions, type PermissionFeature } from '@/lib/usePermissions'
import {
  LayoutDashboard,
  Users,
  IdCard,
  Building2,
  Landmark,
  ClipboardList,
  ArrowRightLeft,
  FileText,
  Printer,
  Settings,
  Archive,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  feature: PermissionFeature
  roles: string[]
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="h-4 w-4" />,
    feature: 'dashboard',
    roles: ['admin_kecamatan', 'operator_sekolah', 'pegawai'],
  },
  {
    label: 'GTK/Kepegawaian',
    href: '/gtk',
    icon: <IdCard className="h-4 w-4" />,
    feature: 'gtk',
    roles: ['admin_kecamatan', 'operator_sekolah'],
  },
  {
    label: 'Kesiswaan',
    href: '/kesiswaan',
    icon: <Users className="h-4 w-4" />,
    feature: 'kesiswaan',
    roles: ['admin_kecamatan', 'operator_sekolah'],
  },
  {
    label: 'Sarpras',
    href: '/sarpras',
    icon: <Building2 className="h-4 w-4" />,
    feature: 'sarpras',
    roles: ['admin_kecamatan', 'operator_sekolah'],
  },
  {
    label: 'Kelembagaan',
    href: '/kelembagaan',
    icon: <Landmark className="h-4 w-4" />,
    feature: 'kelembagaan',
    roles: ['admin_kecamatan', 'operator_sekolah'],
  },
  {
    label: 'SPMB/PPDB',
    href: '/spmb',
    icon: <ClipboardList className="h-4 w-4" />,
    feature: 'spmb',
    roles: ['admin_kecamatan', 'operator_sekolah'],
  },
  {
    label: 'Transisi SD-SMP',
    href: '/transisi-sd-smp',
    icon: <ArrowRightLeft className="h-4 w-4" />,
    feature: 'transisi',
    roles: ['admin_kecamatan', 'operator_sekolah'],
  },
  {
    label: 'Rekap Kecamatan',
    href: '/rekap-kecamatan',
    icon: <FileText className="h-4 w-4" />,
    feature: 'rekap_kecamatan',
    roles: ['admin_kecamatan'],
  },
  {
    label: 'Cetak & Export',
    href: '/cetak-export',
    icon: <Printer className="h-4 w-4" />,
    feature: 'cetak_export',
    roles: ['admin_kecamatan', 'operator_sekolah'],
  },
  {
    label: 'Arsip Digital',
    href: '/arsip-digital',
    icon: <Archive className="h-4 w-4" />,
    feature: 'arsip_dokumen',
    roles: ['admin_kecamatan', 'operator_sekolah', 'pegawai'],
  },
  {
    label: 'Pengaturan',
    href: '/pengaturan',
    icon: <Settings className="h-4 w-4" />,
    feature: 'pengaturan',
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
  const { can } = usePermissions()

  return (
    <nav className="fixed top-16 left-0 right-0 z-40 border-b border-primary-dark bg-primary shadow-sm">
      <div className="flex w-full flex-wrap items-center justify-center gap-x-1 gap-y-0 px-2 py-1.5">
        {navItems
          .filter(item => item.roles.includes(userRole))
          .filter(item => can(item.feature))
          .map((item) => {
          const isActive = currentPath === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1 rounded-[10px] px-2.5 py-1.5 text-[11px] font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className={isActive ? 'text-white' : 'text-white/70'}>
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
