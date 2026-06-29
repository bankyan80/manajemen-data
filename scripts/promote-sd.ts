import 'dotenv/config'
import { db } from '../lib/db'
import { students } from '../db/schema'
import { sql, eq, and, inArray } from 'drizzle-orm'

const ROMAN: Record<string, number> = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6 }
const NUM: Record<number, string> = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI' }

// Parse grade from any supported format, return numeric grade (1-6) + suffix string
function parseGrade(s: string): { num: number; suffix: string } | null {
  // "Kelas I" through "Kelas VI" (possibly with suffix like "Kelas II A")
  let m = s.match(/^Kelas\s+(IV|VI|V|I{1,3})\s*(.*)$/i)
  if (m) {
    const n = ROMAN[m[1].toUpperCase()]
    if (n) return { num: n, suffix: m[2].trim() }
    return null
  }
  // Roman + letter: "I A", "II B", "VI C"
  m = s.match(/^(IV|VI|V|I{1,3})\s+([A-Z])$/i)
  if (m) {
    const n = ROMAN[m[1].toUpperCase()]
    if (n) return { num: n, suffix: m[2] }
    return null
  }
  // Plain roman: "I", "II", "VI"
  m = s.match(/^(IV|VI|V|I{1,3})$/i)
  if (m) {
    const n = ROMAN[m[1].toUpperCase()]
    if (n) return { num: n, suffix: '' }
    return null
  }
  // Digit: "1", "2", "6"
  m = s.match(/^(\d)$/)
  if (m) {
    const n = parseInt(m[1])
    if (n >= 1 && n <= 6) return { num: n, suffix: '' }
    return null
  }
  // Digit+letter: "1A", "2B", "6A"
  m = s.match(/^(\d)([A-Z])$/)
  if (m) {
    const n = parseInt(m[1])
    if (n >= 1 && n <= 6) return { num: n, suffix: m[2] }
    return null
  }
  return null
}

async function main() {
  const allSd = await db
    .select({ id: students.id, nama: students.nama, kelas: students.kelas_kelompok })
    .from(students)
    .where(and(eq(students.jenjang, 'sd'), eq(students.tahun_pelajaran, '2026/2027'), eq(students.status_siswa, 'aktif')))

  console.log('Total aktif SD:', allSd.length)

  const promoMap = new Map<string, string[]>() // newGrade -> ids[]
  const graduateIds: string[] = []
  const unknown: { nama: string; kelas: string; reason?: string }[] = []

  for (const s of allSd) {
    const parsed = parseGrade(s.kelas)
    if (!parsed) { unknown.push({ nama: s.nama, kelas: s.kelas, reason: 'unrecognized format' }); continue }

    const newNum = parsed.num + 1
    if (newNum > 6) { graduateIds.push(s.id); continue }

    // Build promoted grade: "Kelas X" + optional suffix
    const suffix = parsed.suffix ? ` ${parsed.suffix}` : ''
    const newGrade = `Kelas ${NUM[newNum]}${suffix}`

    const ids = promoMap.get(newGrade) || []
    ids.push(s.id)
    promoMap.set(newGrade, ids)
  }

  // Execute promotions in batch
  let promoted = 0
  for (const [newGrade, ids] of promoMap) {
    await db.update(students).set({ kelas_kelompok: newGrade }).where(inArray(students.id, ids))
    promoted += ids.length
    console.log(`  ${ids.length} -> "${newGrade}"`)
  }

  // Execute graduations
  if (graduateIds.length > 0) {
    await db.update(students).set({ status_siswa: 'lulus' }).where(inArray(students.id, graduateIds))
    console.log(`  ${graduateIds.length} -> graduated`)
  }

  console.log(`\nPromoted: ${promoted}, Graduated: ${graduateIds.length}, Unknown: ${unknown.length}`)
  if (unknown.length > 0) {
    const unkCount: Record<string, number> = {}
    for (const u of unknown) { unkCount[u.kelas] = (unkCount[u.kelas] || 0) + 1 }
    for (const [g, c] of Object.entries(unkCount).sort()) console.log(`  "${g}": ${c}`)
  }

  // Verify
  const after = await db
    .select({ kelas: students.kelas_kelompok, count: sql<number>`COUNT(*)` })
    .from(students)
    .where(and(eq(students.jenjang, 'sd'), eq(students.tahun_pelajaran, '2026/2027'), eq(students.status_siswa, 'aktif')))
    .groupBy(students.kelas_kelompok)
    .orderBy(students.kelas_kelompok)

  console.log(`\nAfter promotion (aktif only):`)
  let totalAktif = 0
  for (const g of after) { console.log(`  ${g.kelas}: ${g.count}`); totalAktif += g.count }
  console.log(`Total aktif: ${totalAktif}`)
}
main().catch(console.error)
