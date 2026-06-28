import 'dotenv/config'
import { db } from '../lib/db'
import { students } from '../db/schema'
import { sql } from 'drizzle-orm'

async function main() {
  if (!db) { console.log('DB not available'); return }

  // By jenjang + status
  for (const jenjang of ['sd','tk','kb']) {
    const aktif = await db.select({ count: sql<number>`COUNT(*)` }).from(students)
      .where(sql`jenjang=${jenjang} AND status_siswa='aktif'`)
    const semua = await db.select({ count: sql<number>`COUNT(*)` }).from(students)
      .where(sql`jenjang=${jenjang}`)
    console.log(`${jenjang.toUpperCase()} — aktif: ${aktif[0].count}, total: ${semua[0].count}`)
  }

  // By TP
  for (const tp of ['2026/2027', '2025/2026']) {
    const r = await db.select({ count: sql<number>`COUNT(*)` }).from(students)
      .where(sql`tahun_pelajaran=${tp}`)
    console.log(`TP ${tp}: ${r[0].count}`)
  }
}

main().catch(console.error)
