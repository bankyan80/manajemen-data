import { config } from 'dotenv'
config({ path: '.env' })
import { createClient } from '@libsql/client'

async function main() {
  const c = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! })
  // Revert TK/KB students back to TP 2025/2026
  const r = await c.execute("UPDATE students SET tahun_pelajaran = '2025/2026' WHERE jenjang IN ('tk', 'kb') AND tahun_pelajaran = '2026/2027'")
  console.log(`Updated ${r.rowsAffected} TK/KB students to TP 2025/2026`)
  // Verify
  const v = await c.execute("SELECT tahun_pelajaran, jenjang, COUNT(*) as cnt FROM students GROUP BY tahun_pelajaran, jenjang ORDER BY tahun_pelajaran DESC, jenjang")
  for (const row of v.rows) {
    console.log(row.tahun_pelajaran, row.jenjang, row.cnt)
  }
  process.exit(0)
}
main()
