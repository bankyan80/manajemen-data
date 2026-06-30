import { NextRequest, NextResponse } from 'next/server'
import { guardApi, guardDb } from '@/lib/api-guard'
import { db } from '@/lib/db'
import { schools, employees, students } from '@/db/schema-v2'
import { count, eq, sql, desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { session, error } = await guardApi()
  if (error) return error
  const dbErr = guardDb(db)
  if (dbErr.error) return dbErr.error

  const _db = db!
  const role = (session?.user as any)?.role as string
  const userSekolahId = (session?.user as any)?.sekolah_id as string | undefined

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')
  const jenjang = searchParams.get('jenjang')
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const offset = (page - 1) * limit

  let whereConditions = sql`1=1`
  if (role !== 'admin_kecamatan' && userSekolahId) {
    whereConditions = sql`${whereConditions} AND ${schools.id} = ${userSekolahId}`
  }
  if (jenjang) whereConditions = sql`${whereConditions} AND ${schools.jenjang} = ${jenjang}`
  if (q) whereConditions = sql`${whereConditions} AND (${schools.nama} LIKE ${'%' + q + '%'} OR ${schools.npsn} LIKE ${'%' + q + '%'})`

  const [totalResult] = await _db.select({ value: count() }).from(schools).where(whereConditions)
  const total = totalResult.value

  const rows = await _db
    .select({
      id: schools.id,
      nama: schools.nama,
      npsn: schools.npsn,
      jenjang: schools.jenjang,
      status: schools.status,
      alamat: schools.alamat,
      desa: schools.desa,
      kecamatan: schools.kecamatan,
      kepala_id: schools.kepala_id,
      latitude: schools.latitude,
      longitude: schools.longitude,
      health_score: schools.health_score,
      is_active: schools.is_active,
      created_at: schools.created_at,
      updated_at: schools.updated_at,
      teacherCount: sql<number>`(SELECT COUNT(*) FROM ${employees} WHERE ${employees.sekolah_id} = ${schools.id} AND ${employees.is_active} = 1)`,
      studentCount: sql<number>`(SELECT COUNT(*) FROM ${students} WHERE ${students.school_id} = ${schools.id} AND ${students.status_siswa} = 'aktif')`,
    })
    .from(schools)
    .where(whereConditions)
    .orderBy(desc(schools.created_at))
    .limit(limit)
    .offset(offset)

  return NextResponse.json({
    success: true,
    data: rows,
    pagination: { total, page, limit, total_pages: Math.ceil(total / limit) },
  })
}
