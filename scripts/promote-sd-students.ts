import 'dotenv/config'
import { db } from '../lib/db'
import { students } from '../db/schema'
import { sql, eq, and, inArray } from 'drizzle-orm'

const ROMAN_NUM: Record<string, number> = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6 }
const NUM_ROMAN: Record<number, string> = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI' }

function parseGrade(s: string): { num: number; suffix: string } | null {
  // Try "Kelas X" format
  const m1 = s.match(/^Kelas\s+(IV|VI|I{1,3}|V)\s*(.*)$/i)
  if (m1) {
    const n = ROMAN_NUM[m1[1].toUpperCase()]
    if (n) return { num: n, suffix: m1[2].trim() }
    return null
  }
  // Try "I A", "II B", "VI C" etc (roman + letter)
  const m2 = s.match(/^(IV|VI|I{1,3}|V)\s+([A-Z])$/i)
  if (m2) {
    const n = ROMAN_NUM[m2[1].toUpperCase()]
    if (n) return { num: n, suffix: m2[2] }
    return null
  }
  // Try "1A", "2B", "6A" etc (digit + optional letter)
  const m3 = s.match(/^(\d)\s*([A-Z])?$/)
  if (m3) {
    const n = parseInt(m3[1])
    if (n >= 1 && n <= 6) return { num: n, suffix: m3[2] || '' }
    return null
  }
  // Try plain roman "I", "II", "VI" etc
  const m4 = s.match(/^(IV|VI|I{1,3}|V)$/i)
  if (m4) {
    const n = ROMAN_NUM[m4[1].toUpperCase()]
    if (n) return { num: n, suffix: '' }
    return null
  }
  // Try plain digit "1", "2" etc
  const m5 = s.match(/^(\d)$/)
  if (m5) {
    const n = parseInt(m5[1])
    if (n >= 1 && n <= 6) return { num: n, suffix: '' }
    return null
  }
  return null
}

function promoteGrade(s: string): { newGrade: string | null; shouldGraduate: boolean } {
  const parsed = parseGrade(s)
  if (!parsed) return { newGrade: null, shouldGraduate: false }

  const newNum = parsed.num + 1
  if (newNum > 6) {
    return { newGrade: null, shouldGraduate: true }
  }

  const roman = NUM_ROMAN[newNum]
  const suffix = parsed.suffix ? ` ${parsed.suffix}` : ''
  return { newGrade: `Kelas ${roman}${suffix}`, shouldGraduate: false }
}

async function main() {
  const allSd = await db
    .select({ id: students.id, nama: students.nama, kelas: students.kelas_kelompok, tp: students.tahun_pelajaran })
    .from(students)
    .where(and(eq(students.jenjang, 'sd'), eq(students.tahun_pelajaran, '2026/2027'), eq(students.status_siswa, 'aktif')))

  console.log('Total aktif SD:', allSd.length)

  const promoteMap = new Map<string, string[]>() // newGrade -> ids
  const graduateIds: string[] = []
  const unknown: { nama: string; kelas: string }[] = []

  for (const s of allSd) {
    const result = promoteGrade(s.kelas)
    if (result.shouldGraduate) {
      graduateIds.push(s.id)
    } else if (result.newGrade) {
      const ids = promoteMap.get(result.newGrade) || []
      ids.push(s.id)
      promoteMap.set(result.newGrade, ids)
    } else {
      unknown.push({ nama: s.nama, kelas: s.kelas })
    }
  }

  let promotedCount = 0
  for (const [newGrade, ids] of promoteMap) {
    await db.update(students).set({ kelas_kelompok: newGrade }).where(inArray(students.id, ids))
    promotedCount += ids.length
    console.log(`  ${ids.length} -> "${newGrade}"`)
  }

  if (graduateIds.length > 0) {
    await db.update(students).set({ status_siswa: 'lulus' }).where(inArray(students.id, graduateIds))
    console.log(`  ${graduateIds.length} -> graduated`)
  }

  console.log(`\nPromoted: ${promotedCount}, Graduated: ${graduateIds.length}`)

  if (unknown.length > 0) {
    console.log(`\nUnrecognized grades (${unknown.length}):`)
    // Count by grade
    const unkCount: Record<string, number> = {}
    for (const u of unknown) { unkCount[u.kelas] = (unkCount[u.kelas] || 0) + 1 }
    for (const [g, c] of Object.entries(unkCount)) console.log(`  "${g}": ${c}`)
  }

  const after = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(students)
    .where(and(eq(students.jenjang, 'sd'), eq(students.tahun_pelajaran, '2026/2027'), eq(students.status_siswa, 'aktif')))
  console.log(`\nTotal aktif SD after: ${after[0].count}`)
}
main().catch(console.error)
