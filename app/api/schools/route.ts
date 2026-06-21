import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { schools } from '@/db/schema'
import { eq, like, count } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export async function GET(req: NextRequest) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const { searchParams } = new URL(req.url)
  const jenjang = searchParams.get('jenjang')
  const q = searchParams.get('q')

  let query = db.select().from(schools).orderBy(schools.nama).$dynamic()

  if (jenjang) query = query.where(eq(schools.jenjang, jenjang))
  if (q) query = query.where(like(schools.nama, `%${q}%`))

  const rows = await query

  return NextResponse.json(rows)
}
