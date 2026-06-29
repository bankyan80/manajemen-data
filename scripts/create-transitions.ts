import 'dotenv/config'
import { db } from '../lib/db'
import { students, transitions } from '../db/schema'
import { sql, eq, and, inArray } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

async function main() {
  // Get graduated SD students
  const graduated = await db
    .select({ id: students.id, school_id: students.school_id, nama: students.nama, nisn: students.nisn, jenis_kelamin: students.jenis_kelamin, tp: students.tahun_pelajaran })
    .from(students)
    .where(and(eq(students.jenjang, 'sd'), eq(students.tahun_pelajaran, '2026/2027'), eq(students.status_siswa, 'lulus')))

  console.log('Graduated students:', graduated.length)

  // Check which ones already have transition records
  const gradIds = graduated.map(s => s.id)
  const existing = await db
    .select({ student_id: transitions.student_id })
    .from(transitions)
    .where(inArray(transitions.student_id, gradIds))

  const existingIds = new Set(existing.map(e => e.student_id))

  // Batch insert
  const batch: any[] = []
  for (const s of graduated) {
    if (existingIds.has(s.id)) continue
    const jk = s.jenis_kelamin === 'L' ? 'laki-laki' : s.jenis_kelamin === 'P' ? 'perempuan' : s.jenis_kelamin
    batch.push({
      id: uuidv4(),
      school_id: s.school_id,
      student_id: s.id,
      tahun_pelajaran: s.tp,
      nama: s.nama,
      nisn: s.nisn || null,
      jenis_kelamin: jk || null,
      kelas: 'Kelas VI',
      status_transisi: 'calon_masuk',
    })
  }

  console.log(`To create: ${batch.length}, Already exist: ${existing.length}`)

  // Bulk insert (drizzle supports multi-row insert with array of values)
  if (batch.length > 0) {
    await db.insert(transitions).values(batch as any[])
    console.log(`  Bulk inserted ${batch.length} records`)
  }

  console.log('Done!')
}
main().catch(console.error)
