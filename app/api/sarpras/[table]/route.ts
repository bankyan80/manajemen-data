import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { tanah, bangunan, ruang, subRuang, sarana, buku, schools } from '@/db/schema'
import { eq, desc, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

const TABLES: Record<string, any> = { tanah, bangunan, ruang, sub_ruang: subRuang, sarana, buku }

export async function GET(req: NextRequest, { params }: { params: Promise<{ table: string }> }) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const { table } = await params
  const tbl = TABLES[table]
  if (!tbl) return NextResponse.json({ error: `Unknown table: ${table}` }, { status: 400 })

  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const userSekolahId = (session?.user as any)?.sekolah_id

  const { searchParams } = new URL(req.url)
  const schoolId = searchParams.get('school_id')

  let effectiveSchoolId = schoolId
  if (role === 'operator_sekolah' && userSekolahId) {
    effectiveSchoolId = userSekolahId
  }

  let filters = sql`1=1`
  if (effectiveSchoolId && tbl.school_id) filters = sql`${filters} AND ${eq(tbl.school_id, effectiveSchoolId)}`
  if (tbl.ruang_id) {
    const ruangId = searchParams.get('ruang_id')
    if (ruangId) filters = sql`${filters} AND ${eq(tbl.ruang_id, ruangId)}`
  }

  const data = await db.select().from(tbl).where(filters).orderBy(desc(tbl.created_at))
  return NextResponse.json(data)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ table: string }> }) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const { table } = await params
  const tbl = TABLES[table]
  if (!tbl) return NextResponse.json({ error: `Unknown table: ${table}` }, { status: 400 })

  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const userSekolahId = (session?.user as any)?.sekolah_id

  const body = await req.json()
  if (role === 'operator_sekolah' && userSekolahId) {
    body.school_id = userSekolahId
  }

  if (tbl.school_id && !body.school_id) {
    return NextResponse.json({ error: 'school_id required' }, { status: 400 })
  }

  const id = crypto.randomUUID()
  const now = Date.now()

  const insertData: Record<string, any> = { id, created_at: now, updated_at: now }
  for (const key of Object.keys(body)) {
    if (key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
      insertData[key] = body[key]
    }
  }

  await db.insert(tbl).values(insertData)
  return NextResponse.json({ success: true, id })
}
