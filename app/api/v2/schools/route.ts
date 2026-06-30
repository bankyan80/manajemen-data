import { NextRequest, NextResponse } from 'next/server'
import { safeApi } from '@/lib/api-handler'
import { guardApi } from '@/lib/api-guard'
import { db } from '@/lib/db'
import { schools, employees, students } from '@/db/schema'
import { count, eq, sql, desc, inArray } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export const GET = (req: NextRequest) => safeApi(async () => {
  const { session, error } = await guardApi()
  if (error) return error
  if (!db) return NextResponse.json({ success: false, error: 'DB not configured' }, { status: 500 })

  const _db = db
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
      is_active: schools.is_active,
      created_at: schools.created_at,
      updated_at: schools.updated_at,
    })
    .from(schools)
    .where(whereConditions)
    .orderBy(desc(schools.created_at))
    .limit(limit)
    .offset(offset)

  // Bulk fetch counts to avoid subquery parameter binding issues
  const schoolIds = rows.map(r => r.id)
  const teacherCounts = schoolIds.length > 0
    ? await _db
        .select({ school_id: employees.sekolah_id, value: count() })
        .from(employees)
        .where(inArray(employees.sekolah_id, schoolIds as [string, ...string[]]))
        .groupBy(employees.sekolah_id)
    : []
  const studentCounts = schoolIds.length > 0
    ? await _db
        .select({ school_id: students.school_id, value: count() })
        .from(students)
        .where(inArray(students.school_id, schoolIds as [string, ...string[]]))
        .groupBy(students.school_id)
    : []

  const tcMap = new Map(teacherCounts.map(t => [t.school_id, Number(t.value)]))
  const scMap = new Map(studentCounts.map(s => [s.school_id, Number(s.value)]))

  const mapped = rows.map(r => ({
    ...r,
    health_score: 0,
    teacherCount: tcMap.get(r.id) || 0,
    studentCount: scMap.get(r.id) || 0,
  }))

  return NextResponse.json({
    success: true,
    data: {
      schools: mapped,
      pagination: { total, page, limit, total_pages: Math.ceil(total / limit) },
    },
  })
})
