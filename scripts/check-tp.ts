import { config } from 'dotenv'
config({ path: '.env' })
import { createClient } from '@libsql/client'

async function main() {
  const c = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! })
  const r = await c.execute("SELECT tahun_pelajaran, jenjang, COUNT(*) as cnt FROM students GROUP BY tahun_pelajaran, jenjang ORDER BY tahun_pelajaran DESC, jenjang")
  for (const row of r.rows) {
    console.log(row.tahun_pelajaran, row.jenjang, row.cnt)
  }
  process.exit(0)
}
main()
