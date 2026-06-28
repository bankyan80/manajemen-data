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
  jenjang?: string[]
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
    feature: 'dashboard',
    roles: ['admin_kecamatan', 'operator_sekolah', 'pegawai'],
  },
  {
    label: 'GTK',
    href: '/gtk',
    icon: <IdCard className="h-5 w-5" />,
    feature: 'gtk',
    roles: ['admin_kecamatan', 'operator_sekolah'],
  },
  {
    label: 'Kesiswaan',
    href: '/kesiswaan',
    icon: <Users className="h-5 w-5" />,
    feature: 'kesiswaan',
    roles: ['admin_kecamatan', 'operator_sekolah'],
  },
  {
    label: 'Sarpras',
    href: '/sarpras',
    icon: <Building2 className="h-5 w-5" />,
    feature: 'sarpras',
    roles: ['admin_kecamatan', 'operator_sekolah'],
  },
  {
    label: 'Kelembagaan',
    href: '/kelembagaan',
    icon: <Landmark className="h-5 w-5" />,
    feature: 'kelembagaan',
    roles: ['admin_kecamatan', 'operator_sekolah'],
  },
  {
    label: 'SPMB',
    href: '/spmb',
    icon: <ClipboardList className="h-5 w-5" />,
    feature: 'spmb',
    roles: ['admin_kecamatan', 'operator_sekolah'],
  },
  {
    label: 'Transisi',
    href: '/transisi-sd-smp',
    icon: <ArrowRightLeft className="h-5 w-5" />,
    feature: 'transisi',
    roles: ['admin_kecamatan', 'operator_sekolah'],
    jenjang: ['sd'],
  },
  {
    label: 'Rekap',
    href: '/rekap-kecamatan',
    icon: <FileText className="h-5 w-5" />,
    feature: 'rekap_kecamatan',
    roles: ['admin_kecamatan'],
  },
  {
    label: 'Cetak',
    href: '/cetak-export',
    icon: <Printer className="h-5 w-5" />,
    feature: 'cetak_export',
    roles: ['admin_kecamatan', 'operator_sekolah'],
  },
  {
    label: 'Arsip',
    href: '/arsip-digital',
    icon: <Archive className="h-5 w-5" />,
    feature: 'arsip_dokumen',
    roles: ['admin_kecamatan', 'operator_sekolah', 'pegawai'],
  },
  {
    label: 'Pengaturan',
    href: '/pengaturan',
    icon: <Settings className="h-5 w-5" />,
    feature: 'pengaturan',
    roles: ['admin_kecamatan', 'operator_sekolah'],
  },
]

interface MobileTopNavigationProps {
  currentPath: string
  userRole: string
  userJenjang: string
}

export default function MobileTopNavigation({
  currentPath,
  userRole,
  userJenjang,
}: MobileTopNavigationProps) {
  const { can } = usePermissions()

  return (
    <nav className="fixed top-16 left-0 right-0 z-40 flex h-14 items-center border-b border-primary-dark bg-primary shadow-sm sm:hidden">
      <div className="flex w-full items-center gap-1 overflow-x-auto px-2 scrollbar-none">
        {navItems
          .filter(item => item.roles.includes(userRole))
          .filter(item => can(item.feature))
          .filter(item => !item.jenjang || item.jenjang.includes(userJenjang))
          .map((item) => {
          const isActive = currentPath === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-colors ${
                isActive
                  ? 'text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
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
