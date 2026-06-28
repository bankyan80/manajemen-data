import 'dotenv/config'
import { db } from '../lib/db'
import { students } from '../db/schema'
import { eq, sql, and } from 'drizzle-orm'

async function main() {
  // Find distinct created_at values for records in affected schools
  const sids = [
    '14fcc9a2-d754-4319-ab4c-9b54e7ded46b',
    '5657a80e-add8-433a-a365-c5be6c143ac8',
    '774e132c-5db6-4d1e-9b03-42d03c3b62c2',
    '99187392-832e-4f64-b2dc-7f84f583436e',
  ]
  for (const sid of sids) {
    const r = await db
      .select({ created_at: students.created_at, count: sql<number>`COUNT(*)` })
      .from(students)
      .where(and(eq(students.school_id, sid), eq(students.status_siswa, 'aktif')))
      .groupBy(students.created_at)
      .orderBy(sql`created_at DESC`)
      .limit(5)
    console.log(`\nSchool ${sid}:`)
    for (const row of r) {
      console.log(`  ${row.created_at}: ${row.count} students`)
    }
  }
}
main().catch(console.error)
