import 'dotenv/config'
import { db } from '../lib/db'
import { students } from '../db/schema'
import { eq, sql } from 'drizzle-orm'

async function main() {
  if (!db) { console.log('DB not available'); return }

  // Fix KB records with kelas='B' → '4–5 Tahun'
  const bad = await db
    .select({ id: students.id, nama: students.nama, nik: students.nik, kelas: students.kelas_kelompok })
    .from(students)
    .where(sql`jenjang = 'kb' AND kelas_kelompok = 'B'`)

  for (const r of bad) {
    console.log(`Fixing ${r.nama} (${r.nik}) — ${r.kelas} → 4–5 Tahun`)
    await db.update(students).set({ kelas_kelompok: '4–5 Tahun' }).where(eq(students.id, r.id))
  }
  console.log(`Fixed ${bad.length} KB records`)

  // Verify
  const remaining = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(students)
    .where(sql`jenjang = 'kb' AND kelas_kelompok = 'B'`)
  console.log(`Remaining 'B' in KB: ${remaining[0]?.count || 0}`)

  // Show final distribution
  console.log('\n=== KB final ===')
  const kb = await db
    .select({ kelas: students.kelas_kelompok, count: sql<number>`COUNT(*)` })
    .from(students)
    .where(eq(students.jenjang, 'kb'))
    .groupBy(students.kelas_kelompok)
    .orderBy(students.kelas_kelompok)
  for (const r of kb) console.log(`  ${r.kelas || '(kosong)'}: ${r.count}`)
}

main().catch(console.error)
