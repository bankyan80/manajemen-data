import 'dotenv/config'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { db } from '../lib/db'
import {
  users, schools, employees, employeeDocuments,
  studentRecaps, reports, settings, activityLogs, notifications,
} from './schema'

async function main() {
  if (!db) {
    console.error('Database not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.')
    process.exit(1)
  }
  console.log('Seeding database...')

  const now = Date.now()
  const month = 60 * 60 * 24 * 30 * 1000

  // ============================================================
  // SCHOOLS
  // ============================================================
  const school = {
    sdn1: crypto.randomUUID(),
    sdn2: crypto.randomUUID(),
    sdn3: crypto.randomUUID(),
    sdn4: crypto.randomUUID(),
    paudMelati: crypto.randomUUID(),
    tkHarapan: crypto.randomUUID(),
    kbCerdas: crypto.randomUUID(),
  }

  await db.insert(schools).values([
    { id: school.sdn1, nama: 'SDN 1 Sukamaju', npsn: '20210001', jenjang: 'SD', status: 'Negeri', alamat: 'Jl. Raya Sukamaju No. 1', desa: 'Sukamaju', kecamatan: 'Lemahabang' },
    { id: school.sdn2, nama: 'SDN 2 Sukamaju', npsn: '20210002', jenjang: 'SD', status: 'Negeri', alamat: 'Jl. Merdeka No. 10', desa: 'Sukamaju', kecamatan: 'Lemahabang' },
    { id: school.sdn3, nama: 'SDN 3 Sukamaju', npsn: '20210003', jenjang: 'SD', status: 'Negeri', alamat: 'Jl. Pendidikan No. 5', desa: 'Sukamaju', kecamatan: 'Lemahabang' },
    { id: school.sdn4, nama: 'SDN 4 Sukamaju', npsn: '20210004', jenjang: 'SD', status: 'Negeri', alamat: 'Jl. Pelajar No. 7', desa: 'Sukamaju', kecamatan: 'Lemahabang' },
    { id: school.paudMelati, nama: 'PAUD Melati', npsn: '20220001', jenjang: 'PAUD', status: 'Swasta', alamat: 'Jl. Bunga No. 3', desa: 'Sukamaju', kecamatan: 'Lemahabang' },
    { id: school.tkHarapan, nama: 'TK Harapan Bunda', npsn: '20220002', jenjang: 'PAUD', status: 'Swasta', alamat: 'Jl. Kasih Ibu No. 2', desa: 'Sukamaju', kecamatan: 'Lemahabang' },
    { id: school.kbCerdas, nama: 'KB Cerdas Ceria', npsn: '20220003', jenjang: 'PAUD', status: 'Swasta', alamat: 'Jl. Ceria No. 8', desa: 'Sukamaju', kecamatan: 'Lemahabang' },
  ])

  console.log('  ✓ Schools seeded')

  // ============================================================
  // EMPLOYEES
  // ============================================================
  const emp = {
    dedi: crypto.randomUUID(),
    siti: crypto.randomUUID(),
    agus: crypto.randomUUID(),
    rina: crypto.randomUUID(),
    bambang: crypto.randomUUID(),
  }

  await db.insert(employees).values([
    { id: emp.dedi, sekolah_id: school.sdn1, nama: 'Dedi Kurniawan, S.Pd.', nik: '3273010101900001', nip: '198001012005011001', nuptk: '1234567890123456', email: 'dedi.kurniawan@sdnsatu.sch.id', no_hp: '081234567890', tempat_lahir: 'Cirebon', tanggal_lahir: '1980-01-01', jenis_kelamin: 'laki-laki', jabatan: 'Kepala Sekolah', status_pegawai: 'pns', pangkat_golongan: 'IV/a', pendidikan_terakhir: 'S1', jurusan: 'Pendidikan Matematika', sertifikasi: 'sudah', tmt_kerja: '2005-01-01', tanggal_bup: '2035-01-01' },
    { id: emp.siti, sekolah_id: school.sdn1, nama: 'Siti Nurhayati, S.Pd.', nik: '3273020202900002', nip: '198502102010012002', nuptk: '2345678901234567', email: 'siti.nurhayati@sdnsatu.sch.id', no_hp: '081234567891', tempat_lahir: 'Cirebon', tanggal_lahir: '1985-02-10', jenis_kelamin: 'perempuan', jabatan: 'Guru', status_pegawai: 'pns', pangkat_golongan: 'III/b', pendidikan_terakhir: 'S1', jurusan: 'Pendidikan Bahasa Indonesia', sertifikasi: 'sudah', tmt_kerja: '2010-01-01', tanggal_bup: '2040-02-10' },
    { id: emp.agus, sekolah_id: school.sdn2, nama: 'Agus Setiawan, S.Pd.', nik: '3273030303900003', nip: '198703152011011003', nuptk: '3456789012345678', email: 'agus.setiawan@sdndua.sch.id', no_hp: '081234567892', tempat_lahir: 'Cirebon', tanggal_lahir: '1987-03-15', jenis_kelamin: 'laki-laki', jabatan: 'Guru', status_pegawai: 'pppk', pangkat_golongan: 'IX', pendidikan_terakhir: 'S1', jurusan: 'Pendidikan IPA', sertifikasi: 'belum', tmt_kerja: '2020-01-01', tanggal_bup: '2042-03-15' },
    { id: emp.rina, sekolah_id: school.paudMelati, nama: 'Rina Febriani, S.Pd.', nik: '3273040404900004', nip: '199004202015012004', email: 'rina.febriani@paudmelati.sch.id', no_hp: '081234567893', tempat_lahir: 'Cirebon', tanggal_lahir: '1990-04-20', jenis_kelamin: 'perempuan', jabatan: 'Guru', status_pegawai: 'non_asn', pendidikan_terakhir: 'S1', jurusan: 'PAUD', sertifikasi: 'sudah', tmt_kerja: '2015-01-01', tanggal_bup: '2045-04-20' },
    { id: emp.bambang, sekolah_id: school.sdn2, nama: 'Bambang Supriyadi, S.Pd.', nik: '3273050505900005', nip: '198205052005012002', nuptk: '4567890123456789', email: 'bambang.supriyadi@sdndua.sch.id', no_hp: '081234567894', tempat_lahir: 'Cirebon', tanggal_lahir: '1982-05-05', jenis_kelamin: 'laki-laki', jabatan: 'Kepala Sekolah', status_pegawai: 'pns', pangkat_golongan: 'IV/b', pendidikan_terakhir: 'S1', jurusan: 'Manajemen Pendidikan', sertifikasi: 'sudah', tmt_kerja: '2005-01-01', tanggal_bup: '2037-05-05' },
  ])

  console.log('  ✓ Employees seeded')

  // ============================================================
  // USERS
  // ============================================================
  const hash = (pw: string) => bcrypt.hashSync(pw, 10)
  const pw_admin = hash('admin456')
  const pw_operator1 = hash('sp20210001')
  const pw_operator2 = hash('sp20210002')
  const pw_operator3 = hash('sp20210003')
  const pw_operator4 = hash('sp20210004')
  const pw_operator5 = hash('sp20220001')
  const pw_operator6 = hash('sp20220002')
  const pw_operator7 = hash('sp20220003')
  const pw_pegawai1 = hash('011001')
  const pw_pegawai2 = hash('012002')
  const pw_pegawai3 = hash('011003')
  const pw_pegawai4 = hash('040004')
  const pw_pegawai5 = hash('012002')

  const usr = {
    admin: crypto.randomUUID(),
    operator1: crypto.randomUUID(),
    operator2: crypto.randomUUID(),
    operator3: crypto.randomUUID(),
    operator4: crypto.randomUUID(),
    operator5: crypto.randomUUID(),
    operator6: crypto.randomUUID(),
    operator7: crypto.randomUUID(),
    pegawai1: crypto.randomUUID(),
    pegawai2: crypto.randomUUID(),
    pegawai3: crypto.randomUUID(),
    pegawai4: crypto.randomUUID(),
    pegawai5: crypto.randomUUID(),
  }

  await db.insert(users).values([
    { id: usr.admin, name: 'Admin Kecamatan', username: 'admin_Tim', password: pw_admin, email: 'admin.kecamatan@gmail.com', role: 'admin_kecamatan' },
    { id: usr.operator1, name: 'Operator SDN 1 Sukamaju', username: '20210001', password: pw_operator1, email: 'operator.sdn1@gmail.com', role: 'operator_sekolah', sekolah_id: school.sdn1 },
    { id: usr.operator2, name: 'Operator SDN 2 Sukamaju', username: '20210002', password: pw_operator2, email: 'operator.sdn2@gmail.com', role: 'operator_sekolah', sekolah_id: school.sdn2 },
    { id: usr.operator3, name: 'Operator SDN 3 Sukamaju', username: '20210003', password: pw_operator3, email: 'operator.sdn3@gmail.com', role: 'operator_sekolah', sekolah_id: school.sdn3 },
    { id: usr.operator4, name: 'Operator SDN 4 Sukamaju', username: '20210004', password: pw_operator4, email: 'operator.sdn4@gmail.com', role: 'operator_sekolah', sekolah_id: school.sdn4 },
    { id: usr.operator5, name: 'Operator PAUD Melati', username: '20220001', password: pw_operator5, email: 'operator.paudmelati@gmail.com', role: 'operator_sekolah', sekolah_id: school.paudMelati },
    { id: usr.operator6, name: 'Operator TK Harapan Bunda', username: '20220002', password: pw_operator6, email: 'operator.tkharapan@gmail.com', role: 'operator_sekolah', sekolah_id: school.tkHarapan },
    { id: usr.operator7, name: 'Operator KB Cerdas Ceria', username: '20220003', password: pw_operator7, email: 'operator.kbcerdas@gmail.com', role: 'operator_sekolah', sekolah_id: school.kbCerdas },
    { id: usr.pegawai1, name: 'Dedi Kurniawan, S.Pd.', username: '198001012005011001', password: pw_pegawai1, email: 'dedi.kurniawan@sdnsatu.sch.id', role: 'pegawai', sekolah_id: school.sdn1, pegawai_id: emp.dedi },
    { id: usr.pegawai2, name: 'Siti Nurhayati, S.Pd.', username: '198502102010012002', password: pw_pegawai2, email: 'siti.nurhayati@sdnsatu.sch.id', role: 'pegawai', sekolah_id: school.sdn1, pegawai_id: emp.siti },
    { id: usr.pegawai3, name: 'Agus Setiawan, S.Pd.', username: '198703152011011003', password: pw_pegawai3, email: 'agus.setiawan@sdndua.sch.id', role: 'pegawai', sekolah_id: school.sdn2, pegawai_id: emp.agus },
    { id: usr.pegawai4, name: 'Rina Febriani, S.Pd.', username: '199004202015012004', password: pw_pegawai4, email: 'rina.febriani@paudmelati.sch.id', role: 'pegawai', sekolah_id: school.paudMelati, pegawai_id: emp.rina },
    { id: usr.pegawai5, name: 'Bambang Supriyadi, S.Pd.', username: '198205052005012002', password: pw_pegawai5, email: 'bambang.supriyadi@sdndua.sch.id', role: 'pegawai', sekolah_id: school.sdn2, pegawai_id: emp.bambang },
  ])

  console.log('  ✓ Users seeded')

  const usr_admin = usr.admin
  const usr_operator = usr.operator1
  const usr_pegawai = usr.pegawai1

  // ============================================================
  // UPDATE SCHOOLS WITH KEPALA SEKOLAH
  // ============================================================
  await db.update(schools).set({ kepala_id: emp.dedi }).where(eq(schools.id, school.sdn1))
  await db.update(schools).set({ kepala_id: emp.bambang }).where(eq(schools.id, school.sdn2))

  // ============================================================
  // EMPLOYEE DOCUMENTS
  // ============================================================
  await db.insert(employeeDocuments).values([
    { id: crypto.randomUUID(), employee_id: emp.dedi, school_id: school.sdn1, kategori: 'kepegawaian', jenis_dokumen: 'Ijazah S1', nama_file: 'ijazah_dedi.pdf', mime_type: 'application/pdf', file_size: 512000, drive_file_id: '1abc123', drive_url: 'https://drive.google.com/d/1abc123', status_upload: 'sudah_diupload', status_verifikasi: 'sudah_diverifikasi', status_kelengkapan: 'lengkap',     uploaded_by: usr_pegawai, verified_by: usr_admin, uploaded_at: now - month * 2, verified_at: now - month * 2 },
    { id: crypto.randomUUID(), employee_id: emp.dedi, school_id: school.sdn1, kategori: 'kepegawaian', jenis_dokumen: 'Sertifikat Pendidik', nama_file: 'sertifikat_dedi.pdf', mime_type: 'application/pdf', file_size: 256000, drive_file_id: '1def456', drive_url: 'https://drive.google.com/d/1def456', status_upload: 'sudah_diupload', status_verifikasi: 'sudah_diverifikasi', status_kelengkapan: 'lengkap',     uploaded_by: usr_pegawai, verified_by: usr_admin, uploaded_at: now - month * 2, verified_at: now - month * 2 },
    { id: crypto.randomUUID(), employee_id: emp.dedi, school_id: school.sdn1, kategori: 'kepegawaian', jenis_dokumen: 'SK Pengangkatan CPNS', nama_file: 'sk_cpns_dedi.pdf', mime_type: 'application/pdf', file_size: 384000, drive_file_id: '1ghi789', drive_url: 'https://drive.google.com/d/1ghi789', status_upload: 'sudah_diupload', status_verifikasi: 'sudah_diverifikasi', status_kelengkapan: 'lengkap',     uploaded_by: usr_pegawai, verified_by: usr_admin, uploaded_at: now - month * 2, verified_at: now - month * 2 },
    { id: crypto.randomUUID(), employee_id: emp.siti, school_id: school.sdn1, kategori: 'kepegawaian', jenis_dokumen: 'Ijazah S1', nama_file: 'ijazah_siti.pdf', mime_type: 'application/pdf', file_size: 480000, drive_file_id: '1jkl012', drive_url: 'https://drive.google.com/d/1jkl012', status_upload: 'sudah_diupload', status_verifikasi: 'sudah_diverifikasi', status_kelengkapan: 'lengkap', uploaded_by: usr_operator, verified_by: usr_admin, uploaded_at: now - month, verified_at: now - month },
    { id: crypto.randomUUID(), employee_id: emp.siti, school_id: school.sdn1, kategori: 'kepegawaian', jenis_dokumen: 'Sertifikat Pendidik', nama_file: 'sertifikat_siti.pdf', mime_type: 'application/pdf', file_size: 192000, drive_file_id: '1mno345', drive_url: 'https://drive.google.com/d/1mno345', status_upload: 'sudah_diupload', status_verifikasi: 'belum_diverifikasi', status_kelengkapan: 'belum_lengkap', catatan_revisi: 'File tidak jelas, harap upload ulang', uploaded_by: usr_operator, uploaded_at: now - month },
    { id: crypto.randomUUID(), employee_id: emp.agus, school_id: school.sdn2, kategori: 'kepegawaian', jenis_dokumen: 'Ijazah S1', nama_file: 'ijazah_agus.pdf', mime_type: 'application/pdf', file_size: 512000, drive_file_id: '1pqr678', drive_url: 'https://drive.google.com/d/1pqr678', status_upload: 'sudah_diupload', status_verifikasi: 'sudah_diverifikasi', status_kelengkapan: 'lengkap',     uploaded_by: usr_pegawai, verified_by: usr_admin, uploaded_at: now - month * 3, verified_at: now - month * 3 },
    { id: crypto.randomUUID(), employee_id: emp.agus, school_id: school.sdn2, kategori: 'kepegawaian', jenis_dokumen: 'SK Pengangkatan', nama_file: 'sk_agus.pdf', mime_type: 'application/pdf', file_size: 320000, drive_file_id: '1stu901', drive_url: 'https://drive.google.com/d/1stu901', status_upload: 'sudah_diupload', status_verifikasi: 'belum_diverifikasi', status_kelengkapan: 'belum_lengkap', uploaded_by: usr_pegawai, uploaded_at: now - month },
    { id: crypto.randomUUID(), employee_id: emp.rina, school_id: school.paudMelati, kategori: 'kepegawaian', jenis_dokumen: 'Ijazah S1', nama_file: 'ijazah_rina.pdf', mime_type: 'application/pdf', file_size: 448000, drive_file_id: '1vwx234', drive_url: 'https://drive.google.com/d/1vwx234', status_upload: 'sudah_diupload', status_verifikasi: 'sudah_diverifikasi', status_kelengkapan: 'lengkap',     uploaded_by: usr_pegawai, verified_by: usr_admin, uploaded_at: now - month * 4, verified_at: now - month * 4 },
    { id: crypto.randomUUID(), employee_id: emp.rina, school_id: school.paudMelati, kategori: 'kepegawaian', jenis_dokumen: 'SK Yayasan', nama_file: 'sk_yayasan_rina.pdf', mime_type: 'application/pdf', file_size: 224000, drive_file_id: '1yza567', drive_url: 'https://drive.google.com/d/1yza567', status_upload: 'sudah_diupload', status_verifikasi: 'belum_diverifikasi', status_kelengkapan: 'belum_lengkap', uploaded_by: usr_operator, uploaded_at: now - month },
    { id: crypto.randomUUID(), employee_id: emp.bambang, school_id: school.sdn2, kategori: 'kepegawaian', jenis_dokumen: 'Ijazah S1', nama_file: 'ijazah_bambang.pdf', mime_type: 'application/pdf', file_size: 512000, drive_file_id: '1bcd890', drive_url: 'https://drive.google.com/d/1bcd890', status_upload: 'sudah_diupload', status_verifikasi: 'sudah_diverifikasi', status_kelengkapan: 'lengkap',     uploaded_by: usr_pegawai, verified_by: usr_admin, uploaded_at: now - month * 6, verified_at: now - month * 6 },
    { id: crypto.randomUUID(), employee_id: emp.bambang, school_id: school.sdn2, kategori: 'kepegawaian', jenis_dokumen: 'SK Pengangkatan Kepala Sekolah', nama_file: '', mime_type: 'application/pdf', file_size: 0, drive_file_id: '', drive_url: '', status_upload: 'belum_diupload', status_verifikasi: 'belum_diverifikasi', status_kelengkapan: 'belum_lengkap' },
    { id: crypto.randomUUID(), employee_id: emp.bambang, school_id: school.sdn2, kategori: 'kepegawaian', jenis_dokumen: 'Sertifikat Pendidik', nama_file: 'sertifikat_bambang.pdf', mime_type: 'application/pdf', file_size: 256000, drive_file_id: '1efg123', drive_url: 'https://drive.google.com/d/1efg123', status_upload: 'sudah_diupload', status_verifikasi: 'sudah_diverifikasi', status_kelengkapan: 'lengkap',     uploaded_by: usr_pegawai, verified_by: usr_admin, uploaded_at: now - month * 6, verified_at: now - month * 6 },
  ])

  console.log('  ✓ Employee documents seeded')

  // ============================================================
  // STUDENT RECAPS
  // ============================================================
  await db.insert(studentRecaps).values([
    { id: crypto.randomUUID(), school_id: school.sdn1, tahun_pelajaran: '2025/2026', semester: 'genap', kelas_kelompok: 'Kelas 1', laki_laki: 15, perempuan: 12, total: 27, siswa_masuk: 27, siswa_keluar: 0 },
    { id: crypto.randomUUID(), school_id: school.sdn1, tahun_pelajaran: '2025/2026', semester: 'genap', kelas_kelompok: 'Kelas 2', laki_laki: 14, perempuan: 13, total: 27, siswa_masuk: 2, siswa_keluar: 1 },
    { id: crypto.randomUUID(), school_id: school.sdn1, tahun_pelajaran: '2025/2026', semester: 'genap', kelas_kelompok: 'Kelas 3', laki_laki: 13, perempuan: 14, total: 27, siswa_masuk: 1, siswa_keluar: 2 },
    { id: crypto.randomUUID(), school_id: school.sdn1, tahun_pelajaran: '2025/2026', semester: 'genap', kelas_kelompok: 'Kelas 4', laki_laki: 16, perempuan: 11, total: 27, siswa_masuk: 3, siswa_keluar: 0 },
    { id: crypto.randomUUID(), school_id: school.sdn1, tahun_pelajaran: '2025/2026', semester: 'genap', kelas_kelompok: 'Kelas 5', laki_laki: 12, perempuan: 15, total: 27, siswa_masuk: 0, siswa_keluar: 1 },
    { id: crypto.randomUUID(), school_id: school.sdn1, tahun_pelajaran: '2025/2026', semester: 'genap', kelas_kelompok: 'Kelas 6', laki_laki: 14, perempuan: 13, total: 27, siswa_masuk: 0, siswa_keluar: 3 },
    { id: crypto.randomUUID(), school_id: school.paudMelati, tahun_pelajaran: '2025/2026', semester: 'genap', kelas_kelompok: 'Kelompok A', laki_laki: 8, perempuan: 7, total: 15, siswa_masuk: 15, siswa_keluar: 0 },
    { id: crypto.randomUUID(), school_id: school.paudMelati, tahun_pelajaran: '2025/2026', semester: 'genap', kelas_kelompok: 'Kelompok B', laki_laki: 9, perempuan: 6, total: 15, siswa_masuk: 2, siswa_keluar: 1 },
  ])

  console.log('  ✓ Student recaps seeded')

  // ============================================================
  // REPORTS
  // ============================================================
  await db.insert(reports).values([
    { id: crypto.randomUUID(), school_id: school.sdn1, periode_bulan: 1, tahun: 2026, jenis_laporan: 'laporan_bulanan', status: 'draft', submitted_by: usr_operator },
    { id: crypto.randomUUID(), school_id: school.sdn1, periode_bulan: 2, tahun: 2026, jenis_laporan: 'laporan_bulanan', status: 'submitted', submitted_by: usr_operator, submitted_at: now - 7 * 24 * 60 * 60 * 1000 },
    { id: crypto.randomUUID(), school_id: school.sdn1, periode_bulan: 3, tahun: 2026, jenis_laporan: 'laporan_bulanan', status: 'draft', submitted_by: usr_operator },
    { id: crypto.randomUUID(), school_id: school.sdn2, periode_bulan: 1, tahun: 2026, jenis_laporan: 'laporan_bulanan', status: 'verified', submitted_by: usr_operator, verified_by: usr_admin, submitted_at: now - 14 * 24 * 60 * 60 * 1000, verified_at: now - 10 * 24 * 60 * 60 * 1000 },
    { id: crypto.randomUUID(), school_id: school.sdn2, periode_bulan: 2, tahun: 2026, jenis_laporan: 'laporan_bulanan', status: 'submitted', submitted_by: usr_operator, submitted_at: now - 3 * 24 * 60 * 60 * 1000 },
    { id: crypto.randomUUID(), school_id: school.paudMelati, periode_bulan: 1, tahun: 2026, jenis_laporan: 'laporan_bulanan', status: 'draft', submitted_by: usr_operator },
    { id: crypto.randomUUID(), school_id: school.paudMelati, periode_bulan: 2, tahun: 2026, jenis_laporan: 'laporan_bulanan', status: 'rejected', submitted_by: usr_operator, verified_by: usr_admin, submitted_at: now - 5 * 24 * 60 * 60 * 1000, verified_at: now - 3 * 24 * 60 * 60 * 1000, catatan_revisi: 'Data siswa tidak lengkap, harap lengkapi' },
  ])

  console.log('  ✓ Reports seeded')

  // ============================================================
  // SETTINGS
  // ============================================================
  await db.insert(settings).values([
    { id: crypto.randomUUID(), key: 'tahun_pelajaran', value: '2025/2026' },
    { id: crypto.randomUUID(), key: 'semester', value: 'genap' },
    { id: crypto.randomUUID(), key: 'nama_kecamatan', value: 'Lemahabang' },
    { id: crypto.randomUUID(), key: 'kabupaten', value: 'Cirebon' },
    { id: crypto.randomUUID(), key: 'logo_kecamatan', value: '' },
    { id: crypto.randomUUID(), key: 'alamat_kecamatan', value: 'Jl. Raya Lemahabang No. 1, Cirebon' },
  ])

  console.log('  ✓ Settings seeded')

  // ============================================================
  // ACTIVITY LOGS
  // ============================================================
  await db.insert(activityLogs).values([
    { id: crypto.randomUUID(), user_id: usr_admin, action: 'login', table_name: 'users', record_id: usr_admin, description: 'Admin Kecamatan login ke sistem', created_at: now - 30 * 24 * 60 * 60 * 1000 },
    { id: crypto.randomUUID(), user_id: usr_admin, action: 'create', table_name: 'schools', record_id: school.sdn1, description: 'Menambahkan sekolah baru: SDN 1 Sukamaju', created_at: now - 30 * 24 * 60 * 60 * 1000 },
    { id: crypto.randomUUID(), user_id: usr_admin, action: 'create', table_name: 'schools', record_id: school.sdn2, description: 'Menambahkan sekolah baru: SDN 2 Sukamaju', created_at: now - 30 * 24 * 60 * 60 * 1000 },
    { id: crypto.randomUUID(), user_id: usr_admin, action: 'create', table_name: 'employees', record_id: emp.dedi, description: 'Menambahkan pegawai: Dedi Kurniawan', created_at: now - 25 * 24 * 60 * 60 * 1000 },
    { id: crypto.randomUUID(), user_id: usr_operator, action: 'update', table_name: 'employee_documents', record_id: null, description: 'Mengupload dokumen pegawai Dedi Kurniawan', created_at: now - 20 * 24 * 60 * 60 * 1000 },
    { id: crypto.randomUUID(), user_id: usr_admin, action: 'verify', table_name: 'employee_documents', record_id: null, description: 'Memverifikasi dokumen pegawai Dedi Kurniawan', created_at: now - 20 * 24 * 60 * 60 * 1000 },
    { id: crypto.randomUUID(), user_id: usr_operator, action: 'submit', table_name: 'reports', record_id: null, description: 'Mengirim laporan bulanan SDN 1 Sukamaju', created_at: now - 7 * 24 * 60 * 60 * 1000 },
    { id: crypto.randomUUID(), user_id: usr_admin, action: 'verify', table_name: 'reports', record_id: null, description: 'Menyetujui laporan bulanan SDN 2 Sukamaju', created_at: now - 10 * 24 * 60 * 60 * 1000 },
    { id: crypto.randomUUID(), user_id: usr_operator, action: 'login', table_name: 'users', record_id: usr_operator, description: 'Operator login ke sistem', created_at: now - 1 * 24 * 60 * 60 * 1000 },
    { id: crypto.randomUUID(), user_id: usr_admin, action: 'login', table_name: 'users', record_id: usr_admin, description: 'Admin Kecamatan login ke sistem', created_at: now },
  ])

  console.log('  ✓ Activity logs seeded')

  // ============================================================
  // NOTIFICATIONS
  // ============================================================
  await db.insert(notifications).values([
    { id: crypto.randomUUID(), user_id: usr_admin, type: 'info', title: 'Laporan Baru', description: 'SDN 1 Sukamaju telah mengirim laporan bulan Januari 2026', is_read: 0, related_link: '/reports', created_at: now - 7 * 24 * 60 * 60 * 1000 },
    { id: crypto.randomUUID(), user_id: usr_admin, type: 'warning', title: 'Dokumen Perlu Verifikasi', description: 'Terdapat 3 dokumen pegawai yang perlu diverifikasi', is_read: 0, related_link: '/verification', created_at: now - 3 * 24 * 60 * 60 * 1000 },
    { id: crypto.randomUUID(), user_id: usr_admin, type: 'success', title: 'Verifikasi Selesai', description: 'Laporan SDN 2 Sukamaju telah diverifikasi', is_read: 1, related_link: '/reports', created_at: now - 10 * 24 * 60 * 60 * 1000 },
    { id: crypto.randomUUID(), user_id: usr_operator, type: 'info', title: 'Tenggat Laporan', description: 'Laporan bulan Maret 2026 harus segera dikirim', is_read: 0, related_link: '/reports/create', created_at: now },
    { id: crypto.randomUUID(), user_id: usr_operator, type: 'error', title: 'Laporan Ditolak', description: 'Laporan PAUD Melati bulan Februari ditolak oleh Admin', is_read: 0, related_link: '/reports', created_at: now - 3 * 24 * 60 * 60 * 1000 },
    { id: crypto.randomUUID(), user_id: usr_pegawai, type: 'info', title: 'Dokumen Terverifikasi', description: 'Ijazah Anda telah diverifikasi oleh Admin Kecamatan', is_read: 1, related_link: '/documents', created_at: now - 20 * 24 * 60 * 60 * 1000 },
  ])

  console.log('  ✓ Notifications seeded')
  console.log('Seed completed successfully')
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
