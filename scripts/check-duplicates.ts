import 'dotenv/config'
import { db } from '../lib/db'
import { students } from '../db/schema'
import { sql } from 'drizzle-orm'

async function main() {
  if (!db) { console.log('DB not configured'); return }

  // SD TP 2026/2027
  const sdDups = await db
    .select({ nik: students.nik, count: sql`COUNT(*)` })
    .from(students)
    .where(sql`jenjang = 'sd' AND tahun_pelajaran = '2026/2027' AND nik IS NOT NULL AND nik != ''`)
    .groupBy(students.nik)
    .having(sql`COUNT(*) > 1`)

  // TK/KB TP 2025/2026
  const tkDups = await db
    .select({ nik: students.nik, count: sql`COUNT(*)` })
    .from(students)
    .where(sql`jenjang IN ('tk','kb') AND tahun_pelajaran = '2025/2026' AND nik IS NOT NULL AND nik != ''`)
    .groupBy(students.nik)
    .having(sql`COUNT(*) > 1`)

  if (sdDups.length > 0) {
    console.log(`SD: ${sdDups.length} NIK duplikat`)
    for (const d of sdDups.slice(0, 30)) {
      const names = await db
        .select({ nama: students.nama, kelas: students.kelas_kelompok, school_id: students.school_id })
        .from(students)
        .where(sql`jenjang = 'sd' AND tahun_pelajaran = '2026/2027' AND nik = ${d.nik}`)
      console.log(`  NIK ${d.nik}: ${Number(d.count)}x -> ${names.map(n => `${n.nama} (${n.kelas})`).join(', ')}`)
    }
    if (sdDups.length > 30) console.log(`  ... dan ${sdDups.length - 30} NIK lainnya`)
  } else {
    console.log('SD: Tidak ada duplikat NIK')
  }

  if (tkDups.length > 0) {
    console.log(`\nTK/KB: ${tkDups.length} NIK duplikat`)
    for (const d of tkDups.slice(0, 30)) {
      const names = await db
        .select({ nama: students.nama, kelas: students.kelas_kelompok, school_id: students.school_id })
        .from(students)
        .where(sql`jenjang IN ('tk','kb') AND tahun_pelajaran = '2025/2026' AND nik = ${d.nik}`)
      console.log(`  NIK ${d.nik}: ${Number(d.count)}x -> ${names.map(n => `${n.nama} (${n.kelas})`).join(', ')}`)
    }
    if (tkDups.length > 30) console.log(`  ... dan ${tkDups.length - 30} NIK lainnya`)
  } else {
    console.log('TK/KB: Tidak ada duplikat NIK')
  }
}

main().catch(console.error)
