import 'dotenv/config'
import { db } from '../lib/db'
import { schools, students } from './schema'
import { eq, like, sql } from 'drizzle-orm'

async function main() {
  if (!db) {
    console.error('Database not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.')
    process.exit(1)
  }

  console.log('Mencari sekolah KB yang seharusnya TK...')

  const tkSchools = await db
    .select({ id: schools.id, nama: schools.nama, npsn: schools.npsn })
    .from(schools)
    .where(sql`${schools.jenjang} = 'kb' AND ${schools.nama} LIKE 'TK%'`)

  if (tkSchools.length === 0) {
    console.log('Tidak ada sekolah KB dengan nama berawalan "TK". Tidak ada perubahan.')
    return
  }

  console.log(`\nDitemukan ${tkSchools.length} sekolah:`)
  for (const s of tkSchools) {
    console.log(`  ${s.npsn} - ${s.nama}`)
  }

  const ids = tkSchools.map(s => s.id)

  console.log('\nMengupdate jenjang sekolah...')
  const schResult = await db
    .update(schools)
    .set({ jenjang: 'tk', updated_at: Date.now() })
    .where(sql`${schools.id} IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`)
    .returning({ id: schools.id, nama: schools.nama, jenjang: schools.jenjang })

  console.log(`  ✓ ${schResult.length} sekolah diupdate ke jenjang 'tk'`)

  console.log('\nMengupdate jenjang siswa di sekolah tersebut...')
  const stuResult = await db
    .update(students)
    .set({ jenjang: 'tk', updated_at: Date.now() })
    .where(sql`${students.school_id} IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`)
    .returning({ id: students.id, jenjang: students.jenjang })

  console.log(`  ✓ ${stuResult.length} siswa diupdate ke jenjang 'tk'`)

  console.log('\n✅ Selesai!')
}

main().catch((err) => {
  console.error('Gagal:', err)
  process.exit(1)
})
