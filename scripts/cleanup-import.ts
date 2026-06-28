import 'dotenv/config'
import { db } from '../lib/db'
import { schools, students } from '../db/schema'
import { eq, sql, and, inArray } from 'drizzle-orm'

async function main() {
  if (!db) { console.log('DB not available'); return }

  // Check current counts for affected schools
  const schoolIds = [
    '14fcc9a2-d754-4319-ab4c-9b54e7ded46b', // SD IT AL IRSYAD
    '5657a80e-add8-433a-a365-c5be6c143ac8', // SD NEGERI 3 SIGONG
    '774e132c-5db6-4d1e-9b03-42d03c3b62c2', // SD NEGERI 1 ASEM
    '887c6040-152e-436f-8b24-423734a97b6a', // KB A.H. PLUS
    'dcd04e9f-d7b0-4f9f-8757-afaf703ca87a', // KB AMALIA
    '7248e764-502e-4dd5-9ed4-3323b5905508', // TK GELATIK
    '99187392-832e-4f64-b2dc-7f84f583436e', // KB AZ-ZAHRA
  ]

  const schoolRows = await db.select().from(schools)
  const schoolMap = new Map(schoolRows.map(s => [s.id, s.nama]))

  for (const sid of schoolIds) {
    const r = await db
      .select({ count: sql<number>`COUNT(*)`, jenjang: students.jenjang })
      .from(students)
      .where(and(eq(students.school_id, sid), eq(students.status_siswa, 'aktif')))
      .groupBy(students.jenjang)
    for (const row of r) {
      console.log(`${(schoolMap.get(sid) || sid).padEnd(40)} ${row.jenjang}: ${row.count}`)
    }
  }
}

main().catch(console.error)
