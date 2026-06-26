import 'dotenv/config'
import { db } from '../lib/db'
import { students, schools } from './schema'
import { eq, sql } from 'drizzle-orm'

async function main() {
  if (!db) return
  const sdSchools = await db.select({ id: schools.id, nama: schools.nama }).from(schools).where(eq(schools.jenjang, 'sd')).orderBy(schools.nama)

  for (const s of sdSchools) {
    const oldData = await db
      .select({ kelas: students.kelas_kelompok, total: sql`COUNT(*)` })
      .from(students)
      .where(sql`tahun_pelajaran = '2025/2026' AND school_id = ${s.id}`)
      .groupBy(students.kelas_kelompok)
      .orderBy(students.kelas_kelompok)

    const newData = await db
      .select({ kelas: students.kelas_kelompok, total: sql`COUNT(*)` })
      .from(students)
      .where(sql`tahun_pelajaran = '2026/2027' AND school_id = ${s.id}`)
      .groupBy(students.kelas_kelompok)
      .orderBy(students.kelas_kelompok)

    if (oldData.length === 0 && newData.length === 0) continue

    console.log(`\n${s.nama}:`)
    if (oldData.length > 0) {
      console.log('  TP 2025/2026: ' + oldData.map(r => r.kelas + '=' + r.total).join(', '))
    }
    if (newData.length > 0) {
      console.log('  TP 2026/2027: ' + newData.map(r => r.kelas + '=' + r.total).join(', '))
    }
  }
}
main().catch(console.error)
