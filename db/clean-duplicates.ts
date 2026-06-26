import 'dotenv/config'
import { db } from '../lib/db'
import { students } from './schema'
import { sql } from 'drizzle-orm'

async function cleanTP(tp: string) {
  console.log(`\n=== Cleaning TP ${tp} SD ===`)

  // Get all unique records (one per nik+school+class)
  const allRows = await db
    .select({ id: students.id, nik: students.nik, school_id: students.school_id, kelas_kelompok: students.kelas_kelompok })
    .from(students)
    .where(sql`tahun_pelajaran = ${tp} AND jenjang = 'sd' AND nik IS NOT NULL AND nik != ''`)

  // Group by nik+school+class, keep only first (MIN id)
  const seen = new Map<string, number>()
  const deleteIds: number[] = []

  for (const r of allRows) {
    const key = `${r.nik}|${r.school_id}|${r.kelas_kelompok}`
    if (seen.has(key)) {
      deleteIds.push(r.id)
    } else {
      seen.set(key, r.id)
    }
  }

  console.log(`  Unique records: ${seen.size}, Duplicates to delete: ${deleteIds.length}`)

  if (deleteIds.length > 0) {
    const BATCH = 500
    for (let i = 0; i < deleteIds.length; i += BATCH) {
      const chunk = deleteIds.slice(i, i + BATCH)
      const ids = sql.join(chunk.map(id => sql`${id}`), sql`,`)
      await db.delete(students).where(sql`id IN (${ids})`)
    }
  }

  console.log(`  Deleted: ${deleteIds.length} rows`)
  return deleteIds.length
}

async function main() {
  if (!db) { console.log('DB not configured'); return }
  const d1 = await cleanTP('2025/2026')
  const d2 = await cleanTP('2026/2027')
  console.log(`\n✅ Total deleted: ${d1 + d2}`)
}

main().catch(console.error)
