import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { transitions, schools, students } from '@/db/schema'
import { eq, and, like, count, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export async function GET(req: NextRequest) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const userSekolahId = (session?.user as any)?.sekolah_id

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const q = searchParams.get('q')

  let whereConditions = sql`1=1`

  if (role === 'operator_sekolah' && userSekolahId) {
    whereConditions = sql`${whereConditions} AND ${transitions.school_id} = ${userSekolahId}`
  }
  if (status) whereConditions = sql`${whereConditions} AND ${transitions.status_transisi} = ${status}`
  if (q) whereConditions = sql`${whereConditions} AND (${transitions.nama} like ${`%${q}%`} OR ${transitions.nisn} like ${`%${q}%`})`

  const rows = await db
    .select({
      id: transitions.id,
      school_id: transitions.school_id,
      student_id: transitions.student_id,
      tahun_pelajaran: transitions.tahun_pelajaran,
      nama: transitions.nama,
      nisn: transitions.nisn,
      jenis_kelamin: transitions.jenis_kelamin,
      kelas: transitions.kelas,
      status_transisi: transitions.status_transisi,
      smp_tujuan: transitions.smp_tujuan,
      kesiapan: transitions.kesiapan,
      kegiatan_transisi: transitions.kegiatan_transisi,
      keterangan: transitions.keterangan,
      created_at: transitions.created_at,
      school_nama: schools.nama,
    })
    .from(transitions)
    .leftJoin(schools, eq(transitions.school_id, schools.id))
    .where(whereConditions)
    .orderBy(transitions.nama)

  const recap = await db
    .select({
      status_transisi: transitions.status_transisi,
      total: count(),
    })
    .from(transitions)
    .where(whereConditions)
    .groupBy(transitions.status_transisi)

  return NextResponse.json({ data: rows, recap })
}

export async function POST(req: NextRequest) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const userSekolahId = (session?.user as any)?.sekolah_id

  const body = await req.json()

  const insert: Record<string, any> = {
    school_id: body.school_id || userSekolahId,
    tahun_pelajaran: body.tahun_pelajaran,
    nama: body.nama,
    nisn: body.nisn || null,
    jenis_kelamin: body.jenis_kelamin || null,
    kelas: body.kelas,
    status_transisi: body.status_transisi || 'calon_masuk',
    smp_tujuan: body.smp_tujuan || null,
    kesiapan: body.kesiapan || null,
    kegiatan_transisi: body.kegiatan_transisi || null,
    keterangan: body.keterangan || null,
  }

  if (body.student_id) insert.student_id = body.student_id

  const [result] = await db.insert(transitions).values(insert).returning()

  return NextResponse.json({ data: result })
}
