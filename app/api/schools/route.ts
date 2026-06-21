import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { schools } from '@/db/schema'
import { eq, like } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export async function GET(req: NextRequest) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const userSekolahId = (session?.user as any)?.sekolah_id

  const { searchParams } = new URL(req.url)
  const jenjang = searchParams.get('jenjang')
  const q = searchParams.get('q')

  let query = db.select().from(schools).orderBy(schools.nama).$dynamic()

  if (role === 'operator_sekolah' && userSekolahId) {
    query = query.where(eq(schools.id, userSekolahId))
  }
  if (jenjang) query = query.where(eq(schools.jenjang, jenjang))
  if (q) query = query.where(like(schools.nama, `%${q}%`))

  const rows = await query

  return NextResponse.json(rows)
}
