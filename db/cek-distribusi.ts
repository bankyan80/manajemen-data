import 'dotenv/config'
import { createClient } from '@libsql/client'

async function main() {
  const c = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN })
  
  const r = await c.execute("SELECT sc.jenjang as school_jenjang, COUNT(*) as cnt FROM students s JOIN schools sc ON s.school_id=sc.id GROUP BY sc.jenjang")
  r.rows.forEach((row: any) => console.log(row.school_jenjang, row.cnt))

  await c.close()
}
main()
