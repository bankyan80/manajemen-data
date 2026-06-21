import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { infrastructure, schools } from '@/db/schema'
import { eq, desc, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const userSekolahId = (session?.user as any)?.sekolah_id

  const { searchParams } = new URL(req.url)
  const schoolId = searchParams.get('school_id')
  const kategori = searchParams.get('kategori')

  let effectiveSchoolId = schoolId
  if (role === 'operator_sekolah' && userSekolahId) {
    effectiveSchoolId = userSekolahId
  }

  let filters = sql`1=1`
  if (effectiveSchoolId) filters = sql`${filters} AND ${eq(infrastructure.school_id, effectiveSchoolId)}`
  if (kategori) filters = sql`${filters} AND ${eq(infrastructure.kategori, kategori)}`

  const data = await db
    .select({
      id: infrastructure.id,
      school_id: infrastructure.school_id,
      school_nama: schools.nama,
      school_npsn: schools.npsn,
      tahun_pelajaran: infrastructure.tahun_pelajaran,
      kategori: infrastructure.kategori,
      data: infrastructure.data,
      keterangan: infrastructure.keterangan,
    })
    .from(infrastructure)
    .leftJoin(schools, eq(infrastructure.school_id, schools.id))
    .where(filters)
    .orderBy(infrastructure.kategori, desc(infrastructure.created_at))

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const userSekolahId = (session?.user as any)?.sekolah_id

  const body = await req.json()
  let { school_id, tahun_pelajaran, kategori, data, keterangan } = body

  if (role === 'operator_sekolah' && userSekolahId) {
    school_id = userSekolahId
  }

  if (!school_id || !tahun_pelajaran || !kategori) {
    return NextResponse.json({ error: 'school_id, tahun_pelajaran, kategori required' }, { status: 400 })
  }

  // Cek apakah sudah ada — update instead of insert
  const existing = await db
    .select({ id: infrastructure.id })
    .from(infrastructure)
    .where(sql`${eq(infrastructure.school_id, school_id)} AND ${eq(infrastructure.kategori, kategori)} AND ${eq(infrastructure.tahun_pelajaran, tahun_pelajaran)}`)
    .limit(1)

  if (existing.length > 0) {
    await db.update(infrastructure)
      .set({
        data: typeof data === 'string' ? data : JSON.stringify(data || {}),
        keterangan: keterangan || null,
        updated_at: Date.now(),
      })
      .where(eq(infrastructure.id, existing[0].id))
    return NextResponse.json({ success: true, id: existing[0].id, updated: true })
  }

  const id = crypto.randomUUID()
  const now = Date.now()

  await db.insert(infrastructure).values({
    id,
    school_id,
    tahun_pelajaran,
    kategori,
    data: typeof data === 'string' ? data : JSON.stringify(data || {}),
    keterangan: keterangan || null,
    created_at: now,
    updated_at: now,
  })

  return NextResponse.json({ success: true, id })
}
