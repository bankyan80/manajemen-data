import 'dotenv/config'
import { db } from '../lib/db'
import { students } from '../db/schema'
import { sql } from 'drizzle-orm'

const IMPORT_TS = '2026-06-28T08:04:00.616Z'

async function main() {
  if (!db) { console.log('DB not available'); return }
  // created_at is text for imported records (ISO string), number for original records (unix ms)
  const r = await db.run(sql`DELETE FROM students WHERE created_at = ${IMPORT_TS}`)
  console.log(`Deleted records from first import (created_at = ${IMPORT_TS})`)
  // Count remaining
  const remaining = await db.select({ count: sql<number>`COUNT(*)` }).from(students)
  console.log(`Total remaining: ${remaining[0].count}`)
}

main().catch(console.error)
