import { NextRequest, NextResponse } from 'next/server'
import { safeApi } from '@/lib/api-handler'
import { guardApi, guardDb } from '@/lib/api-guard'
import { db } from '@/lib/db'
import { employees, schools } from '@/db/schema-v2'
import { count, eq, sql, asc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export const GET = (req: NextRequest) => safeApi(async () => {
  const { session, error } = await guardApi()
  if (error) return error
  const dbErr = guardDb(db)
  if (dbErr.error) return dbErr.error

  const _db = db!
  const role = (session?.user as any)?.role as string
  const userSekolahId = (session?.user as any)?.sekolah_id as string | undefined

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')
  const sertifikasi = searchParams.get('sertifikasi')
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const offset = (page - 1) * limit

  let whereConditions = sql`${employees.is_active} = 1`
  if (role !== 'admin_kecamatan' && userSekolahId) {
    whereConditions = sql`${whereConditions} AND ${employees.sekolah_id} = ${userSekolahId}`
  }
  if (sertifikasi) {
    whereConditions = sql`${whereConditions} AND ${employees.sertifikasi} = ${sertifikasi}`
  }
  if (q) {
    whereConditions = sql`${whereConditions} AND (${employees.nama} LIKE ${'%' + q + '%'} OR ${employees.nik} LIKE ${'%' + q + '%'} OR ${employees.nuptk} LIKE ${'%' + q + '%'})`
  }

  const [totalResult] = await _db
    .select({ value: count() })
    .from(employees)
    .where(whereConditions)
  const total = totalResult.value

  const rows = await _db
    .select({
      id: employees.id,
      nama: employees.nama,
      nik: employees.nik,
      nip: employees.nip,
      nuptk: employees.nuptk,
      jabatan: employees.jabatan,
      sertifikasi: employees.sertifikasi,
      sekolah_id: employees.sekolah_id,
      school_nama: schools.nama,
      school_npsn: schools.npsn,
      sekolah_jenjang: schools.jenjang,
    })
    .from(employees)
    .leftJoin(schools, eq(employees.sekolah_id, schools.id))
    .where(whereConditions)
    .orderBy(
      sql`CASE ${employees.sertifikasi} WHEN 'sudah' THEN 1 WHEN 'tidak_ada' THEN 2 ELSE 3 END`,
      asc(employees.nama),
    )
    .limit(limit)
    .offset(offset)

  const summaryRows = await _db
    .select({
      sekolah_id: employees.sekolah_id,
      school_nama: schools.nama,
      sekolah_jenjang: schools.jenjang,
      total: count(),
      sudah: sql<number>`SUM(CASE WHEN ${employees.sertifikasi} = 'sudah' THEN 1 ELSE 0 END)`,
    })
    .from(employees)
    .innerJoin(schools, eq(employees.sekolah_id, schools.id))
    .where(sql`${employees.is_active} = 1`)
    .groupBy(employees.sekolah_id, schools.nama, schools.jenjang)
    .orderBy(
      sql`CASE ${schools.jenjang} WHEN 'sd' THEN 1 WHEN 'tk' THEN 2 WHEN 'kb' THEN 3 ELSE 4 END`,
      asc(schools.nama),
    )

  const totalSudah = summaryRows.reduce((s, r) => s + Number(r.sudah), 0)
  const totalTidakAda = summaryRows.reduce((s, r) => s + (Number(r.total) - Number(r.sudah)), 0)

  return NextResponse.json({
    success: true,
    data: {
      employees: rows,
      summary: { total, totalSudah, totalTidakAda, persenSudah: total > 0 ? Math.round((totalSudah / total) * 100) : 0 },
      perSekolah: summaryRows,
      pagination: { total, page, limit, total_pages: Math.ceil(total / limit) },
    },
  })
})
