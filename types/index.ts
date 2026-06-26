// ============================================================
// ENUMS
// ============================================================

export enum Role {
  ADMIN_KECAMATAN = 'admin_kecamatan',
  OPERATOR_SEKOLAH = 'operator_sekolah',
  PEGAWAI = 'pegawai',
}

export enum Jenjang {
  SD = 'sd',
  TK = 'tk',
  KB = 'kb',
}

export enum StatusSekolah {
  NEGERI = 'negeri',
  SWASTA = 'swasta',
}

export enum JenisKelamin {
  LAKI_LAKI = 'laki-laki',
  PEREMPUAN = 'perempuan',
}

export enum StatusUpload {
  BELUM_DIUPLOAD = 'belum_diupload',
  SUDAH_DIUPLOAD = 'sudah_diupload',
}

export enum StatusVerifikasi {
  BELUM_DIVERIFIKASI = 'belum_diverifikasi',
  SUDAH_DIVERIFIKASI = 'sudah_diverifikasi',
  DITOLAK = 'ditolak',
}

export enum StatusKelengkapan {
  BELUM_LENGKAP = 'belum_lengkap',
  LENGKAP = 'lengkap',
  TIDAK_LENGKAP = 'tidak_lengkap',
}

export enum StatusSiswa {
  AKTIF = 'aktif',
  KELUAR = 'keluar',
  LULUS = 'lulus',
}

export enum StatusLaporan {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

export enum Semester {
  GANJIL = 'ganjil',
  GENAP = 'genap',
}

export enum StatusPegawai {
  PNS = 'pns',
  PPPK = 'pppk',
  PPPK_PARUH_WAKTU = 'pppk_paruh_waktu',
  HONORER = 'honorer',
  GTY = 'gty',
  GTT = 'gtt',
}

export enum JenisSertifikasi {
  SUDAH = 'sudah',
  BELUM = 'belum',
}

// ============================================================
// KATEGORI & SUB-KATEGORI DOKUMEN
// ============================================================

export const DOKUMEN_KATEGORI = {
  IDENTITAS: {
    label: 'Dokumen Identitas',
    jenis: [
      'KTP',
      'Kartu Keluarga',
      'Akta Lahir',
    ],
  },
  KEPEGAWAIAN: {
    label: 'Dokumen Kepegawaian',
    jenis: [
      'SK CPNS',
      'SK PNS',
      'SK PPPK',
      'SK Pengangkatan Honorer',
      'SK Pangkat/Golongan',
      'SK Jabatan',
      'SK Tugas Belajar',
      'SK Ijin Belajar',
      'SK Pindah Tugas',
      'SK Pensiun',
    ],
  },
  PENDIDIKAN: {
    label: 'Dokumen Pendidikan',
    jenis: [
      'Ijazah SD',
      'Ijazah SMP',
      'Ijazah SMA',
      'Ijazah D3',
      'Ijazah S1',
      'Ijazah S2',
      'Ijazah S3',
      'Transkrip Nilai',
    ],
  },
  SERTIFIKASI: {
    label: 'Dokumen Sertifikasi',
    jenis: [
      'Sertifikat Pendidik',
      'Sertifikat PPPK',
      'Sertifikat Pelatihan',
      'Sertifikat Seminar',
      'Piagam Prestasi',
    ],
  },
  LAINNYA: {
    label: 'Dokumen Lainnya',
    jenis: [
      'Surat Keterangan Sehat',
      'Surat Keterangan Berkelakuan Baik (SKBK)',
      'Surat Keterangan Pengalaman Kerja',
      'NPWP',
      'BPJS Kesehatan',
      'BPJS Ketenagakerjaan',
      'Rekening Bank',
      'Foto Formal',
    ],
  },
} as const

export type KategoriDokumen = keyof typeof DOKUMEN_KATEGORI
export type JenisDokumen = typeof DOKUMEN_KATEGORI[KategoriDokumen]['jenis'][number]

// ============================================================
// COMMON TYPES
// ============================================================

export type Timestamp = number // Unix milliseconds

export interface BaseEntity {
  id: string
  is_active: boolean
  created_at: Timestamp
  updated_at: Timestamp
}

// ============================================================
// USER
// ============================================================

export interface User extends BaseEntity {
  name: string
  email: string
  role: Role
  sekolah_id?: string | null
  pegawai_id?: string | null
  avatar_url?: string | null
}

// ============================================================
// SCHOOL
// ============================================================

export interface School extends BaseEntity {
  nama: string
  npsn: string
  jenjang: Jenjang
  status: StatusSekolah
  alamat: string
  desa: string
  kecamatan: string
  kepala_id?: string | null
  latitude?: number | null
  longitude?: number | null
}

// ============================================================
// EMPLOYEE
// ============================================================

export interface Employee extends BaseEntity {
  sekolah_id: string
  nama: string
  nik: string
  nip?: string | null
  nuptk?: string | null
  email?: string | null
  no_hp?: string | null
  tempat_lahir?: string | null
  tanggal_lahir?: string | null
  jenis_kelamin?: JenisKelamin | null
  jabatan?: string | null
  status_pegawai?: StatusPegawai | null
  pangkat_golongan?: string | null
  pendidikan_terakhir?: string | null
  jurusan?: string | null
  sertifikasi?: JenisSertifikasi | null
  tmt_kerja?: string | null
  tanggal_bup?: string | null
  foto_url?: string | null
}

// ============================================================
// EMPLOYEE DOCUMENT
// ============================================================

export interface EmployeeDocument extends BaseEntity {
  employee_id: string
  school_id: string
  kategori: string
  jenis_dokumen: string
  nama_file: string
  mime_type: string
  file_size: number
  drive_file_id: string
  drive_url: string
  status_upload: StatusUpload
  status_verifikasi: StatusVerifikasi
  status_kelengkapan: StatusKelengkapan
  catatan_revisi?: string | null
  uploaded_by?: string | null
  verified_by?: string | null
  uploaded_at?: Timestamp | null
  verified_at?: Timestamp | null
}

// ============================================================
// STUDENT
// ============================================================

export interface Student {
  id: string
  school_id: string
  tahun_pelajaran: string
  jenjang: Jenjang
  kelas_kelompok: string
  nama: string
  nik?: string | null
  nisn?: string | null
  jenis_kelamin?: JenisKelamin | null
  tempat_lahir?: string | null
  tanggal_lahir?: string | null
  alamat?: string | null
  nama_orang_tua?: string | null
  status_siswa: StatusSiswa
  created_at: Timestamp
  updated_at: Timestamp
}

// ============================================================
// STUDENT RECAP
// ============================================================

export interface StudentRecap {
  id: string
  school_id: string
  tahun_pelajaran: string
  semester: Semester
  kelas_kelompok: string
  laki_laki: number
  perempuan: number
  total: number
  siswa_masuk: number
  siswa_keluar: number
  keterangan?: string | null
  created_at: Timestamp
  updated_at: Timestamp
}

// ============================================================
// INFRASTRUCTURE
// ============================================================

export interface Infrastructure {
  id: string
  school_id: string
  tahun_pelajaran: string
  jenis_sarpras: string
  jumlah: number
  kondisi_baik: number
  rusak_ringan: number
  rusak_sedang: number
  rusak_berat: number
  kebutuhan: number
  foto_url?: string | null
  keterangan?: string | null
  created_at: Timestamp
  updated_at: Timestamp
}

// ============================================================
// REPORT
// ============================================================

export interface Report {
  id: string
  school_id: string
  periode_bulan: number
  tahun: number
  jenis_laporan: string
  status: StatusLaporan
  submitted_by?: string | null
  verified_by?: string | null
  submitted_at?: Timestamp | null
  verified_at?: Timestamp | null
  catatan_revisi?: string | null
  created_at: Timestamp
  updated_at: Timestamp
}

// ============================================================
// ACTIVITY LOG
// ============================================================

export interface ActivityLog {
  id: string
  user_id: string
  action: string
  table_name: string
  record_id?: string | null
  description?: string | null
  created_at: Timestamp
}

// ============================================================
// SETTING
// ============================================================

export interface Setting {
  id: string
  key: string
  value: string
  created_at: Timestamp
  updated_at: Timestamp
}

// ============================================================
// NOTIFICATION
// ============================================================

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  description: string
  is_read: number // 0 | 1
  related_link?: string | null
  created_at: Timestamp
}

