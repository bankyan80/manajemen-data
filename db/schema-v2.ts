import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core'

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
  role: text('role').notNull(),
  sekolah_id: text('sekolah_id').references(() => schools.id, { onDelete: 'set null' }),
  pegawai_id: text('pegawai_id').references(() => employees.id, { onDelete: 'set null' }),
  avatar_url: text('avatar_url'),
  ...isActive,
  ...timestamps,
}, (table) => ({
  usersSekolahIdx: index('idx_users_sekolah_id').on(table.sekolah_id),
  usersPegawaiIdx: index('idx_users_pegawai_id').on(table.pegawai_id),
}))

// ============================================================
// SCHOOLS
// ============================================================

export const schools = sqliteTable('schools', {
  ...id,
  nama: text('nama').notNull(),
  npsn: text('npsn').notNull().unique(),
  jenjang: text('jenjang').notNull(),
  status: text('status').notNull(),
  alamat: text('alamat').notNull(),
  desa: text('desa').notNull(),
  kecamatan: text('kecamatan').notNull(),
  kepala_id: text('kepala_id'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  health_score: real('health_score').default(0),
  ...isActive,
  ...timestamps,
}, (table) => ({
  schoolsJenjangIdx: index('idx_schools_jenjang').on(table.jenjang),
  schoolsDesaIdx: index('idx_schools_desa').on(table.desa),
}))

// ============================================================
// EMPLOYEES
// ============================================================

export const employees = sqliteTable('employees', {
  ...id,
  sekolah_id: text('sekolah_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  nama: text('nama').notNull(),
  nik: text('nik').notNull().unique(),
  nip: text('nip').unique(),
  nuptk: text('nuptk').unique(),
  email: text('email'),
  no_hp: text('no_hp'),
  tempat_lahir: text('tempat_lahir'),
  tanggal_lahir: text('tanggal_lahir'),
  jenis_kelamin: text('jenis_kelamin'),
  jabatan: text('jabatan'),
  status_pegawai: text('status_pegawai'),
  pangkat_golongan: text('pangkat_golongan'),
  pendidikan_terakhir: text('pendidikan_terakhir'),
  jurusan: text('jurusan'),
  sertifikasi: text('sertifikasi'),
  tmt_kerja: text('tmt_kerja'),
  tanggal_bup: text('tanggal_bup'),
  foto_url: text('foto_url'),
  ...isActive,
  ...timestamps,
}, (table) => ({
  empSekolahIdIdx: index('idx_employees_sekolah_id').on(table.sekolah_id),
  employeesNikIdx: index('idx_employees_nik').on(table.nik),
  employeesNipIdx: index('idx_employees_nip').on(table.nip),
  employeesNuptkIdx: index('idx_employees_nuptk').on(table.nuptk),
  employeesSertifikasiIdx: index('idx_employees_sertifikasi').on(table.sertifikasi),
}))

// ============================================================
// EMPLOYEE DOCUMENTS
// ============================================================

export const employeeDocuments = sqliteTable('employee_documents', {
  ...id,
  employee_id: text('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  school_id: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
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
}, (table) => ({
  edEmployeeIdx: index('idx_ed_employee_id').on(table.employee_id),
  edSchoolIdx: index('idx_ed_school_id').on(table.school_id),
}))

// ============================================================
// STUDENTS
// ============================================================

export const students = sqliteTable('students', {
  ...id,
  school_id: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  tahun_pelajaran: text('tahun_pelajaran').notNull(),
  jenjang: text('jenjang').notNull(),
  kelas_kelompok: text('kelas_kelompok').notNull(),
  nama: text('nama').notNull(),
  nik: text('nik').unique(),
  nisn: text('nisn').unique(),
  jenis_kelamin: text('jenis_kelamin'),
  tempat_lahir: text('tempat_lahir'),
  tanggal_lahir: text('tanggal_lahir'),
  alamat: text('alamat'),
  nama_orang_tua: text('nama_orang_tua'),
  no_hp: text('no_hp'),
  status_siswa: text('status_siswa').notNull().default('aktif'),
  ...timestamps,
}, (table) => ({
  schoolsSchoolIdx: index('idx_students_school_id').on(table.school_id),
  studentsNikIdx: index('idx_students_nik').on(table.nik),
  studentsNisnIdx: index('idx_students_nisn').on(table.nisn),
  studentsTpJenjangIdx: index('idx_students_tp_jenjang').on(table.tahun_pelajaran, table.jenjang),
  studentsSchoolTpJenjangIdx: index('idx_students_school_tp_jenjang').on(table.school_id, table.tahun_pelajaran, table.jenjang),
}))

// ============================================================
// STUDENT RECAPS
// ============================================================

export const studentRecaps = sqliteTable('student_recaps', {
  ...id,
  school_id: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  tahun_pelajaran: text('tahun_pelajaran').notNull(),
  semester: text('semester').notNull(),
  kelas_kelompok: text('kelas_kelompok').notNull(),
  laki_laki: integer('laki_laki').notNull().default(0),
  perempuan: integer('perempuan').notNull().default(0),
  total: integer('total').notNull().default(0),
  siswa_masuk: integer('siswa_masuk').notNull().default(0),
  siswa_keluar: integer('siswa_keluar').notNull().default(0),
  keterangan: text('keterangan'),
  ...timestamps,
}, (table) => ({
  srSchoolIdx: index('idx_sr_school_id').on(table.school_id),
  srTpSemesterIdx: index('idx_sr_tp_semester').on(table.tahun_pelajaran, table.semester),
}))

// ============================================================
// TANAH (Lahan)
// ============================================================

export const tanah = sqliteTable('tanah', {
  ...id,
  school_id: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  nama_tanah: text('nama_tanah').notNull(),
  nomor_sertifikat: text('nomor_sertifikat'),
  jenis_lahan: text('jenis_lahan').notNull().default('induk'),
  panjang: real('panjang').default(0),
  lebar: real('lebar').default(0),
  luas: real('luas').default(0),
  status_kepemilikan: text('status_kepemilikan').notNull().default('milik_sendiri'),
  pemilik: text('pemilik'),
  luas_siap_bangun: real('luas_siap_bangun').default(0),
  ...timestamps,
}, (table) => ({
  tanahSchoolIdx: index('idx_tanah_school_id').on(table.school_id),
}))

// ============================================================
// BANGUNAN (Gedung)
// ============================================================

export const bangunan = sqliteTable('bangunan', {
  ...id,
  school_id: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  nama_gedung: text('nama_gedung').notNull(),
  jenis_prasarana: text('jenis_prasarana'),
  jumlah_lantai: integer('jumlah_lantai').default(1),
  panjang: real('panjang').default(0),
  lebar: real('lebar').default(0),
  luas_tapak: real('luas_tapak').default(0),
  tahun_dibangun: integer('tahun_dibangun'),
  tahun_renovasi: integer('tahun_renovasi'),
  nilai_perolehan: real('nilai_perolehan').default(0),
  kondisi_pondasi: integer('kondisi_pondasi').default(0),
  kondisi_kolom: integer('kondisi_kolom').default(0),
  kondisi_balok: integer('kondisi_balok').default(0),
  kondisi_pelat_lantai: integer('kondisi_pelat_lantai').default(0),
  kondisi_atap: integer('kondisi_atap').default(0),
  keterangan: text('keterangan'),
  ...timestamps,
}, (table) => ({
  bangunanSchoolIdx: index('idx_bangunan_school_id').on(table.school_id),
}))

// ============================================================
// RUANG
// ============================================================

export const ruang = sqliteTable('ruang', {
  ...id,
  school_id: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  bangunan_id: text('bangunan_id').references(() => bangunan.id, { onDelete: 'set null' }),
  kode_ruang: text('kode_ruang'),
  nama_ruang: text('nama_ruang').notNull(),
  lantai_ke: integer('lantai_ke').default(1),
  panjang: real('panjang').default(0),
  lebar: real('lebar').default(0),
  kapasitas_siswa: integer('kapasitas_siswa').default(0),
  kondisi_non_struktur: text('kondisi_non_struktur'),
  jenis_ruang: text('jenis_ruang').default('umum'),
  peruntukan_wc: text('peruntukan_wc'),
  ...timestamps,
}, (table) => ({
  ruangSchoolIdx: index('idx_ruang_school_id').on(table.school_id),
  ruangBangunanIdx: index('idx_ruang_bangunan_id').on(table.bangunan_id),
}))

// ============================================================
// SUB-RUANG (sekat/bilik dalam ruangan)
// ============================================================

export const subRuang = sqliteTable('sub_ruang', {
  ...id,
  ruang_id: text('ruang_id').notNull().references(() => ruang.id, { onDelete: 'cascade' }),
  nama: text('nama').notNull(),
  jumlah: integer('jumlah').default(1),
  ...timestamps,
}, (table) => ({
  subRuangRuangIdx: index('idx_sub_ruang_ruang_id').on(table.ruang_id),
}))

// ============================================================
// SARANA (Alat, APE, inventaris)
// ============================================================

export const sarana = sqliteTable('sarana', {
  ...id,
  school_id: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  ruang_id: text('ruang_id').references(() => ruang.id, { onDelete: 'set null' }),
  nama_sarana: text('nama_sarana').notNull(),
  jenis: text('jenis').notNull().default('alat'),
  jumlah: integer('jumlah').default(0),
  kondisi: text('kondisi').default('baik'),
  ...timestamps,
}, (table) => ({
  saranaSchoolIdx: index('idx_sarana_school_id').on(table.school_id),
  saranaRuangIdx: index('idx_sarana_ruang_id').on(table.ruang_id),
}))

// ============================================================
// BUKU (Perpustakaan)
// ============================================================

export const buku = sqliteTable('buku', {
  ...id,
  school_id: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  jenis_buku: text('jenis_buku').notNull(),
  jumlah_judul: integer('jumlah_judul').default(0),
  jumlah_eksemplar: integer('jumlah_eksemplar').default(0),
  ...timestamps,
}, (table) => ({
  bukuSchoolIdx: index('idx_buku_school_id').on(table.school_id),
}))

// ============================================================
// REPORTS
// ============================================================

export const reports = sqliteTable('reports', {
  ...id,
  school_id: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
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
}, (table) => ({
  reportsSchoolIdx: index('idx_reports_school_id').on(table.school_id),
  reportsPeriodeIdx: index('idx_reports_periode').on(table.tahun, table.periode_bulan),
}))

// ============================================================
// ACTIVITY LOGS
// ============================================================

export const activityLogs = sqliteTable('activity_logs', {
  ...id,
  user_id: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  action: text('action').notNull(),
  table_name: text('table_name').notNull(),
  record_id: text('record_id'),
  description: text('description'),
  created_at: integer('created_at').notNull().$defaultFn(() => Date.now()),
}, (table) => ({
  alUserIdIdx: index('idx_al_user_id').on(table.user_id),
  alCreatedAtIdx: index('idx_al_created_at').on(table.created_at),
}))

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
  user_id: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  is_read: integer('is_read').notNull().default(0),
  related_link: text('related_link'),
  created_at: integer('created_at').notNull().$defaultFn(() => Date.now()),
}, (table) => ({
  notifUserIdIdx: index('idx_notif_user_id').on(table.user_id),
  notifUnreadIdx: index('idx_notif_unread').on(table.user_id, table.is_read),
}))

// ============================================================
// ALUMNI
// ============================================================

export const alumni = sqliteTable('alumni', {
  ...id,
  school_id: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  tahun_lulus: text('tahun_lulus').notNull(),
  nama: text('nama').notNull(),
  nisn: text('nisn'),
  nik: text('nik'),
  jenis_kelamin: text('jenis_kelamin'),
  tempat_lahir: text('tempat_lahir'),
  tanggal_lahir: text('tanggal_lahir'),
  kelas: text('kelas').notNull(),
  tujuan: text('tujuan'),
  ...timestamps,
}, (table) => ({
  alumniSchoolIdx: index('idx_alumni_school_id').on(table.school_id),
  alumniTahunLulusIdx: index('idx_alumni_tahun_lulus').on(table.tahun_lulus),
  alumniTujuanIdx: index('idx_alumni_tujuan').on(table.tujuan),
}))

// ============================================================
// STUDENT MUTATIONS (Mutasi Masuk / Keluar)
// ============================================================

export const studentMutations = sqliteTable('student_mutations', {
  ...id,
  school_id: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  student_id: text('student_id').references(() => students.id, { onDelete: 'set null' }),
  jenis: text('jenis').notNull(),
  tanggal: text('tanggal').notNull(),
  nama: text('nama').notNull(),
  nisn: text('nisn'),
  nik: text('nik'),
  jenis_kelamin: text('jenis_kelamin'),
  kelas_kelompok: text('kelas_kelompok').notNull(),
  sekolah_asal: text('sekolah_asal'),
  sekolah_tujuan: text('sekolah_tujuan'),
  alasan: text('alasan'),
  dokumen_url: text('dokumen_url'),
  keterangan: text('keterangan'),
  ...timestamps,
}, (table) => ({
  smSchoolIdx: index('idx_sm_school_id').on(table.school_id),
  smStudentIdx: index('idx_sm_student_id').on(table.student_id),
  smNikIdx: index('idx_sm_nik').on(table.nik),
}))

// ============================================================
// PPDB / SPMB
// ============================================================

export const ppdb = sqliteTable('ppdb', {
  ...id,
  school_id: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  tahun_pelajaran: text('tahun_pelajaran').notNull(),
  daya_tampung: integer('daya_tampung').default(0),
  jumlah_pendaftar: integer('jumlah_pendaftar').default(0),
  jumlah_pendaftar_l: integer('jumlah_pendaftar_l').default(0),
  jumlah_pendaftar_p: integer('jumlah_pendaftar_p').default(0),
  jumlah_diterima: integer('jumlah_diterima').default(0),
  jumlah_diterima_l: integer('jumlah_diterima_l').default(0),
  jumlah_diterima_p: integer('jumlah_diterima_p').default(0),
  jalur_domisili: integer('jalur_domisili').default(0),
  jalur_domisili_l: integer('jalur_domisili_l').default(0),
  jalur_domisili_p: integer('jalur_domisili_p').default(0),
  jalur_afirmasi: integer('jalur_afirmasi').default(0),
  jalur_afirmasi_l: integer('jalur_afirmasi_l').default(0),
  jalur_afirmasi_p: integer('jalur_afirmasi_p').default(0),
  jalur_mutasi: integer('jalur_mutasi').default(0),
  jalur_mutasi_l: integer('jalur_mutasi_l').default(0),
  jalur_mutasi_p: integer('jalur_mutasi_p').default(0),
  rekap_usia: text('rekap_usia'),
  rekap_usia_l: text('rekap_usia_l'),
  rekap_usia_p: text('rekap_usia_p'),
  kekurangan_kelebihan_kuota: integer('kekurangan_kelebihan_kuota').default(0),
  ...timestamps,
}, (table) => ({
  ppdbSchoolIdx: index('idx_ppdb_school_id').on(table.school_id),
}))

// ============================================================
// SPMB / PPDB — DAYA TAMPUNG
// ============================================================

export const spmbDayaTampung = sqliteTable('spmb_daya_tampung', {
  ...id,
  school_id: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  tahun_pelajaran: text('tahun_pelajaran').notNull(),
  jumlah_rombel: integer('jumlah_rombel').notNull().default(0),
  kuota_per_rombel: integer('kuota_per_rombel').notNull().default(28),
  ...timestamps,
}, (table) => ({
  sdtSchoolIdx: index('idx_sdt_school_id').on(table.school_id),
}))

// ============================================================
// SPMB / PPDB — PENDAFTAR
// ============================================================

export const spmbPendaftar = sqliteTable('spmb_pendaftar', {
  ...id,
  school_id: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  tahun_pelajaran: text('tahun_pelajaran').notNull(),
  no_pendaftaran: text('no_pendaftaran').notNull().unique(),
  nik: text('nik').notNull(),
  nama_lengkap: text('nama_lengkap').notNull(),
  jenis_kelamin: text('jenis_kelamin').notNull().default('laki-laki'),
  tempat_lahir: text('tempat_lahir'),
  tanggal_lahir: text('tanggal_lahir').notNull(),
  usia: integer('usia').default(0),
  alamat: text('alamat'),
  desa: text('desa'),
  asal_tk_paud: text('asal_tk_paud'),
  nama_orang_tua: text('nama_orang_tua'),
  no_hp: text('no_hp'),
  jalur: text('jalur').notNull().default('domisili'),
  status_seleksi: text('status_seleksi').notNull().default('pending'),
  status_kk: text('status_kk').notNull().default('belum'),
  status_akta: text('status_akta').notNull().default('belum'),
  status_dokumen_tambahan: text('status_dokumen_tambahan').notNull().default('belum'),
  status_dokumen_afirmasi: text('status_dokumen_afirmasi').notNull().default('belum'),
  status_dokumen_mutasi: text('status_dokumen_mutasi').notNull().default('belum'),
  catatan_verifikasi: text('catatan_verifikasi'),
  file_kk_url: text('file_kk_url'),
  file_akta_url: text('file_akta_url'),
  file_afirmasi_url: text('file_afirmasi_url'),
  file_mutasi_url: text('file_mutasi_url'),
  verified_by: text('verified_by'),
  verified_at: integer('verified_at'),
  ...timestamps,
}, (table) => ({
  spSchoolIdx: index('idx_sp_school_id').on(table.school_id),
  spNikIdx: index('idx_sp_nik').on(table.nik),
  spNoDaftarIdx: index('idx_sp_no_pendaftaran').on(table.no_pendaftaran),
  spStatusIdx: index('idx_sp_status_seleksi').on(table.status_seleksi),
}))

// ============================================================
// TRANSITIONS (SD -> SMP)
// ============================================================

export const transitions = sqliteTable('transitions', {
  ...id,
  school_id: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  student_id: text('student_id').references(() => students.id, { onDelete: 'set null' }),
  tahun_pelajaran: text('tahun_pelajaran').notNull(),
  nama: text('nama').notNull(),
  nisn: text('nisn'),
  jenis_kelamin: text('jenis_kelamin'),
  kelas: text('kelas').notNull(),
  status_transisi: text('status_transisi').notNull().default('calon_masuk'),
  smp_tujuan: text('smp_tujuan'),
  kesiapan: text('kesiapan'),
  kegiatan_transisi: text('kegiatan_transisi'),
  keterangan: text('keterangan'),
  ...timestamps,
}, (table) => ({
  transSchoolIdx: index('idx_trans_school_id').on(table.school_id),
  transStudentIdx: index('idx_trans_student_id').on(table.student_id),
}))

// ============================================================
// ARSIP DIGITAL
// ============================================================

export const arsipDigital = sqliteTable('arsip_digital', {
  ...id,
  ref_id: text('ref_id'),
  employee_id: text('employee_id').references(() => employees.id, { onDelete: 'set null' }),
  school_id: text('school_id').references(() => schools.id, { onDelete: 'set null' }),
  module_type: text('module_type').notNull(),
  category: text('category').notNull(),
  document_type: text('document_type').notNull(),
  file_name: text('file_name').notNull(),
  file_type: text('file_type').notNull(),
  file_size: integer('file_size').notNull(),
  storage: text('storage').notNull().default('blob'),
  storage_path: text('storage_path'),
  file_url: text('file_url'),
  drive_file_id: text('drive_file_id'),
  drive_url: text('drive_url'),
  uploaded_by: text('uploaded_by'),
  deskripsi: text('deskripsi'),
  uploaded_at: integer('uploaded_at').notNull().$defaultFn(() => Date.now()),
  ...timestamps,
}, (table) => ({
  arsipSchoolIdx: index('idx_arsip_school_id').on(table.school_id),
  arsipEmployeeIdx: index('idx_arsip_employee_id').on(table.employee_id),
  arsipModuleIdx: index('idx_arsip_module_type').on(table.module_type),
}))

// ============================================================
// VILLAGES
// ============================================================

export const villages = sqliteTable('villages', {
  ...id,
  nama: text('nama').notNull(),
  kecamatan: text('kecamatan').notNull(),
  ...timestamps,
}, (table) => ({
  villagesKecamatanIdx: index('idx_villages_kecamatan').on(table.kecamatan),
}))

// ============================================================
// SUBJECTS
// ============================================================

export const subjects = sqliteTable('subjects', {
  ...id,
  nama: text('nama').notNull(),
  jenjang: text('jenjang'),
  ...timestamps,
})

// ============================================================
// CLASSES
// ============================================================

export const classes = sqliteTable('classes', {
  ...id,
  school_id: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  nama_kelas: text('nama_kelas').notNull(),
  jenjang: text('jenjang'),
  tingkat: text('tingkat'),
  wali_kelas_id: text('wali_kelas_id').references(() => employees.id, { onDelete: 'set null' }),
  tahun_pelajaran: text('tahun_pelajaran'),
  kapasitas: integer('kapasitas').default(0),
  jumlah_siswa: integer('jumlah_siswa').default(0),
  jumlah_laki: integer('jumlah_laki'),
  jumlah_perempuan: integer('jumlah_perempuan'),
  ...timestamps,
}, (table) => ({
  classesSchoolIdx: index('idx_classes_school_id').on(table.school_id),
  classesWaliKelasIdx: index('idx_classes_wali_kelas_id').on(table.wali_kelas_id),
  classesTpJenjangIdx: index('idx_classes_tp_jenjang').on(table.tahun_pelajaran, table.jenjang),
}))

// ============================================================
// CERTIFICATIONS
// ============================================================

export const certifications = sqliteTable('certifications', {
  ...id,
  teacher_id: text('teacher_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  jenis_sertifikasi: text('jenis_sertifikasi').notNull(),
  nomor_sertifikat: text('nomor_sertifikat'),
  tahun_sertifikasi: integer('tahun_sertifikasi'),
  penerbit: text('penerbit'),
  status: text('status').notNull().default('submission'),
  file_url: text('file_url'),
  catatan: text('catatan'),
  ...timestamps,
}, (table) => ({
  certTeacherIdx: index('idx_cert_teacher_id').on(table.teacher_id),
  certStatusIdx: index('idx_cert_status').on(table.status),
}))

// ============================================================
// TEACHER MUTATIONS
// ============================================================

export const teacherMutations = sqliteTable('teacher_mutations', {
  ...id,
  teacher_id: text('teacher_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  sekolah_asal: text('sekolah_asal'),
  sekolah_tujuan: text('sekolah_tujuan'),
  tanggal_mutasi: text('tanggal_mutasi').notNull(),
  jenis_mutasi: text('jenis_mutasi').notNull(),
  alasan: text('alasan'),
  keterangan: text('keterangan'),
  ...timestamps,
}, (table) => ({
  tmTeacherIdx: index('idx_tm_teacher_id').on(table.teacher_id),
}))

// ============================================================
// ALERTS
// ============================================================

export const alerts = sqliteTable('alerts', {
  ...id,
  type: text('type').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  related_school_id: text('related_school_id').references(() => schools.id, { onDelete: 'set null' }),
  related_teacher_id: text('related_teacher_id').references(() => employees.id, { onDelete: 'set null' }),
  is_read: integer('is_read').notNull().default(0),
  ...timestamps,
}, (table) => ({
  alertsTypeIdx: index('idx_alerts_type').on(table.type),
  alertsSchoolIdx: index('idx_alerts_school').on(table.related_school_id),
}))

// ============================================================
// AUDIT LOGS
// ============================================================

export const auditLogs = sqliteTable('audit_logs', {
  ...id,
  user_id: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  entity_type: text('entity_type').notNull(),
  entity_id: text('entity_id'),
  old_values: text('old_values'),
  new_values: text('new_values'),
  ip_address: text('ip_address'),
  created_at: integer('created_at').notNull().$defaultFn(() => Date.now()),
}, (table) => ({
  auditUserIdIdx: index('idx_audit_user_id').on(table.user_id),
  auditCreatedAtIdx: index('idx_audit_created_at').on(table.created_at),
  auditEntityIdx: index('idx_audit_entity').on(table.entity_type, table.entity_id),
}))

// ============================================================
// RE-EXPORT ORIGINAL SCHEMA
// ============================================================

export * from './schema'
