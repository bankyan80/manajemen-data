// Role system — ONLY 2 roles
export enum Role {
  ADMIN_KECAMATAN = 'admin_kecamatan',
  GURU_TENDIK = 'guru_tendik',
}

// Core entities
export interface User {
  id: string
  name: string
  email: string
  role: Role
  sekolah_id?: string
  pegawai_id?: string
  avatar_url?: string
  is_active: boolean
  created_at: number
  updated_at: number
}

export interface Village {
  id: string
  nama: string
  kecamatan: string
  created_at: number
}

export interface School {
  id: string
  nama: string
  npsn: string
  jenjang: 'sd' | 'tk' | 'kb'
  status: 'negeri' | 'swasta'
  alamat: string
  desa: string
  village_id?: string
  kecamatan: string
  kepala_id?: string
  latitude?: number
  longitude?: number
  health_score?: number
  is_active: boolean
  created_at: number
  updated_at: number
}

export interface Teacher {
  id: string
  sekolah_id: string
  nama: string
  nik: string
  nip?: string
  nuptk?: string
  email?: string
  no_hp?: string
  tempat_lahir?: string
  tanggal_lahir?: string
  jenis_kelamin?: string
  jabatan?: string
  status_pegawai?: string
  pangkat_golongan?: string
  pendidikan_terakhir?: string
  jurusan?: string
  sertifikasi?: string
  tmt_kerja?: string
  tanggal_bup?: string
  foto_url?: string
  is_active: boolean
  created_at: number
  updated_at: number
}

export interface Certification {
  id: string
  teacher_id: string
  jenis_sertifikasi: string
  nomor_sertifikat?: string
  tahun_sertifikasi?: number
  penerbit?: string
  status: 'submission' | 'verification' | 'validation' | 'approval' | 'disbursement'
  file_url?: string
  catatan?: string
  created_at: number
  updated_at: number
}

export interface Student {
  id: string
  school_id: string
  tahun_pelajaran: string
  jenjang: string
  kelas_kelompok: string
  nama: string
  nik?: string
  nisn?: string
  jenis_kelamin?: string
  tempat_lahir?: string
  tanggal_lahir?: string
  alamat?: string
  nama_orang_tua?: string
  status_siswa: string
  created_at: number
  updated_at: number
}

export interface InfrastructureItem {
  id: string
  school_id: string
  jenis: string
  nama: string
  jumlah: number
  kondisi: 'baik' | 'rusak_ringan' | 'rusak_sedang' | 'rusak_berat'
  foto_url?: string
  keterangan?: string
  created_at: number
  updated_at: number
}

export interface ArchiveDocument {
  id: string
  school_id?: string
  teacher_id?: string
  module_type: string
  category: string
  document_type: string
  file_name: string
  file_url: string
  file_size: number
  mime_type: string
  uploaded_by?: string
  deskripsi?: string
  created_at: number
}

export interface Alert {
  id: string
  type: 'info' | 'warning' | 'critical' | 'success'
  title: string
  description: string
  related_school_id?: string
  related_teacher_id?: string
  is_read: boolean
  created_at: number
}

export interface DashboardKPI {
  totalSchools: number
  totalStudents: number
  totalTeachers: number
  teacherShortage: number
  teacherSurplus: number
  certificationPending: number
  retirementRisk: number
  damagedClassrooms: number
}

export interface HealthScore {
  score: number
  grade: 'Excellent' | 'Good' | 'Moderate' | 'Warning' | 'Critical'
  teacher_ratio: number
  student_ratio: number
  infrastructure_score: number
  certification_rate: number
}

export interface SimulationResult {
  scenario: string
  before: Record<string, number>
  after: Record<string, number>
  delta: Record<string, number>
  cost_impact?: number
  recommendations: string[]
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  pagination?: {
    total: number
    page: number
    limit: number
    total_pages: number
  }
}
