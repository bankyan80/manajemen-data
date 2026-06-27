import 'dotenv/config'
import { db } from '../lib/db'
import { students, schools, alumni } from './schema'
import { eq, sql, and, notInArray } from 'drizzle-orm'

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

  // Step 1: Delete ALL existing TP 2026/2027 SD student records (they're incomplete)
  console.log('Step 1: Menghapus data SD TP 2026/2027 yang tidak lengkap...')
  const delResult = await db.delete(students).where(
    sql`tahun_pelajaran = ${tpBaru} AND jenjang = 'sd'`
  )
  console.log(`  ✓ ${delResult.rowsAffected || '?'} record dihapus`)

  // Step 2: Find and remove duplicates from TP 2025/2026 (keep first occurrence)
  console.log('\nStep 2: Menghapus duplikat siswa TP 2025/2026...')
  
  // Get all students grouped by (nik, nama, kelas) to find duplicates
  const dupRows = await db
    .select({
      nik: students.nik,
      nama: students.nama,
      kelas: students.kelas_kelompok,
      minId: sql`MIN(${students.id})`,
      count: sql`COUNT(*)`,
    })
    .from(students)
    .where(sql`tahun_pelajaran = ${tpLama} AND jenjang = 'sd' AND nik IS NOT NULL AND nik != ''`)
    .groupBy(students.nik, students.nama, students.kelas_kelompok)
    .having(sql`COUNT(*) > 1`)

  let deletedDups = 0
  for (const dup of dupRows) {
    // Delete all except the one with min ID
    const result = await db.delete(students).where(
      sql`tahun_pelajaran = ${tpLama} AND jenjang = 'sd' AND nik = ${dup.nik} 
          AND nama = ${dup.nama} AND kelas_kelompok = ${dup.kelas}
          AND id != ${dup.minId}`
    )
    deletedDups += Number(result.rowsAffected) || 0
  }
  console.log(`  ✓ ${deletedDups} duplikat dihapus (${dupRows.length} kelompok siswa)`)

  // Step 3: Promote all unique students to TP 2026/2027
  console.log('\nStep 3: Mempromosikan siswa ke TP 2026/2027...')
  
  const sdSchools = await db
    .select({ id: schools.id, nama: schools.nama })
    .from(schools)
    .where(eq(schools.jenjang, 'sd'))
    .orderBy(schools.nama)

  let totalPromoted = 0
  let totalLulus = 0
  let totalSkipped = 0

  for (const school of sdSchools) {
    const oldStudents = await db
      .select()
      .from(students)
      .where(sql`tahun_pelajaran = ${tpLama} AND school_id = ${school.id} AND jenjang = 'sd'`)
      .orderBy(students.kelas_kelompok, students.nama)

    let promoted = 0
    let lulus = 0

    for (const s of oldStudents) {
      if (KELAS_LULUS.includes(s.kelas_kelompok)) {
        // → alumni (check if already exists first)
        const existingAlumni = await db
          .select({ id: alumni.id })
          .from(alumni)
          .where(sql`nik = ${s.nik} AND school_id = ${s.school_id} AND tahun_lulus = ${tpBaru}`)
          .limit(1)
        
        if (existingAlumni.length === 0) {
          await db.insert(alumni).values({
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
        }
        lulus++
        continue
      }

      const kelasNaik = KELAS_MAP[s.kelas_kelompok]
      if (!kelasNaik) {
        continue
      }

      await db.insert(students).values({
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
      promoted++
    }

    if (promoted > 0 || lulus > 0) {
      console.log(`  ${school.nama}: promote ${promoted}, lulus ${lulus}`)
    }
    totalPromoted += promoted
    totalLulus += lulus
  }

  console.log(`\n✅ Selesai! Promote: ${totalPromoted}, Lulus: ${totalLulus}`)
}

main().catch(console.error)
