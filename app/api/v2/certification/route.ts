import { NextRequest, NextResponse } from 'next/server'
import { safeApi } from '@/lib/api-handler'
import { guardApi, guardDb } from '@/lib/api-guard'
import { db } from '@/lib/db'
import { certifications, employees, schools } from '@/db/schema-v2'
import { count, eq, sql, desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export const GET = (req: NextRequest) => safeApi(async () => {
  const { session, error } = await guardApi()
  if (error) return error
  const dbErr = guardDb(db)
  if (dbErr.error) return dbErr.error

  const _db = db!
  const role = (session?.user as any)?.role as string
  const userSekolahId = (session?.user as any)?.sekolah_id as string | undefined
  const userPegawaiId = (session?.user as any)?.pegawai_id as string | undefined

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')
  const status = searchParams.get('status')
  const teacher_id = searchParams.get('teacher_id')
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const offset = (page - 1) * limit

  let whereConditions = sql`1=1`

  if (role !== 'admin_kecamatan') {
    if (userPegawaiId) {
      whereConditions = sql`${whereConditions} AND ${certifications.teacher_id} = ${userPegawaiId}`
    } else if (userSekolahId) {
      whereConditions = sql`${whereConditions} AND ${employees.sekolah_id} = ${userSekolahId}`
    }
  }
  if (teacher_id) whereConditions = sql`${whereConditions} AND ${certifications.teacher_id} = ${teacher_id}`
  if (status) whereConditions = sql`${whereConditions} AND ${certifications.status} = ${status}`
  if (q) {
    whereConditions = sql`${whereConditions} AND (${employees.nama} LIKE ${'%' + q + '%'} OR ${employees.nik} LIKE ${'%' + q + '%'})`
  }

  const [totalResult] = await _db
    .select({ value: count() })
    .from(certifications)
    .innerJoin(employees, eq(certifications.teacher_id, employees.id))
    .where(whereConditions)
  const total = totalResult.value

  const rows = await _db
    .select({
      id: certifications.id,
      teacher_id: certifications.teacher_id,
      teacher_nama: employees.nama,
      teacher_nik: employees.nik,
      school_nama: schools.nama,
      jenis_sertifikasi: certifications.jenis_sertifikasi,
      nomor_sertifikat: certifications.nomor_sertifikat,
      tahun_sertifikasi: certifications.tahun_sertifikasi,
      penerbit: certifications.penerbit,
      status: certifications.status,
      file_url: certifications.file_url,
      catatan: certifications.catatan,
      created_at: certifications.created_at,
    })
    .from(certifications)
    .innerJoin(employees, eq(certifications.teacher_id, employees.id))
    .leftJoin(schools, eq(employees.sekolah_id, schools.id))
    .where(whereConditions)
    .orderBy(desc(certifications.created_at))
    .limit(limit)
    .offset(offset)

  return NextResponse.json({
    success: true,
    data: rows,
    pagination: { total, page, limit, total_pages: Math.ceil(total / limit) },
  })
})
