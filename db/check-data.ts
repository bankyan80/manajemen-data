import 'dotenv/config'
import { db } from '../lib/db'
import { students, schools } from './schema'
import { eq, sql } from 'drizzle-orm'

async function main() {
  if (!db) { console.log('DB not configured'); return }

  const nullGender = await db.select({ count: sql`COUNT(*)` }).from(students).where(sql`jenis_kelamin IS NULL`)
  console.log('Siswa dg jenis_kelamin NULL:', nullGender[0]?.count)

  // Get all schools
  const allSchools = await db.select({ id: schools.id, nama: schools.nama, npsn: schools.npsn, jenjang: schools.jenjang }).from(schools).orderBy(schools.jenjang, schools.nama)

  for (const s of allSchools) {
    const data2025 = await db
      .select({
        kelas: students.kelas_kelompok,
        jenjang: students.jenjang,
        l: sql`SUM(CASE WHEN jenis_kelamin = 'laki-laki' THEN 1 ELSE 0 END)`,
        p: sql`SUM(CASE WHEN jenis_kelamin = 'perempuan' THEN 1 ELSE 0 END)`,
        total: sql`COUNT(*)`,
      })
      .from(students)
      .where(sql`tahun_pelajaran = '2025/2026' AND school_id = ${s.id}`)
      .groupBy(students.kelas_kelompok, students.jenjang)
      .orderBy(students.kelas_kelompok)

    const data2026 = await db
      .select({
        kelas: students.kelas_kelompok,
        jenjang: students.jenjang,
        l: sql`SUM(CASE WHEN jenis_kelamin = 'laki-laki' THEN 1 ELSE 0 END)`,
        p: sql`SUM(CASE WHEN jenis_kelamin = 'perempuan' THEN 1 ELSE 0 END)`,
        total: sql`COUNT(*)`,
      })
      .from(students)
      .where(sql`tahun_pelajaran = '2026/2027' AND school_id = ${s.id}`)
      .groupBy(students.kelas_kelompok, students.jenjang)
      .orderBy(students.kelas_kelompok)

    const hasData = data2025.length > 0 || data2026.length > 0
    if (!hasData) continue

    console.log(`\n=== ${s.nama} (${s.jenjang}) ===`)

    if (data2025.length > 0) {
      console.log('  TP 2025/2026 (belum dinaikan):')
      for (const r of data2025) {
        console.log(`    ${r.kelas}: L=${r.l} P=${r.p} Total=${r.total}`)
      }
    }

    if (data2026.length > 0) {
      console.log('  TP 2026/2027 (sudah dinaikan):')
      for (const r of data2026) {
        console.log(`    ${r.kelas}: L=${r.l} P=${r.p} Total=${r.total}`)
      }
    }
  }
}

main().catch(console.error)
