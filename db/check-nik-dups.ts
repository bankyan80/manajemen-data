import 'dotenv/config'
import { db } from '../lib/db'
import { students, schools } from './schema'
import { eq, sql } from 'drizzle-orm'

async function main() {
  if (!db) { console.log('DB not configured'); return }

  const sdSchools = await db
    .select({ id: schools.id, nama: schools.nama })
    .from(schools)
    .where(eq(schools.jenjang, 'sd'))
    .orderBy(schools.nama)

  let totalDups = 0
  let totalStudents = 0

  for (const s of sdSchools) {
    const rows = await db
      .select({ nik: students.nik, count: sql`COUNT(*)` })
      .from(students)
      .where(sql`tahun_pelajaran = '2025/2026' AND school_id = ${s.id} AND nik IS NOT NULL AND nik != ''`)
      .groupBy(students.nik)
      .having(sql`COUNT(*) > 1`)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(5)

    if (rows.length > 0) {
      console.log(`\n${s.nama}: ${rows.length} NIK duplikat`)
      for (const r of rows) {
        totalDups += Number(r.count) - 1
        // Get names of students with this NIK
        const names = await db
          .select({ nama: students.nama, kelas: students.kelas_kelompok })
          .from(students)
          .where(sql`tahun_pelajaran = '2025/2026' AND school_id = ${s.id} AND nik = ${r.nik}`)
        console.log(`  NIK ${r.nik}: ${Number(r.count)}x -> ${names.map(n => `${n.nama} (${n.kelas})`).join(', ')}`)
      }
    }
  }

  // Check uniqueness across ALL SD students in TP 2025/2026
  const allRows = await db
    .select({ nik: students.nik })
    .from(students)
    .where(sql`tahun_pelajaran = '2025/2026' AND jenjang = 'sd' AND nik IS NOT NULL AND nik != ''`)

  const allNik = allRows.map(r => r.nik)
  const uniqueNik = new Set(allNik)
  console.log(`\n=== Statistik Global SD TP 2025/2026 ===`)
  console.log(`Total siswa dengan NIK: ${allNik.length}`)
  console.log(`NIK unik: ${uniqueNik.size}`)
  console.log(`Duplikat: ${allNik.length - uniqueNik.size}`)

  // Check per school: unique vs total
  let grandTotal = 0
  let grandUnique = 0
  for (const s of sdSchools) {
    const schoolRows = await db
      .select({ nik: students.nik })
      .from(students)
      .where(sql`tahun_pelajaran = '2025/2026' AND school_id = ${s.id} AND nik IS NOT NULL AND nik != ''`)
    const schoolNik = schoolRows.map(r => r.nik)
    const schoolUnique = new Set(schoolNik)
    grandTotal += schoolNik.length
    grandUnique += schoolUnique.size
    if (schoolNik.length !== schoolUnique.size) {
      console.log(`${s.nama}: ${schoolNik.length} total, ${schoolUnique.size} unik (${schoolNik.length - schoolUnique.size} duplikat)`)
    }
  }
  console.log(`\nGrand total: ${grandTotal}, Grand unique: ${grandUnique}, Duplikat: ${grandTotal - grandUnique}`)
}

main().catch(console.error)
