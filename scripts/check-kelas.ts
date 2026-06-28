import 'dotenv/config'
import { db } from '../lib/db'
import { students } from '../db/schema'
import { schools } from '../db/schema'
import { eq, sql } from 'drizzle-orm'

async function main() {
  if (!db) { console.log('DB not available'); return }

  // Find ALL records with this NIK
  const all = await db
    .select({ id: students.id, nama: students.nama, nik: students.nik, kelas: students.kelas_kelompok, school_id: students.school_id, tp: students.tahun_pelajaran, status: students.status_siswa, jenjang: students.jenjang, created_at: students.created_at, updated_at: students.updated_at })
    .from(students)
    .where(sql`nik = '3209073103200001'`)

  for (const r of all) {
    const s = await db.select({ nama: schools.nama }).from(schools).where(eq(schools.id, r.school_id)).limit(1)
    console.log(`${r.id} | ${r.nama} | ${r.jenjang} | ${r.kelas} | ${r.status} | ${r.tp} | ${s[0]?.nama} | created: ${r.created_at} | updated: ${r.updated_at}`)
  }

  console.log(`\nTotal records for NIK 3209073103200001: ${all.length}`)
}

main().catch(console.error)
