import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'

function createDb() {
  const url = process.env.TURSO_DATABASE_URL
  if (!url) return null

  const turso = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })

  return drizzle(turso)
}

export const db = createDb()

export default db
