import 'dotenv/config'
import { db } from '../lib/db'
import { students } from '../db/schema'
import { eq, sql } from 'drizzle-orm'

async function main() {
  if (!db) { console.log('DB not configured'); process.exit(1) }

  const dups = await db
    .select({ nik: students.nik, count: sql`COUNT(*)` })
    .from(students)
    .where(sql`jenjang IN ('tk','kb') AND tahun_pelajaran = '2025/2026' AND nik IS NOT NULL AND nik != ''`)
    .groupBy(students.nik)
    .having(sql`COUNT(*) > 1`)

  console.log(`Total NIK duplikat TK/KB: ${dups.length}`)

  let deleted = 0
  let skipped = 0
  for (const d of dups) {
    const rows = await db
      .select()
      .from(students)
      .where(sql`jenjang IN ('tk','kb') AND tahun_pelajaran = '2025/2026' AND nik = ${d.nik}`)
      .orderBy(students.created_at)

    // Check if duplicates span different schools
    const schools = [...new Set(rows.map(r => r.school_id))]
    if (schools.length > 1) {
      console.log(`SKIP (beda sekolah): NIK ${d.nik} — ${rows.map(r => `${r.nama} @ ${r.school_id}`).join(', ')}`)
      skipped++
      continue
    }

    // Keep the first (oldest created_at), delete the rest
    const [keep, ...remove] = rows
    for (const r of remove) {
      await db.delete(students).where(eq(students.id, r.id))
      deleted++
      console.log(`Hapus: ${r.nama} (${r.nik}, ${r.kelas_kelompok}) — keep: ${keep.nama} (${keep.kelas_kelompok})`)
    }
  }
  console.log(`\nSelesai. ${deleted} dihapus, ${skipped} dilewati (beda sekolah).`)

  console.log(`\nSelesai. ${deleted} duplikat dihapus.`)
}

main().catch(console.error)
