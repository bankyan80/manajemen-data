import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { alumni, schools } from '@/db/schema-v2'
import { eq, sql, count, desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const userSekolahId = (session?.user as any)?.sekolah_id

  const { searchParams } = new URL(req.url)
  const school_id = searchParams.get('school_id')
  const tahun_lulus = searchParams.get('tahun_lulus')
  const q = searchParams.get('q')
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const offset = (page - 1) * limit

  let whereConditions = sql`1=1`
  if (role === 'operator_sekolah' && userSekolahId) {
    whereConditions = sql`${whereConditions} AND ${alumni.school_id} = ${userSekolahId}`
  } else if (school_id) {
    whereConditions = sql`${whereConditions} AND ${alumni.school_id} = ${school_id}`
  }
  if (tahun_lulus) whereConditions = sql`${whereConditions} AND ${alumni.tahun_lulus} = ${tahun_lulus}`
  if (q) {
    whereConditions = sql`${whereConditions} AND (${alumni.nama} LIKE ${'%' + q + '%'} OR ${alumni.nisn} LIKE ${'%' + q + '%'} OR ${alumni.nik} LIKE ${'%' + q + '%'})`
  }

  const [totalResult] = await db.select({ value: count() }).from(alumni).leftJoin(schools, eq(alumni.school_id, schools.id)).where(whereConditions)

  const rows = await db
    .select({
      id: alumni.id,
      school_id: alumni.school_id,
      school_nama: schools.nama,
      school_npsn: schools.npsn,
      tahun_lulus: alumni.tahun_lulus,
      nama: alumni.nama,
      nisn: alumni.nisn,
      nik: alumni.nik,
      jenis_kelamin: alumni.jenis_kelamin,
      tempat_lahir: alumni.tempat_lahir,
      tanggal_lahir: alumni.tanggal_lahir,
      kelas: alumni.kelas,
      tujuan: alumni.tujuan,
    })
    .from(alumni)
    .leftJoin(schools, eq(alumni.school_id, schools.id))
    .where(whereConditions)
    .orderBy(desc(alumni.tahun_lulus), alumni.kelas, alumni.nama)
    .limit(limit)
    .offset(offset)

  const tahunList = await db
    .select({ tahun: alumni.tahun_lulus })
    .from(alumni)
    .where(whereConditions)
    .groupBy(alumni.tahun_lulus)
    .orderBy(desc(alumni.tahun_lulus))

  return NextResponse.json({
    data: rows,
    total: totalResult.value,
    page, limit,
    total_pages: Math.ceil(totalResult.value / limit),
    tahun_list: tahunList.map(t => t.tahun),
  })

  } catch (e) {
    console.error('[API Error]', e);
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Internal error' }, { status: 500 });
  }
  }

export async function POST(req: NextRequest) {
  try {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session?.user as any)?.role
  const userSekolahId = (session?.user as any)?.sekolah_id

  const body = await req.json()
  const schoolId = role === 'operator_sekolah' ? userSekolahId : body.school_id
  if (!schoolId) return NextResponse.json({ error: 'School ID wajib' }, { status: 400 })
  if (!body.tahun_lulus || !body.nama || !body.kelas) {
    return NextResponse.json({ error: 'Tahun lulus, nama, dan kelas wajib' }, { status: 400 })
  }

  const id = crypto.randomUUID()
  const now = Date.now()
  await db.insert(alumni).values({
    id,
    school_id: schoolId,
    tahun_lulus: body.tahun_lulus,
    nama: body.nama,
    nisn: body.nisn || null,
    nik: body.nik || null,
    jenis_kelamin: body.jenis_kelamin || null,
    tempat_lahir: body.tempat_lahir || null,
    tanggal_lahir: body.tanggal_lahir || null,
    kelas: body.kelas,
    tujuan: body.tujuan || null,
    created_at: now,
    updated_at: now,
  })

  return NextResponse.json({ success: true, id }, { status: 201 })
  } catch (e) {
    console.error('[API Error]', e)
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Internal error' }, { status: 500 })
  }
}
