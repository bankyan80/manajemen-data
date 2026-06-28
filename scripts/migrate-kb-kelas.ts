import 'dotenv/config'
import { db } from '../lib/db'
import { students } from '../db/schema'
import { eq, sql, inArray } from 'drizzle-orm'

async function main() {
  if (!db) { console.log('DB not available'); return }

  // Preview
  const before = await db
    .select({ kelas: students.kelas_kelompok, count: sql<number>`COUNT(*)` })
    .from(students)
    .where(eq(students.jenjang, 'kb'))
    .groupBy(students.kelas_kelompok)
    .orderBy(students.kelas_kelompok)
  console.log('Before:')
  for (const r of before) console.log(`  ${r.kelas || '(kosong)'}: ${r.count}`)

  // 2–3 Tahun + 3–4 Tahun → Kelompok A
  const a1 = await db.update(students).set({ kelas_kelompok: 'Kelompok A' })
    .where(sql`jenjang = 'kb' AND kelas_kelompok IN ('2\u20133 Tahun', '3\u20134 Tahun')`)
  console.log(`\nUpdated 2–3/3–4 → Kelompok A: ${a1.rowsAffected}`)

  // 4–5 Tahun → Kelompok B
  const a2 = await db.update(students).set({ kelas_kelompok: 'Kelompok B' })
    .where(sql`jenjang = 'kb' AND kelas_kelompok = '4\u20135 Tahun'`)
  console.log(`Updated 4–5 → Kelompok B: ${a2.rowsAffected}`)

  // Verify
  const after = await db
    .select({ kelas: students.kelas_kelompok, count: sql<number>`COUNT(*)` })
    .from(students)
    .where(eq(students.jenjang, 'kb'))
    .groupBy(students.kelas_kelompok)
    .orderBy(students.kelas_kelompok)
  console.log('\nAfter:')
  for (const r of after) console.log(`  ${r.kelas || '(kosong)'}: ${r.count}`)
}

main().catch(console.error)
