import 'dotenv/config'
import { db } from '../lib/db'
import { schools, students } from '../db/schema'
import { eq, sql, and, isNull } from 'drizzle-orm'

async function main() {
  const schoolRows = await db.select().from(schools)
  const sm = new Map(schoolRows.map(s => [s.id, s.nama]))

  const sids = ['774e132c-5db6-4d1e-9b03-42d03c3b62c2', '887c6040-152e-436f-8b24-423734a97b6a']
  for (const sid of sids) {
    const total = await db.select({ count: sql<number>`COUNT(*)` }).from(students).where(and(eq(students.school_id, sid), eq(students.status_siswa, 'aktif')))
    const noNik = await db.select({ count: sql<number>`COUNT(*)` }).from(students).where(and(eq(students.school_id, sid), eq(students.status_siswa, 'aktif'), sql`(nik IS NULL OR nik = '')`))
    console.log(`${sm.get(sid)}: total ${total[0].count}, tanpa NIK: ${noNik[0].count}`)
  }
}
main().catch(console.error)
