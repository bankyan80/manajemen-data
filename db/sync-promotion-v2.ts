import 'dotenv/config'
import { db } from '../lib/db'
import { students, schools, alumni } from './schema'
import { eq, sql } from 'drizzle-orm'

const KELAS_MAP: Record<string, string> = {
  'Kelas I': 'Kelas II',
  'Kelas II': 'Kelas III',
  'Kelas III': 'Kelas IV',
  'Kelas IV': 'Kelas V',
  'Kelas V': 'Kelas VI',
}
const KELAS_LULUS = ['Kelas VI']

async function main() {
  if (!db) { console.log('DB not configured'); return }

  const tpLama = '2025/2026'
  const tpBaru = '2026/2027'

  // Step 1: Delete all existing SD records in TP 2026/2027
  console.log('Step 1: Hapus data SD TP 2026/2027...')
  const del = await db.delete(students).where(
    sql`tahun_pelajaran = ${tpBaru} AND jenjang = 'sd'`
  )
  console.log(`  ✓ ${del.rowsAffected || 0} record dihapus`)

  // Step 2: Get all unique SD students from TP 2025/2026 (one per NIK)
  console.log('\nStep 2: Ambil data siswa unik TP 2025/2026...')
  const allUnique = await db
    .select({
      id: sql`MIN(${students.id})`,
      school_id: students.school_id,
      tahun_pelajaran: students.tahun_pelajaran,
      jenjang: students.jenjang,
      kelas_kelompok: students.kelas_kelompok,
      nama: students.nama,
      nik: students.nik,
      nisn: sql`MIN(${students.nisn})`,
      jenis_kelamin: sql`MIN(${students.jenis_kelamin})`,
      tempat_lahir: sql`MIN(${students.tempat_lahir})`,
      tanggal_lahir: sql`MIN(${students.tanggal_lahir})`,
      alamat: sql`MIN(${students.alamat})`,
      nama_orang_tua: sql`MIN(${students.nama_orang_tua})`,
      status_siswa: sql`MIN(${students.status_siswa})`,
    })
    .from(students)
    .where(sql`tahun_pelajaran = ${tpLama} AND jenjang = 'sd' AND nik IS NOT NULL AND nik != ''`)
    .groupBy(students.nik, students.nama)

  // Also get students without NIK
  const noNik = await db
    .select()
    .from(students)
    .where(sql`tahun_pelajaran = ${tpLama} AND jenjang = 'sd' AND (nik IS NULL OR nik = '')`)

  const promotionRows: any[] = []
  const alumniRows: any[] = []

  for (const s of [...allUnique, ...noNik]) {
    if (KELAS_LULUS.includes(s.kelas_kelompok)) {
      alumniRows.push({
        school_id: s.school_id,
        tahun_lulus: tpBaru,
        nama: s.nama,
        nisn: s.nisn || null,
        nik: s.nik || null,
        jenis_kelamin: s.jenis_kelamin || null,
        tempat_lahir: s.tempat_lahir || null,
        tanggal_lahir: s.tanggal_lahir || null,
        kelas: s.kelas_kelompok,
      })
      continue
    }

    const kelasNaik = KELAS_MAP[s.kelas_kelompok]
    if (!kelasNaik) continue

    promotionRows.push({
      school_id: s.school_id,
      tahun_pelajaran: tpBaru,
      jenjang: s.jenjang,
      kelas_kelompok: kelasNaik,
      nama: s.nama,
      nik: s.nik || null,
      nisn: s.nisn || null,
      jenis_kelamin: s.jenis_kelamin || null,
      tempat_lahir: s.tempat_lahir || null,
      tanggal_lahir: s.tanggal_lahir || null,
      alamat: s.alamat || null,
      nama_orang_tua: s.nama_orang_tua || null,
      status_siswa: 'aktif',
    })
  }

  console.log(`  ${allUnique.length} unik (ber-NIK), ${noNik.length} tanpa NIK`)

  // Batch insert promoted students
  console.log('\nStep 3: Insert siswa naik kelas...')
  const BATCH = 100
  for (let i = 0; i < promotionRows.length; i += BATCH) {
    const chunk = promotionRows.slice(i, i + BATCH)
    await db.insert(students).values(chunk as any)
  }
  console.log(`  ✓ ${promotionRows.length} siswa dipromosikan`)

  console.log('\nStep 4: Insert alumni...')
  for (let i = 0; i < alumniRows.length; i += BATCH) {
    const chunk = alumniRows.slice(i, i + BATCH)
    await db.insert(alumni).values(chunk as any)
  }
  console.log(`  ✓ ${alumniRows.length} siswa lulus (alumni)`)

  console.log('\n✅ Selesai!')
}

main().catch(console.error)
