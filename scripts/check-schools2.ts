import 'dotenv/config'
import { db } from '../lib/db'
import { schools } from '../db/schema'

async function main() {
  const s = await db.select().from(schools).limit(1)
  console.log(Object.keys(s[0]))
  console.log(JSON.stringify(s[0], null, 2))
}

main().catch(console.error)
