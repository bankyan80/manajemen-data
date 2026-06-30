import { db } from './lib/db'
import { users } from './db/schema'
import { eq } from 'drizzle-orm'

async function main() {
  if (!db) { console.log('DB not available'); return }
  const result = await db.select({
    username: users.username,
    name: users.name,
    role: users.role,
  }).from(users).where(eq(users.is_active, 1))
  console.log('=== USER ACCOUNTS ===')
  result.forEach(u => console.log(`${u.username}\t${u.name}\t${u.role}`))
  console.log(`\nTotal: ${result.length} users`)
}

main().catch(console.error)
