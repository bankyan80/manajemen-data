import { createClient } from '@libsql/client'

const TURSO_URL = process.env.TURSO_DATABASE_URL!
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN!

async function main() {
  const turso = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN })

  const preview = await turso.execute(`
    SELECT kelas_kelompok, COUNT(*) as count
    FROM students WHERE jenjang = 'kb'
    GROUP BY kelas_kelompok
  `)
  console.log('Before:')
  for (const r of preview.rows) {
    console.log(`  ${r.kelas_kelompok}: ${r.count}`)
  }

  // Use char function for en-dash to avoid encoding issues
  const EN_DASH = '\u2013'
  const sql = `
    UPDATE students
    SET kelas_kelompok = CASE
      WHEN tanggal_lahir IS NULL OR tanggal_lahir = '' THEN '3${EN_DASH}4 Tahun'
      WHEN (julianday('2026-06-27') - julianday(substr(tanggal_lahir,1,10))) / 365.25 < 3 THEN '2${EN_DASH}3 Tahun'
      WHEN (julianday('2026-06-27') - julianday(substr(tanggal_lahir,1,10))) / 365.25 < 4 THEN '3${EN_DASH}4 Tahun'
      ELSE '4${EN_DASH}5 Tahun'
    END
    WHERE jenjang = 'kb'
  `
  const result = await turso.execute(sql)
  console.log(`\nUpdated: ${result.rowsAffected}`)

  const verify = await turso.execute(`
    SELECT kelas_kelompok, COUNT(*) as count
    FROM students WHERE jenjang = 'kb'
    GROUP BY kelas_kelompok
    ORDER BY kelas_kelompok
  `)
  console.log('\nAfter:')
  for (const r of verify.rows) {
    console.log(`  ${r.kelas_kelompok}: ${r.count}`)
  }
}

main().catch(err => { console.error(err); process.exit(1) })
