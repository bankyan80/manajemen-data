/**
 * Script untuk membuat tabel baru yang belum ada di database Turso.
 * Hanya membuat tabel yang ada di schema-v2.ts tapi belum ada di DB.
 */
import { createClient } from '@libsql/client'
import 'dotenv/config'

const url = process.env.TURSO_DATABASE_URL
const token = process.env.TURSO_AUTH_TOKEN

if (!url || !token) {
  console.error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN')
  process.exit(1)
}

const client = createClient({ url, authToken: token })

async function tableExists(name: string): Promise<boolean> {
  const result = await client.execute(
    `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
    [name]
  )
  return result.rows.length > 0
}

const NEW_TABLES: { name: string; sql: string }[] = [
  {
    name: 'student_recaps',
    sql: `CREATE TABLE IF NOT EXISTS "student_recaps" (
      "id" text PRIMARY KEY NOT NULL,
      "school_id" text NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
      "tahun_pelajaran" text NOT NULL,
      "semester" text NOT NULL,
      "kelas_kelompok" text NOT NULL,
      "laki_laki" integer NOT NULL DEFAULT 0,
      "perempuan" integer NOT NULL DEFAULT 0,
      "total" integer NOT NULL DEFAULT 0,
      "siswa_masuk" integer NOT NULL DEFAULT 0,
      "siswa_keluar" integer NOT NULL DEFAULT 0,
      "keterangan" text,
      "created_at" integer NOT NULL,
      "updated_at" integer NOT NULL
    )`,
  },
  {
    name: 'activity_logs',
    sql: `CREATE TABLE IF NOT EXISTS "activity_logs" (
      "id" text PRIMARY KEY NOT NULL,
      "user_id" text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "action" text NOT NULL,
      "table_name" text NOT NULL,
      "record_id" text,
      "description" text,
      "created_at" integer NOT NULL
    )`,
  },
  {
    name: 'alerts',
    sql: `CREATE TABLE IF NOT EXISTS "alerts" (
      "id" text PRIMARY KEY NOT NULL,
      "type" text NOT NULL,
      "title" text NOT NULL,
      "description" text,
      "related_school_id" text REFERENCES schools(id) ON DELETE SET NULL,
      "related_teacher_id" text REFERENCES employees(id) ON DELETE SET NULL,
      "is_read" integer NOT NULL DEFAULT 0,
      "created_at" integer NOT NULL,
      "updated_at" integer NOT NULL
    )`,
  },
  {
    name: 'certifications',
    sql: `CREATE TABLE IF NOT EXISTS "certifications" (
      "id" text PRIMARY KEY NOT NULL,
      "teacher_id" text NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      "jenis_sertifikasi" text NOT NULL,
      "nomor_sertifikat" text,
      "tahun_sertifikasi" integer,
      "penerbit" text,
      "status" text NOT NULL DEFAULT 'submission',
      "file_url" text,
      "catatan" text,
      "created_at" integer NOT NULL,
      "updated_at" integer NOT NULL
    )`,
  },
  {
    name: 'ruang',
    sql: `CREATE TABLE IF NOT EXISTS "ruang" (
      "id" text PRIMARY KEY NOT NULL,
      "school_id" text NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
      "bangunan_id" text REFERENCES bangunan(id) ON DELETE SET NULL,
      "kode_ruang" text,
      "nama_ruang" text NOT NULL,
      "lantai_ke" integer DEFAULT 1,
      "panjang" real DEFAULT 0,
      "lebar" real DEFAULT 0,
      "kapasitas_siswa" integer DEFAULT 0,
      "kondisi_non_struktur" text,
      "jenis_ruang" text DEFAULT 'umum',
      "peruntukan_wc" text,
      "created_at" integer NOT NULL,
      "updated_at" integer NOT NULL
    )`,
  },
  {
    name: 'arsip_digital',
    sql: `CREATE TABLE IF NOT EXISTS "arsip_digital" (
      "id" text PRIMARY KEY NOT NULL,
      "ref_id" text,
      "employee_id" text REFERENCES employees(id) ON DELETE SET NULL,
      "school_id" text REFERENCES schools(id) ON DELETE SET NULL,
      "module_type" text NOT NULL,
      "category" text NOT NULL,
      "document_type" text NOT NULL,
      "file_name" text NOT NULL,
      "file_type" text NOT NULL,
      "file_size" integer NOT NULL,
      "storage" text NOT NULL DEFAULT 'blob',
      "storage_path" text,
      "file_url" text,
      "drive_file_id" text,
      "drive_url" text,
      "uploaded_by" text,
      "deskripsi" text,
      "uploaded_at" integer NOT NULL,
      "created_at" integer NOT NULL,
      "updated_at" integer NOT NULL
    )`,
  },
  { name: 'notifications', sql: `CREATE TABLE IF NOT EXISTS "notifications" ("id" text PRIMARY KEY NOT NULL, "user_id" text NOT NULL REFERENCES users(id) ON DELETE CASCADE, "type" text NOT NULL, "title" text NOT NULL, "description" text NOT NULL, "is_read" integer NOT NULL DEFAULT 0, "related_link" text, "created_at" integer NOT NULL)` },
  { name: 'alumni', sql: `CREATE TABLE IF NOT EXISTS "alumni" ("id" text PRIMARY KEY NOT NULL, "school_id" text NOT NULL REFERENCES schools(id) ON DELETE CASCADE, "tahun_lulus" text NOT NULL, "nama" text NOT NULL, "nisn" text, "nik" text, "jenis_kelamin" text, "tempat_lahir" text, "tanggal_lahir" text, "kelas" text NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL)` },
  { name: 'villages', sql: `CREATE TABLE IF NOT EXISTS "villages" ("id" text PRIMARY KEY NOT NULL, "nama" text NOT NULL, "kecamatan" text NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL)` },
  { name: 'subjects', sql: `CREATE TABLE IF NOT EXISTS "subjects" ("id" text PRIMARY KEY NOT NULL, "nama" text NOT NULL, "jenjang" text, "created_at" integer NOT NULL, "updated_at" integer NOT NULL)` },
  { name: 'classes', sql: `CREATE TABLE IF NOT EXISTS "classes" ("id" text PRIMARY KEY NOT NULL, "school_id" text NOT NULL REFERENCES schools(id) ON DELETE CASCADE, "nama_kelas" text NOT NULL, "jenjang" text, "tingkat" text, "wali_kelas_id" text REFERENCES employees(id) ON DELETE SET NULL, "tahun_pelajaran" text, "kapasitas" integer DEFAULT 0, "jumlah_siswa" integer DEFAULT 0, "created_at" integer NOT NULL, "updated_at" integer NOT NULL)` },
  { name: 'employee_documents', sql: `CREATE TABLE IF NOT EXISTS "employee_documents" ("id" text PRIMARY KEY NOT NULL, "employee_id" text NOT NULL REFERENCES employees(id) ON DELETE CASCADE, "school_id" text NOT NULL REFERENCES schools(id) ON DELETE CASCADE, "kategori" text NOT NULL, "jenis_dokumen" text NOT NULL, "nama_file" text NOT NULL, "mime_type" text NOT NULL, "file_size" integer NOT NULL, "drive_file_id" text NOT NULL, "drive_url" text NOT NULL, "status_upload" text NOT NULL DEFAULT 'belum_upload', "status_verifikasi" text NOT NULL DEFAULT 'belum_diverifikasi', "status_kelengkapan" text NOT NULL DEFAULT 'belum_lengkap', "catatan_revisi" text, "uploaded_by" text, "verified_by" text, "uploaded_at" integer, "verified_at" integer, "created_at" integer NOT NULL, "updated_at" integer NOT NULL)` },
  { name: 'tanah', sql: `CREATE TABLE IF NOT EXISTS "tanah" ("id" text PRIMARY KEY NOT NULL, "school_id" text NOT NULL REFERENCES schools(id) ON DELETE CASCADE, "nama_tanah" text NOT NULL, "nomor_sertifikat" text, "jenis_lahan" text NOT NULL DEFAULT 'induk', "panjang" real DEFAULT 0, "lebar" real DEFAULT 0, "luas" real DEFAULT 0, "status_kepemilikan" text NOT NULL DEFAULT 'milik_sendiri', "pemilik" text, "luas_siap_bangun" real DEFAULT 0, "created_at" integer NOT NULL, "updated_at" integer NOT NULL)` },
  { name: 'bangunan', sql: `CREATE TABLE IF NOT EXISTS "bangunan" ("id" text PRIMARY KEY NOT NULL, "school_id" text NOT NULL REFERENCES schools(id) ON DELETE CASCADE, "nama_gedung" text NOT NULL, "jenis_prasarana" text, "jumlah_lantai" integer DEFAULT 1, "panjang" real DEFAULT 0, "lebar" real DEFAULT 0, "luas_tapak" real DEFAULT 0, "tahun_dibangun" integer, "tahun_renovasi" integer, "nilai_perolehan" real DEFAULT 0, "kondisi_pondasi" integer DEFAULT 0, "kondisi_kolom" integer DEFAULT 0, "kondisi_balok" integer DEFAULT 0, "kondisi_pelat_lantai" integer DEFAULT 0, "kondisi_atap" integer DEFAULT 0, "keterangan" text, "created_at" integer NOT NULL, "updated_at" integer NOT NULL)` },
  { name: 'sub_ruang', sql: `CREATE TABLE IF NOT EXISTS "sub_ruang" ("id" text PRIMARY KEY NOT NULL, "ruang_id" text NOT NULL REFERENCES ruang(id) ON DELETE CASCADE, "nama" text NOT NULL, "jumlah" integer DEFAULT 1, "created_at" integer NOT NULL, "updated_at" integer NOT NULL)` },
  { name: 'buku', sql: `CREATE TABLE IF NOT EXISTS "buku" ("id" text PRIMARY KEY NOT NULL, "school_id" text NOT NULL REFERENCES schools(id) ON DELETE CASCADE, "jenis_buku" text NOT NULL, "jumlah_judul" integer DEFAULT 0, "jumlah_eksemplar" integer DEFAULT 0, "created_at" integer NOT NULL, "updated_at" integer NOT NULL)` },
  { name: 'reports', sql: `CREATE TABLE IF NOT EXISTS "reports" ("id" text PRIMARY KEY NOT NULL, "school_id" text NOT NULL REFERENCES schools(id) ON DELETE CASCADE, "periode_bulan" integer NOT NULL, "tahun" integer NOT NULL, "jenis_laporan" text NOT NULL, "status" text NOT NULL DEFAULT 'draft', "submitted_by" text, "verified_by" text, "submitted_at" integer, "verified_at" integer, "catatan_revisi" text, "created_at" integer NOT NULL, "updated_at" integer NOT NULL)` },
  { name: 'sarana', sql: `CREATE TABLE IF NOT EXISTS "sarana" ("id" text PRIMARY KEY NOT NULL, "school_id" text NOT NULL REFERENCES schools(id) ON DELETE CASCADE, "ruang_id" text REFERENCES ruang(id) ON DELETE SET NULL, "nama_sarana" text NOT NULL, "jenis" text NOT NULL DEFAULT 'alat', "jumlah" integer DEFAULT 0, "kondisi" text DEFAULT 'baik', "created_at" integer NOT NULL, "updated_at" integer NOT NULL)` },
  { name: 'settings', sql: `CREATE TABLE IF NOT EXISTS "settings" ("id" text PRIMARY KEY NOT NULL, "key" text NOT NULL UNIQUE, "value" text NOT NULL, "created_at" integer NOT NULL, "updated_at" integer NOT NULL)` },
  { name: 'teacher_mutations', sql: `CREATE TABLE IF NOT EXISTS "teacher_mutations" ("id" text PRIMARY KEY NOT NULL, "teacher_id" text NOT NULL REFERENCES employees(id) ON DELETE CASCADE, "sekolah_asal" text, "sekolah_tujuan" text, "tanggal_mutasi" text NOT NULL, "jenis_mutasi" text NOT NULL, "alasan" text, "keterangan" text, "created_at" integer NOT NULL, "updated_at" integer NOT NULL)` },
  { name: 'audit_logs', sql: `CREATE TABLE IF NOT EXISTS "audit_logs" ("id" text PRIMARY KEY NOT NULL, "user_id" text REFERENCES users(id) ON DELETE SET NULL, "action" text NOT NULL, "entity_type" text NOT NULL, "entity_id" text, "old_values" text, "new_values" text, "ip_address" text, "created_at" integer NOT NULL)` },
  { name: 'ppdb', sql: `CREATE TABLE IF NOT EXISTS "ppdb" ("id" text PRIMARY KEY NOT NULL, "school_id" text NOT NULL REFERENCES schools(id) ON DELETE CASCADE, "tahun_pelajaran" text NOT NULL, "daya_tampung" integer DEFAULT 0, "jumlah_pendaftar" integer DEFAULT 0, "jumlah_pendaftar_l" integer DEFAULT 0, "jumlah_pendaftar_p" integer DEFAULT 0, "jumlah_diterima" integer DEFAULT 0, "jumlah_diterima_l" integer DEFAULT 0, "jumlah_diterima_p" integer DEFAULT 0, "jalur_domisili" integer DEFAULT 0, "jalur_domisili_l" integer DEFAULT 0, "jalur_domisili_p" integer DEFAULT 0, "jalur_afirmasi" integer DEFAULT 0, "jalur_afirmasi_l" integer DEFAULT 0, "jalur_afirmasi_p" integer DEFAULT 0, "jalur_mutasi" integer DEFAULT 0, "jalur_mutasi_l" integer DEFAULT 0, "jalur_mutasi_p" integer DEFAULT 0, "rekap_usia" text, "rekap_usia_l" text, "rekap_usia_p" text, "kekurangan_kelebihan_kuota" integer DEFAULT 0, "created_at" integer NOT NULL, "updated_at" integer NOT NULL)` },
  { name: 'spmb_daya_tampung', sql: `CREATE TABLE IF NOT EXISTS "spmb_daya_tampung" ("id" text PRIMARY KEY NOT NULL, "school_id" text NOT NULL REFERENCES schools(id) ON DELETE CASCADE, "tahun_pelajaran" text NOT NULL, "jumlah_rombel" integer NOT NULL DEFAULT 0, "kuota_per_rombel" integer NOT NULL DEFAULT 28, "created_at" integer NOT NULL, "updated_at" integer NOT NULL)` },
  { name: 'spmb_pendaftar', sql: `CREATE TABLE IF NOT EXISTS "spmb_pendaftar" ("id" text PRIMARY KEY NOT NULL, "school_id" text NOT NULL REFERENCES schools(id) ON DELETE CASCADE, "tahun_pelajaran" text NOT NULL, "no_pendaftaran" text NOT NULL UNIQUE, "nik" text NOT NULL, "nama_lengkap" text NOT NULL, "jenis_kelamin" text NOT NULL DEFAULT 'laki-laki', "tempat_lahir" text, "tanggal_lahir" text NOT NULL, "usia" integer DEFAULT 0, "alamat" text, "desa" text, "asal_tk_paud" text, "nama_orang_tua" text, "no_hp" text, "jalur" text NOT NULL DEFAULT 'domisili', "status_seleksi" text NOT NULL DEFAULT 'pending', "status_kk" text NOT NULL DEFAULT 'belum', "status_akta" text NOT NULL DEFAULT 'belum', "status_dokumen_tambahan" text NOT NULL DEFAULT 'belum', "status_dokumen_afirmasi" text NOT NULL DEFAULT 'belum', "status_dokumen_mutasi" text NOT NULL DEFAULT 'belum', "catatan_verifikasi" text, "file_kk_url" text, "file_akta_url" text, "file_afirmasi_url" text, "file_mutasi_url" text, "verified_by" text, "verified_at" integer, "created_at" integer NOT NULL, "updated_at" integer NOT NULL)` },
  { name: 'transitions', sql: `CREATE TABLE IF NOT EXISTS "transitions" ("id" text PRIMARY KEY NOT NULL, "school_id" text NOT NULL REFERENCES schools(id) ON DELETE CASCADE, "student_id" text REFERENCES students(id) ON DELETE SET NULL, "tahun_pelajaran" text NOT NULL, "nama" text NOT NULL, "nisn" text, "jenis_kelamin" text, "kelas" text NOT NULL, "status_transisi" text NOT NULL DEFAULT 'calon_masuk', "smp_tujuan" text, "kesiapan" text, "kegiatan_transisi" text, "keterangan" text, "created_at" integer NOT NULL, "updated_at" integer NOT NULL)` },
]

async function main() {
  console.log('Connecting to Turso database...')
  
  let created = 0
  let skipped = 0
  
  for (const table of NEW_TABLES) {
    const exists = await tableExists(table.name)
    if (exists) {
      console.log(`  SKIP  ${table.name} — already exists`)
      skipped++
      continue
    }
    
    try {
      await client.execute(table.sql)
      console.log(`  OK    ${table.name} — created`)
      created++
    } catch (err) {
      console.error(`  FAIL  ${table.name} — ${err instanceof Error ? err.message : err}`)
    }
  }
  
  console.log(`\nDone: ${created} created, ${skipped} skipped`)
  process.exit(0)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