// ============================================================
// MENU
// ============================================================

export interface MenuItem {
  id: string
  label: string
  icon?: string
  href?: string
  roles?: Role[]
  children?: MenuItem[]
}

// ============================================================
// FILTER & PAGINATION
// ============================================================

export interface FilterParams {
  search?: string
  role?: Role
  jenjang?: Jenjang
  status?: StatusSekolah | StatusLaporan | StatusSiswa
  kecamatan?: string
  sekolah_id?: string
  tahun_pelajaran?: string
  semester?: Semester
  kategori?: string
  jenis_dokumen?: string
  status_upload?: StatusUpload
  status_verifikasi?: StatusVerifikasi
  status_kelengkapan?: StatusKelengkapan
  periode_bulan?: number
  tahun?: number
  is_active?: boolean
}

export interface PaginationParams {
  page: number
  limit: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  total_pages: number
}

// ============================================================
// EXPORT
// ============================================================

export interface ExportOptions {
  format: 'excel' | 'pdf'
  filename?: string
  columns?: string[]
  filters?: FilterParams
  title?: string
  orientation?: 'portrait' | 'landscape'
  page_size?: 'A4' | 'A3' | 'Letter'
}

export interface ExportColumn {
  key: string
  label: string
  width?: number
}

export interface ExportConfig {
  title: string
  filename: string
  columns: ExportColumn[]
  data: Record<string, unknown>[]
  format: 'excel' | 'pdf'
}

// ============================================================
// DASHBOARD
// ============================================================

export interface DashboardStats {
  total_schools: number
  total_employees: number
  total_students: number
  total_documents: number
  documents_verified: number
  documents_pending: number
  reports_submitted: number
}

// ============================================================
// AUTH / SESSION
// ============================================================

export interface SessionUser {
  id: string
  name: string
  email: string
  role: Role
  sekolah_id?: string | null
  pegawai_id?: string | null
  avatar_url?: string | null
}

export interface Session {
  user: SessionUser
  expires: string
}

declare module 'next-auth' {
  interface Session {
    user: SessionUser
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: Role
    sekolah_id?: string | null
    pegawai_id?: string | null
  }
}

// ============================================================
// API RESPONSE
// ============================================================

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
  pagination?: Pick<PaginatedResult<T>, 'total' | 'page' | 'limit' | 'total_pages'>
}
