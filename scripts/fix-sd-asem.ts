import 'dotenv/config'
import { db } from '../lib/db'
import { students } from '../db/schema'
import { eq, sql, and } from 'drizzle-orm'

const SCHOOL_ID = '774e132c-5db6-4d1e-9b03-42d03c3b62c2'
const KEEP_TS = '2026-06-28T08:07:37.830Z'

async function main() {
  if (!db) { console.log('DB not available'); return }

  // Delete records that are NOT from the Dapodik import
  const r = await db.run(sql`DELETE FROM students WHERE school_id = ${SCHOOL_ID} AND status_siswa = 'aktif' AND created_at <> ${KEEP_TS}`)
  console.log(`Deleted ${r.rowsAffected ?? '?'} original records (kept Dapodik import)`)

  // Verify
  const remaining = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(students)
    .where(and(eq(students.school_id, SCHOOL_ID), eq(students.status_siswa, 'aktif')))
  console.log(`Remaining: ${remaining[0].count}`)
}

main().catch(console.error)
