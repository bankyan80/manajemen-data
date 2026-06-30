import { NextRequest, NextResponse } from 'next/server'
import { guardApi, guardDb } from '@/lib/api-guard'
import { db } from '@/lib/db'
import { arsipDigital, schools } from '@/db/schema-v2'
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
  const category = searchParams.get('category')
  const school_id = searchParams.get('school_id')
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const offset = (page - 1) * limit

  let whereConditions = sql`1=1`

  if (role !== 'admin_kecamatan' && userSekolahId) {
    whereConditions = sql`${whereConditions} AND (${arsipDigital.school_id} = ${userSekolahId} OR ${arsipDigital.school_id} IS NULL)`
  }
  if (school_id) whereConditions = sql`${whereConditions} AND ${arsipDigital.school_id} = ${school_id}`
  if (category) whereConditions = sql`${whereConditions} AND ${arsipDigital.category} = ${category}`
  if (q) {
    whereConditions = sql`${whereConditions} AND (${arsipDigital.file_name} LIKE ${'%' + q + '%'} OR ${arsipDigital.deskripsi} LIKE ${'%' + q + '%'})`
  }

  const [totalResult] = await _db
    .select({ value: count() })
    .from(arsipDigital)
    .where(whereConditions)
  const total = totalResult.value

  const rows = await _db
    .select({
      id: arsipDigital.id,
      category: arsipDigital.category,
      document_type: arsipDigital.document_type,
      file_name: arsipDigital.file_name,
      file_type: arsipDigital.file_type,
      file_size: arsipDigital.file_size,
      file_url: arsipDigital.file_url,
      deskripsi: arsipDigital.deskripsi,
      uploaded_by: arsipDigital.uploaded_by,
      uploaded_at: arsipDigital.uploaded_at,
      school_nama: schools.nama,
    })
    .from(arsipDigital)
    .leftJoin(schools, eq(arsipDigital.school_id, schools.id))
    .where(whereConditions)
    .orderBy(desc(arsipDigital.uploaded_at))
    .limit(limit)
    .offset(offset)

  return NextResponse.json({
    success: true,
    data: rows,
    pagination: { total, page, limit, total_pages: Math.ceil(total / limit) },
  })
}
