import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { students } from '@/db/schema'
import { eq, like, count, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export async function GET(req: NextRequest) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const { searchParams } = new URL(req.url)
  const school_id = searchParams.get('school_id')
  const jenjang = searchParams.get('jenjang')
  const q = searchParams.get('q')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '100')
  const offset = (page - 1) * limit

  let whereConditions = sql`1=1`
  if (school_id) whereConditions = sql`${whereConditions} AND ${students.school_id} = ${school_id}`
  if (jenjang) whereConditions = sql`${whereConditions} AND ${students.jenjang} = ${jenjang}`
  if (q) whereConditions = sql`${whereConditions} AND (${students.nama} like ${`%${q}%`} OR ${students.nisn} like ${`%${q}%`})`

  const [totalResult] = await db.select({ value: count() }).from(students).where(whereConditions)
  const total = totalResult.value

  const rows = await db
    .select()
    .from(students)
    .where(whereConditions)
    .orderBy(students.nama)
    .limit(limit)
    .offset(offset)

  return NextResponse.json({
    data: rows,
    total,
    page,
    limit,
    total_pages: Math.ceil(total / limit),
  })
}
