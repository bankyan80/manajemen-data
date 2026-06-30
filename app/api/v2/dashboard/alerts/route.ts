import { NextRequest, NextResponse } from 'next/server'
import { guardApi, guardDb } from '@/lib/api-guard'
import { db } from '@/lib/db'
import { alerts, schools } from '@/db/schema-v2'
import { eq, desc, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { session, error } = await guardApi()
  if (error) return error
  const dbErr = guardDb(db)
  if (dbErr.error) return dbErr.error

  const role = (session?.user as any)?.role as string
  const userSekolahId = (session?.user as any)?.sekolah_id as string | undefined

  let whereConditions = sql`1=1`
  if (role !== 'admin_kecamatan' && userSekolahId) {
    whereConditions = sql`${whereConditions} AND ${alerts.related_school_id} = ${userSekolahId}`
  }

  const rows = await db!
    .select({
      id: alerts.id,
      type: alerts.type,
      title: alerts.title,
      description: alerts.description,
      related_school_id: alerts.related_school_id,
      related_school_name: schools.nama,
      created_at: alerts.created_at,
    })
    .from(alerts)
    .leftJoin(schools, eq(alerts.related_school_id, schools.id))
    .where(whereConditions)
    .orderBy(desc(alerts.created_at))
    .limit(5)

  return NextResponse.json({ success: true, data: rows })
}
