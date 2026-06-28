import 'dotenv/config'
import { db } from '../lib/db'
import { schools } from '../db/schema'

async function main() {
  const rows = await db.select().from(schools).orderBy(schools.nama)
  for (const s of rows) {
    console.log(`${s.id}\t${s.jenjang}\t${s.npsn || '-'}\t${s.nama}`)
  }
  console.log(`\nTotal: ${rows.length} schools`)
}

main().catch(console.error)
