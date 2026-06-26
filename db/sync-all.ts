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
const BATCH = 200

async function main() {
  if (!db) { console.log('DB not configured'); return }

  const tpLama = '2025/2026'
  const tpBaru = '2026/2027'

  console.log('Step 1: Hapus data SD TP 2026/2027...')
  const del = await db.delete(students).where(
    sql`tahun_pelajaran = ${tpBaru} AND jenjang = 'sd'`
  )
  console.log(`  ✓ ${del.rowsAffected || 0} record dihapus`)

  const allStudents = await db
    .select()
    .from(students)
    .where(sql`tahun_pelajaran = ${tpLama} AND jenjang = 'sd'`)
    .orderBy(students.school_id, students.kelas_kelompok, students.nama)

  console.log(`\nStep 2: Proses ${allStudents.length} siswa...`)

  const promotionRows: any[] = []
  const alumniRows: any[] = []

  for (const s of allStudents) {
    if (KELAS_LULUS.includes(s.kelas_kelompok)) {
      alumniRows.push({
        school_id: s.school_id,
        tahun_lulus: tpBaru,
        nama: s.nama,
        nisn: s.nisn,
        nik: s.nik,
        jenis_kelamin: s.jenis_kelamin,
        tempat_lahir: s.tempat_lahir,
        tanggal_lahir: s.tanggal_lahir,
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
      nik: s.nik,
      nisn: s.nisn,
      jenis_kelamin: s.jenis_kelamin,
      tempat_lahir: s.tempat_lahir,
      tanggal_lahir: s.tanggal_lahir,
      alamat: s.alamat,
      nama_orang_tua: s.nama_orang_tua,
      status_siswa: 'aktif',
    })
  }

  console.log(`  ${promotionRows.length} akan dipromosikan, ${alumniRows.length} alumni`)

  console.log('\nStep 3: Batch insert siswa naik kelas...')
  for (let i = 0; i < promotionRows.length; i += BATCH) {
    await db.insert(students).values(promotionRows.slice(i, i + BATCH) as any)
    if ((i + BATCH) % 1000 === 0 || i + BATCH >= promotionRows.length) {
      console.log(`  ...${Math.min(i + BATCH, promotionRows.length)}/${promotionRows.length}`)
    }
  }
  console.log(`  ✓ ${promotionRows.length} siswa dipromosikan`)

  console.log('\nStep 4: Batch insert alumni...')
  for (let i = 0; i < alumniRows.length; i += BATCH) {
    await db.insert(alumni).values(alumniRows.slice(i, i + BATCH) as any)
  }
  console.log(`  ✓ ${alumniRows.length} alumni`)

  console.log('\n✅ Selesai!')
}

main().catch(console.error)
