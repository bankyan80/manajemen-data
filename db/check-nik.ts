import 'dotenv/config'
import { db } from '../lib/db'
import { students, spmbPendaftar } from './schema'
import { eq, sql } from 'drizzle-orm'

async function main() {
  if (!db) { console.log('DB not configured'); return }

  // Check SPMB accepted students in TP 2026/2027
  const spmbAccepted = await db
    .select({ nik: spmbPendaftar.nik, nama: spmbPendaftar.nama_lengkap, school_id: spmbPendaftar.school_id })
    .from(spmbPendaftar)
    .where(sql`status_seleksi = 'diterima'`)

  console.log(`SPMB accepted students: ${spmbAccepted.length}`)
  
  // Check if SPMB NIKs exist in TP 2025/2026 students
  let matchCount = 0
  for (const sp of spmbAccepted) {
    const existing = await db
      .select({ id: students.id, nama: students.nama, kelas: students.kelas_kelompok })
      .from(students)
      .where(sql`nik = ${sp.nik} AND tahun_pelajaran = '2025/2026' AND school_id = ${sp.school_id}`)
      .limit(1)
    
    if (existing.length > 0) {
      matchCount++
      if (matchCount <= 5) {
        console.log(`  MATCH: SPMB ${sp.nama} (${sp.nik}) = Student ${existing[0].nama} (${existing[0].kelas})`)
      }
    }
  }
  console.log(`Total SPMB NIKs that match TP 2025/2026 students: ${matchCount}`)

  // Count students in TP 2026/2027 with empty/null NIKs
  const emptyNik = await db
    .select({ count: sql`COUNT(*)` })
    .from(students)
    .where(sql`tahun_pelajaran = '2026/2027' AND (nik IS NULL OR nik = '')`)
  console.log(`\nTP 2026/2027 students with empty NIK: ${emptyNik[0]?.count}`)

  // Show breakdown of NIK matching for one school
  const schoolId = '858edace-8558-422b-899e-b4c0ad58eeee' // SD NEGERI 1 LEMAHABANG
  const students2025 = await db
    .select({ nik: students.nik, nama: students.nama, kelas: students.kelas_kelompok, id: students.id })
    .from(students)
    .where(sql`tahun_pelajaran = '2025/2026' AND school_id = ${schoolId} AND jenjang = 'sd'`)
    .orderBy(students.kelas_kelompok)

  const niks2026 = await db
    .select({ nik: students.nik })
    .from(students)
    .where(sql`tahun_pelajaran = '2026/2027' AND school_id = ${schoolId} AND nik IS NOT NULL AND nik != ''`)

  const nikSet = new Set(niks2026.map(r => r.nik))
  
  let matched = 0, unmatched = 0, noNik = 0
  for (const s of students2025) {
    if (!s.nik) { noNik++; continue }
    if (nikSet.has(s.nik)) matched++
    else unmatched++
  }
  console.log(`\nSD NEGERI 1 LEMAHABANG TP 2025/2026:`)
  console.log(`  Total: ${students2025.length}`)
  console.log(`  No NIK: ${noNik}`)
  console.log(`  NIK exists in 2026/2027 (would be SKIPPED): ${matched}`)
  console.log(`  NIK not in 2026/2027 (would be PROMOTED): ${unmatched}`)

  // Also check: how many TP 2026/2027 students have NIKs matching TP 2025/2026?
  const niks2025 = await db
    .select({ nik: students.nik })
    .from(students)
    .where(sql`tahun_pelajaran = '2025/2026' AND school_id = ${schoolId} AND nik IS NOT NULL AND nik != ''`)

  const nikSet2025 = new Set(niks2025.map(r => r.nik))
  const students2026 = await db
    .select({ nik: students.nik, nama: students.nama, kelas: students.kelas_kelompok })
    .from(students)
    .where(sql`tahun_pelajaran = '2026/2027' AND school_id = ${schoolId}`)
    .orderBy(students.kelas_kelompok)

  let fromSpmb = 0, fromPromotion = 0, fromBoth = 0
  for (const s of students2026) {
    if (!s.nik) { fromSpmb++; continue }
    if (nikSet2025.has(s.nik)) fromBoth++
    else fromPromotion++
  }
  console.log(`\nTP 2026/2027 breakdown:`)
  console.log(`  Total: ${students2026.length}`)
  for (const s of students2026) {
    console.log(`  ${s.kelas}: ${s.nama} (${s.nik})`)
  }
}

main().catch(console.error)
