import 'dotenv/config'
import { db } from '../lib/db'
import { students } from '../db/schema'
import { sql, eq, like, and } from 'drizzle-orm'

async function main() {
  // Test search
  const q = '%ahmad%'
  const where = sql`${students.tahun_pelajaran} = '2026/2027' AND (${students.nama} LIKE ${q} OR ${students.nik} LIKE ${q} OR ${students.nisn} LIKE ${q})`
  const rows = await db.select({ nama: students.nama, tp: students.tahun_pelajaran, jenjang: students.jenjang }).from(students).where(where).limit(10)
  console.log('Search ahmad:', rows.length)
  for (const r of rows) console.log(`  ${r.nama} | ${r.tp} | ${r.jenjang}`)

  // Test count
  const count = await db.select({ count: sql<number>`COUNT(*)` }).from(students).where(eq(students.tahun_pelajaran, '2026/2027'))
  console.log('Total 2026/2027:', count[0]?.count)
}
main().catch(console.error)
