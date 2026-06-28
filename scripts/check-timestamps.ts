import 'dotenv/config'
import { db } from '../lib/db'
import { students } from '../db/schema'
import { eq, sql, and } from 'drizzle-orm'

async function main() {
  const r = await db
    .select({ created_at: students.created_at, count: sql<number>`COUNT(*)` })
    .from(students)
    .where(and(eq(students.school_id, '774e132c-5db6-4d1e-9b03-42d03c3b62c2'), eq(students.status_siswa, 'aktif')))
    .groupBy(students.created_at)
    .orderBy(sql`created_at DESC`)
  for (const x of r) console.log(x.created_at, '->', x.count)
}
main().catch(console.error)
