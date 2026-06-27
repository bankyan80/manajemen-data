import 'dotenv/config'
import { db } from '../lib/db'
import { students, schools } from './schema'
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

  // Get all SD schools
  const sdSchools = await db
    .select({ id: schools.id, nama: schools.nama })
    .from(schools)
    .where(eq(schools.jenjang, 'sd'))
    .orderBy(schools.nama)

  let totalPromoted = 0
  let totalSkipped = 0
  let totalLulus = 0
  let totalError = 0

  for (const school of sdSchools) {
    // Get existing NIKs in TP 2026/2027 for this school
    const existingInNewTP = await db
      .select({ nik: students.nik })
      .from(students)
      .where(sql`tahun_pelajaran = ${tpBaru} AND school_id = ${school.id} AND nik IS NOT NULL AND nik != ''`)

    const existingNikSet = new Set(existingInNewTP.map(r => r.nik))

    // Get all SD students from TP 2025/2026 for this school
    const oldStudents = await db
      .select()
      .from(students)
      .where(sql`tahun_pelajaran = ${tpLama} AND school_id = ${school.id} AND jenjang = 'sd'`)

    let promoted = 0
    let skipped = 0
    let lulus = 0

    for (const s of oldStudents) {
      // Skip if NIK already exists in new TP
      if (s.nik && existingNikSet.has(s.nik)) {
        skipped++
        continue
      }

      if (KELAS_LULUS.includes(s.kelas_kelompok)) {
        lulus++
        continue
      }

      const kelasNaik = KELAS_MAP[s.kelas_kelompok]
      if (!kelasNaik) {
        skipped++
        continue
      }

      try {
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
      } catch (err: any) {
        console.error(`  Gagal promote ${s.nama}: ${err.message}`)
        totalError++
      }
    }

    if (promoted > 0 || skipped > 0 || lulus > 0) {
      console.log(`${school.nama}: promote ${promoted}, skip(already in ${tpBaru}) ${skipped}, lulus ${lulus}`)
    }

    totalPromoted += promoted
    totalSkipped += skipped
    totalLulus += lulus
  }

  console.log(`\n✅ Selesai! Promote: ${totalPromoted}, Skip: ${totalSkipped}, Lulus: ${totalLulus}, Error: ${totalError}`)
}

main().catch(console.error)
