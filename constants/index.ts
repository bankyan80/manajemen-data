export const APP_NAME = 'TIMKER BIDIK 360'
export const APP_DESCRIPTION = 'AI-Powered Educational Command Center — Kecamatan Lemahabang'
export const APP_DOMAIN = 'https://timker-bidik.online'

export const ROLES = {
  ADMIN: 'admin_kecamatan' as const,
  OPERATOR: 'operator_sekolah' as const,
  GURU: 'guru_tendik' as const,
}

export type MenuItemDef = { id: string; label: string; icon: string; href: string }

export const KELAS_OPTIONS_SD = ['Kelas I', 'Kelas II', 'Kelas III', 'Kelas IV', 'Kelas V', 'Kelas VI']
export const KELAS_OPTIONS_TK = ['A (Usia 4-5)', 'B (Usia 5-6)']
export const KELAS_OPTIONS_KB = ['2-3 Tahun', '3-4 Tahun', '4-5 Tahun']

export const JENJANG_OPTIONS = [
  { value: 'sd', label: 'SD' },
  { value: 'tk', label: 'TK' },
  { value: 'kb', label: 'KB' },
]

export const MENU_ITEMS: Record<string, MenuItemDef[]> = {
  admin_kecamatan: [
    { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', href: '/dashboard' },
    { id: 'gis', label: 'GIS Education Map', icon: 'Map', href: '/gis' },
    { id: 'schools', label: 'Sekolah', icon: 'School', href: '/schools' },
    { id: 'teachers', label: 'Guru & Tendik', icon: 'Users', href: '/teachers' },
    { id: 'certification', label: 'Sertifikasi', icon: 'Award', href: '/certification' },
    { id: 'infrastructure', label: 'Infrastruktur', icon: 'Building2', href: '/infrastructure' },
    { id: 'mutasi-masuk', label: 'Mutasi Masuk', icon: 'UserPlus', href: '/mutasi-masuk' },
    { id: 'mutasi-keluar', label: 'Mutasi Keluar', icon: 'UserMinus', href: '/mutasi-keluar' },
    { id: 'archives', label: 'Arsip Digital', icon: 'Archive', href: '/archives' },
    { id: 'ai', label: 'AI Intelligence', icon: 'Brain', href: '/ai' },
    { id: 'laporan-bulanan', label: 'Laporan Bulanan', icon: 'ClipboardList', href: '/laporan-bulanan' },
    { id: 'reports', label: 'Laporan', icon: 'FileText', href: '/reports' },
  ],
  operator_sekolah: [
    { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', href: '/dashboard' },
    { id: 'schools', label: 'Sekolah Saya', icon: 'School', href: '/schools' },
    { id: 'teachers', label: 'Guru & Tendik', icon: 'Users', href: '/teachers' },
    { id: 'certification', label: 'Sertifikasi', icon: 'Award', href: '/certification' },
    { id: 'infrastructure', label: 'Infrastruktur', icon: 'Building2', href: '/infrastructure' },
    { id: 'mutasi-masuk', label: 'Mutasi Masuk', icon: 'UserPlus', href: '/mutasi-masuk' },
    { id: 'mutasi-keluar', label: 'Mutasi Keluar', icon: 'UserMinus', href: '/mutasi-keluar' },
    { id: 'archives', label: 'Arsip', icon: 'Archive', href: '/archives' },
    { id: 'laporan-bulanan', label: 'Laporan Bulanan', icon: 'ClipboardList', href: '/laporan-bulanan' },
    { id: 'reports', label: 'Laporan', icon: 'FileText', href: '/reports' },
  ],
  guru_tendik: [
    { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', href: '/dashboard' },
    { id: 'certification', label: 'Sertifikasi Saya', icon: 'Award', href: '/certification' },
    { id: 'archives', label: 'Dokumen Saya', icon: 'Archive', href: '/archives' },
    { id: 'profile', label: 'Profil', icon: 'User', href: '/profile' },
  ],
}

export const HEALTH_GRADE: Record<string, { min: number; label: string; color: string }> = {
  EXCELLENT: { min: 90, label: 'Excellent', color: 'text-green-600 bg-green-50 border-green-200' },
  GOOD: { min: 75, label: 'Good', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  MODERATE: { min: 60, label: 'Moderate', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  WARNING: { min: 40, label: 'Warning', color: 'text-orange-600 bg-orange-50 border-orange-200' },
  CRITICAL: { min: 0, label: 'Critical', color: 'text-red-600 bg-red-50 border-red-200' },
}
