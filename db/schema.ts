import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

// ============================================================
// HELPERS
// ============================================================

const id = {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
}

const timestamps = {
  created_at: integer('created_at').notNull().$defaultFn(() => Date.now()),
  updated_at: integer('updated_at').notNull().$defaultFn(() => Date.now()).$onUpdateFn(() => Date.now()),
}

const isActive = {
  is_active: integer('is_active').notNull().default(1),
}

// ============================================================
// USERS
// ============================================================

export const users = sqliteTable('users', {
  ...id,
  name: text('name').notNull(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  email: text('email'),
  role: text('role').notNull(), // admin_kecamatan | operator_sekolah | pegawai
  sekolah_id: text('sekolah_id'),
  pegawai_id: text('pegawai_id'),
  avatar_url: text('avatar_url'),
  ...isActive,
  ...timestamps,
})

// ============================================================
// SCHOOLS
// ============================================================

export const schools = sqliteTable('schools', {
  ...id,
  nama: text('nama').notNull(),
  npsn: text('npsn').notNull().unique(),
  jenjang: text('jenjang').notNull(), // sd | paud
  status: text('status').notNull(), // negeri | swasta
  alamat: text('alamat').notNull(),
  desa: text('desa').notNull(),
  kecamatan: text('kecamatan').notNull(),
  kepala_id: text('kepala_id'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  ...isActive,
  ...timestamps,
})

// ============================================================
// EMPLOYEES
// ============================================================

export const employees = sqliteTable('employees', {
  ...id,
  sekolah_id: text('sekolah_id').notNull().references(() => schools.id),
  nama: text('nama').notNull(),
  nik: text('nik').notNull(),
  nip: text('nip'),
  nuptk: text('nuptk'),
  email: text('email'),
  no_hp: text('no_hp'),
  tempat_lahir: text('tempat_lahir'),
  tanggal_lahir: text('tanggal_lahir'),
  jenis_kelamin: text('jenis_kelamin'), // laki-laki | perempuan
  jabatan: text('jabatan'),
  status_pegawai: text('status_pegawai'), // pns | pppk | pppk_paruh_waktu | honorer | gty | gtt
  pangkat_golongan: text('pangkat_golongan'),
  pendidikan_terakhir: text('pendidikan_terakhir'),
  jurusan: text('jurusan'),
  sertifikasi: text('sertifikasi'), // sudah | belum
  tmt_kerja: text('tmt_kerja'),
  tanggal_bup: text('tanggal_bup'),
  foto_url: text('foto_url'),
  ...isActive,
  ...timestamps,
})

// ============================================================
// EMPLOYEE DOCUMENTS
// ============================================================

export const employeeDocuments = sqliteTable('employee_documents', {
  ...id,
  employee_id: text('employee_id').notNull().references(() => employees.id),
  school_id: text('school_id').notNull().references(() => schools.id),
  kategori: text('kategori').notNull(),
  jenis_dokumen: text('jenis_dokumen').notNull(),
  nama_file: text('nama_file').notNull(),
  mime_type: text('mime_type').notNull(),
  file_size: integer('file_size').notNull(),
  drive_file_id: text('drive_file_id').notNull(),
  drive_url: text('drive_url').notNull(),
  status_upload: text('status_upload').notNull().default('belum_upload'),
  status_verifikasi: text('status_verifikasi').notNull().default('belum_diverifikasi'),
  status_kelengkapan: text('status_kelengkapan').notNull().default('belum_lengkap'),
  catatan_revisi: text('catatan_revisi'),
  uploaded_by: text('uploaded_by'),
  verified_by: text('verified_by'),
  uploaded_at: integer('uploaded_at'),
  verified_at: integer('verified_at'),
  ...timestamps,
})

// ============================================================
// STUDENTS
// ============================================================

export const students = sqliteTable('students', {
  ...id,
  school_id: text('school_id').notNull().references(() => schools.id),
  tahun_pelajaran: text('tahun_pelajaran').notNull(),
  jenjang: text('jenjang').notNull(), // sd | paud
  kelas_kelompok: text('kelas_kelompok').notNull(),
  nama: text('nama').notNull(),
  nik: text('nik'),
  nisn: text('nisn'),
  jenis_kelamin: text('jenis_kelamin'), // laki-laki | perempuan
  tempat_lahir: text('tempat_lahir'),
  tanggal_lahir: text('tanggal_lahir'),
  alamat: text('alamat'),
  nama_orang_tua: text('nama_orang_tua'),
  status_siswa: text('status_siswa').notNull().default('aktif'),
  ...timestamps,
})

// ============================================================
// STUDENT RECAPS
// ============================================================

export const studentRecaps = sqliteTable('student_recaps', {
  ...id,
  school_id: text('school_id').notNull().references(() => schools.id),
  tahun_pelajaran: text('tahun_pelajaran').notNull(),
  semester: text('semester').notNull(), // ganjil | genap
  kelas_kelompok: text('kelas_kelompok').notNull(),
  laki_laki: integer('laki_laki').notNull().default(0),
  perempuan: integer('perempuan').notNull().default(0),
  total: integer('total').notNull().default(0),
  siswa_masuk: integer('siswa_masuk').notNull().default(0),
  siswa_keluar: integer('siswa_keluar').notNull().default(0),
  keterangan: text('keterangan'),
  ...timestamps,
})

// ============================================================
// INFRASTRUCTURE
// ============================================================

// Kategori Dapodik: Tanah, Bangunan, Ruang Kelas, Ruang Kantor,
// Laboratorium, Perpustakaan, Sanitasi, Penunjang, Alat & Buku
// Kolom `data` berisi JSON spesifik per kategori.

export const infrastructure = sqliteTable('infrastructure', {
  ...id,
  school_id: text('school_id').notNull().references(() => schools.id),
  tahun_pelajaran: text('tahun_pelajaran').notNull(),
  kategori: text('kategori').notNull(),
  data: text('data').notNull().default('{}'),
  keterangan: text('keterangan'),
  ...timestamps,
})

// ============================================================
// REPORTS
// ============================================================

export const reports = sqliteTable('reports', {
  ...id,
  school_id: text('school_id').notNull().references(() => schools.id),
  periode_bulan: integer('periode_bulan').notNull(),
  tahun: integer('tahun').notNull(),
  jenis_laporan: text('jenis_laporan').notNull(),
  status: text('status').notNull().default('draft'),
  submitted_by: text('submitted_by'),
  verified_by: text('verified_by'),
  submitted_at: integer('submitted_at'),
  verified_at: integer('verified_at'),
  catatan_revisi: text('catatan_revisi'),
  ...timestamps,
})

// ============================================================
// ACTIVITY LOGS
// ============================================================

export const activityLogs = sqliteTable('activity_logs', {
  ...id,
  user_id: text('user_id').notNull().references(() => users.id),
  action: text('action').notNull(),
  table_name: text('table_name').notNull(),
  record_id: text('record_id'),
  description: text('description'),
  created_at: integer('created_at').notNull().$defaultFn(() => Date.now()),
})

// ============================================================
// SETTINGS
// ============================================================

export const settings = sqliteTable('settings', {
  ...id,
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  ...timestamps,
})

// ============================================================
// NOTIFICATIONS
// ============================================================

export const notifications = sqliteTable('notifications', {
  ...id,
  user_id: text('user_id').notNull().references(() => users.id),
  type: text('type').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  is_read: integer('is_read').notNull().default(0),
  related_link: text('related_link'),
  created_at: integer('created_at').notNull().$defaultFn(() => Date.now()),
})
