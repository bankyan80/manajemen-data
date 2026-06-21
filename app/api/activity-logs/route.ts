import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { activityLogs, users } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export async function GET() {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const rows = await db
    .select({
      id: activityLogs.id,
      user_id: activityLogs.user_id,
      action: activityLogs.action,
      table_name: activityLogs.table_name,
      record_id: activityLogs.record_id,
      description: activityLogs.description,
      created_at: activityLogs.created_at,
      user_name: users.name,
      user_role: users.role,
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.user_id, users.id))
    .orderBy(desc(activityLogs.created_at))
    .limit(100)

  return NextResponse.json(rows)
}
