import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth-v2'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'

export type Role = 'admin_kecamatan' | 'operator_sekolah' | 'guru_tendik'

export async function guardApi(requiredRole?: Role) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { session: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  const role = (session.user as unknown as Record<string, unknown>).role as string
  if (requiredRole && role !== requiredRole && role !== 'admin_kecamatan') {
    return { session: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { session, error: null }
}

export function guardDb(db: LibSQLDatabase<Record<string, unknown>> | null) {
  if (!db) {
    return { error: NextResponse.json({ error: 'DB not configured' }, { status: 500 }) }
  }
  return { error: null }
}
