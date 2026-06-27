import { createClient } from '@libsql/client'

async function main() {
  const turso = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! })

  const before = await turso.execute("SELECT tahun_pelajaran, COUNT(*) as c FROM students GROUP BY tahun_pelajaran")
  console.log('Before:')
  for (const r of before.rows) console.log(' ', r.tahun_pelajaran, ':', r.c)

  const result = await turso.execute("UPDATE students SET tahun_pelajaran = '2026/2027' WHERE tahun_pelajaran = '2025/2026'")
  console.log('\nUpdated:', result.rowsAffected, 'rows')

  const after = await turso.execute("SELECT tahun_pelajaran, COUNT(*) as c FROM students GROUP BY tahun_pelajaran")
  console.log('After:')
  for (const r of after.rows) console.log(' ', r.tahun_pelajaran, ':', r.c)
}

main().catch(e => { console.error(e); process.exit(1) })
