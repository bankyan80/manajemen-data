import 'dotenv/config'
import { db } from '../lib/db'
import { students } from '../db/schema'
import { and, eq, inArray, sql } from 'drizzle-orm'

const CLASS_ORDER: Record<string, number> = {
  'Kelas I': 1, 'Kelas II': 2, 'Kelas III': 3,
  'Kelas IV': 4, 'Kelas V': 5, 'Kelas VI': 6,
}

async function main() {
  if (!db) { console.log('DB not configured'); process.exit(1) }

  // 1. Find all duplicate NIKs
  const dups = await db
    .select({ nik: students.nik })
    .from(students)
    .where(sql`jenjang = 'sd' AND tahun_pelajaran = '2026/2027' AND nik IS NOT NULL AND nik != ''`)
    .groupBy(students.nik)
    .having(sql`COUNT(*) > 1`)

  console.log(`Total NIK duplikat SD: ${dups.length}`)

  if (dups.length === 0) { console.log('Tidak ada duplikat.'); return }

  const allNiks = dups.map(d => d.nik)

  // 2. Fetch ALL rows for these NIKs in ONE query
  const allRows = await db
    .select()
    .from(students)
    .where(and(
      eq(students.jenjang, 'sd'),
      eq(students.tahun_pelajaran, '2026/2027'),
      inArray(students.nik, allNiks)
    ))

  console.log(`Total baris duplikat: ${allRows.length}`)

  // 3. Group by NIK, process deletions in memory
  const groups = new Map<string, typeof allRows>()
  for (const row of allRows) {
    const key = row.nik!
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(row)
  }

  const toDelete: string[] = []
  let skipped = 0

  for (const [nik, rows] of groups) {
    if (rows.length <= 1) continue

    const schools = [...new Set(rows.map(r => r.school_id))]
    if (schools.length > 1) { skipped++; continue }

    // Keep highest kelas; if tie, keep oldest
    const sorted = [...rows].sort((a, b) => {
      const oa = CLASS_ORDER[a.kelas_kelompok] ?? 0
      const ob = CLASS_ORDER[b.kelas_kelompok] ?? 0
      if (oa !== ob) return ob - oa
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })

    const [, ...remove] = sorted
    for (const r of remove) toDelete.push(r.id)
  }

  if (toDelete.length === 0) { console.log('Tidak ada yang perlu dihapus.'); return }

  // 4. Batch delete in chunks
  const CHUNK = 500
  for (let i = 0; i < toDelete.length; i += CHUNK) {
    const chunk = toDelete.slice(i, i + CHUNK)
    await db.delete(students).where(inArray(students.id, chunk))
    console.log(`Terhapus: ${Math.min(i + CHUNK, toDelete.length)} / ${toDelete.length}`)
  }

  console.log(`\nSelesai. ${toDelete.length} duplikat SD dihapus, ${skipped} dilewati (beda sekolah).`)
}

main().catch(console.error)
