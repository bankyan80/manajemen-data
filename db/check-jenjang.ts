import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { students, schools } from './schema'
import { eq, sql } from 'drizzle-orm'

async function main() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })
  const db2 = drizzle(client)

  const jenjangs = await db2.select({ jenjang: students.jenjang }).from(students).groupBy(students.jenjang)
  console.log('=== Distinct student jenjang values ===')
  console.log(JSON.stringify(jenjangs, null, 2))

  for (const j of jenjangs) {
    const [cnt] = await db2.select({ total: sql<number>`COUNT(*)` }).from(students).where(eq(students.jenjang, j.jenjang))
    console.log('Count for ' + j.jenjang + ': ' + cnt.total)
  }

  const kbStudents = await db2.select({
    school_id: students.school_id,
    school_nama: schools.nama,
    school_jenjang: schools.jenjang,
  })
  .from(students)
  .leftJoin(schools, eq(students.school_id, schools.id))
  .where(eq(students.jenjang, 'kb'))
  .groupBy(students.school_id)

  console.log('=== Schools with students.jenjang=kb ===')
  console.log(JSON.stringify(kbStudents, null, 2))

  const sdStudents = await db2.select({
    school_id: students.school_id,
    school_nama: schools.nama,
    school_jenjang: schools.jenjang,
  })
  .from(students)
  .leftJoin(schools, eq(students.school_id, schools.id))
  .where(eq(students.jenjang, 'sd'))
  .groupBy(students.school_id)

  console.log('=== Schools with students.jenjang=sd ===')
  console.log(JSON.stringify(sdStudents, null, 2))
}

main().catch(err => { console.error('ERROR:', err.message, err.stack); process.exit(1) })
