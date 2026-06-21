import { MenuItem } from '../types'
import { Role } from '../types'

export const ROLES = {
  ADMIN_KECAMATAN: 'admin_kecamatan',
  OPERATOR_SEKOLAH: 'operator_sekolah',
  PEGAWAI: 'pegawai',
} as const

export function checkPermission(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole)
}

export function canAccessSchool(userSekolahId: string | null | undefined, targetSekolahId: string): boolean {
  if (!userSekolahId) return true
  return userSekolahId === targetSekolahId
}

export function canAccessEmployee(userPegawaiId: string | null | undefined, targetPegawaiId: string): boolean {
  if (!userPegawaiId) return true
  return userPegawaiId === targetPegawaiId
}

export function getAccessibleMenuItems(role: string): MenuItem[] {
  const items: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'LayoutDashboard',
      href: '/dashboard',
      roles: [Role.ADMIN_KECAMATAN, Role.OPERATOR_SEKOLAH, Role.PEGAWAI],
    },
    {
      id: 'sekolah',
      label: 'Data Sekolah',
      icon: 'School',
      href: '/sekolah',
      roles: [Role.ADMIN_KECAMATAN],
    },
    {
      id: 'pegawai',
      label: 'Data Pegawai',
      icon: 'Users',
      href: '/pegawai',
      roles: [Role.ADMIN_KECAMATAN, Role.OPERATOR_SEKOLAH],
    },
    {
      id: 'dokumen',
      label: 'Dokumen',
      icon: 'FileText',
      href: '/dokumen',
      roles: [Role.ADMIN_KECAMATAN, Role.OPERATOR_SEKOLAH, Role.PEGAWAI],
    },
    {
      id: 'siswa',
      label: 'Data Siswa',
      icon: 'GraduationCap',
      href: '/siswa',
      roles: [Role.ADMIN_KECAMATAN, Role.OPERATOR_SEKOLAH],
    },
    {
      id: 'sarpras',
      label: 'Sarpras / Infrastruktur',
      icon: 'Building2',
      href: '/sarpras',
      roles: [Role.ADMIN_KECAMATAN, Role.OPERATOR_SEKOLAH],
    },
    {
      id: 'laporan',
      label: 'Laporan',
      icon: 'FileBarChart',
      href: '/laporan',
      roles: [Role.ADMIN_KECAMATAN, Role.OPERATOR_SEKOLAH],
    },
    {
      id: 'pengguna',
      label: 'Pengguna',
      icon: 'UserCog',
      href: '/pengguna',
      roles: [Role.ADMIN_KECAMATAN],
    },
    {
      id: 'pengaturan',
      label: 'Pengaturan',
      icon: 'Settings',
      href: '/pengaturan',
      roles: [Role.ADMIN_KECAMATAN, Role.OPERATOR_SEKOLAH],
    },
  ]

  return items.filter((item) => item.roles?.includes(role as Role))
}

export function isAdmin(role: string): boolean {
  return role === Role.ADMIN_KECAMATAN
}

export function isOperator(role: string): boolean {
  return role === Role.OPERATOR_SEKOLAH
}

export function isPegawai(role: string): boolean {
  return role === Role.PEGAWAI
}
