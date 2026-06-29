import 'dotenv/config'
import { db } from '../lib/db'
import { students } from '../db/schema'
import { sql, eq, and } from 'drizzle-orm'

async function main() {
  const grades = await db
    .select({ kelas: students.kelas_kelompok, count: sql<number>`COUNT(*)`, status: students.status_siswa })
    .from(students)
    .where(and(eq(students.jenjang, 'sd'), eq(students.tahun_pelajaran, '2026/2027')))
    .groupBy(students.kelas_kelompok, students.status_siswa)
    .orderBy(students.kelas_kelompok)

  for (const g of grades) {
    console.log(`${g.status}\t${g.count}\t${g.kelas}`)
  }

  const total = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(students)
    .where(and(eq(students.jenjang, 'sd'), eq(students.tahun_pelajaran, '2026/2027')))
  console.log(`\nTotal: ${total[0].count}`)
}
main().catch(console.error)
