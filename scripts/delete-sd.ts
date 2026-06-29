import 'dotenv/config'
import { db } from '../lib/db'
import { students } from '../db/schema'
import { eq, and, sql } from 'drizzle-orm'

async function main() {
  await db.delete(students).where(and(eq(students.jenjang, 'sd'), eq(students.tahun_pelajaran, '2026/2027')))
  const c = await db.select({ count: sql<number>`COUNT(*)` }).from(students)
  console.log('Remaining:', c[0].count)
}
main().catch(console.error)
