import { NextRequest, NextResponse } from 'next/server'
import { safeApi } from '@/lib/api-handler'
import { guardApi, guardDb } from '@/lib/api-guard'
import { db } from '@/lib/db'
import { students, schools } from '@/db/schema-v2'
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

  const { searchParams } = new URL(req.url)
  const school_id = searchParams.get('school_id')
  const jenjang = searchParams.get('jenjang')
  const kelas = searchParams.get('kelas')
  const status = searchParams.get('status') || 'aktif'
  const tahun_pelajaran = searchParams.get('tahun_pelajaran')
  const q = searchParams.get('q')
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const offset = (page - 1) * limit

  let whereConditions = sql`1=1`
  if (role !== 'admin_kecamatan' && userSekolahId) {
    whereConditions = sql`${whereConditions} AND ${students.school_id} = ${userSekolahId}`
  } else if (school_id) {
    whereConditions = sql`${whereConditions} AND ${students.school_id} = ${school_id}`
  }
  if (jenjang) whereConditions = sql`${whereConditions} AND ${students.jenjang} = ${jenjang}`
  if (kelas) whereConditions = sql`${whereConditions} AND ${students.kelas_kelompok} = ${kelas}`
  if (status) whereConditions = sql`${whereConditions} AND ${students.status_siswa} = ${status}`
  if (tahun_pelajaran) whereConditions = sql`${whereConditions} AND ${students.tahun_pelajaran} = ${tahun_pelajaran}`
  if (q) {
    whereConditions = sql`${whereConditions} AND (${students.nama} LIKE ${'%' + q + '%'} OR ${students.nisn} LIKE ${'%' + q + '%'} OR ${students.nik} LIKE ${'%' + q + '%'})`
  }

  const [totalResult] = await _db.select({ value: count() }).from(students).where(whereConditions)
  const total = totalResult.value

  const rows = await _db
    .select({
      id: students.id,
      school_id: students.school_id,
      tahun_pelajaran: students.tahun_pelajaran,
      jenjang: students.jenjang,
      kelas_kelompok: students.kelas_kelompok,
      nama: students.nama,
      nik: students.nik,
      nisn: students.nisn,
      jenis_kelamin: students.jenis_kelamin,
      tempat_lahir: students.tempat_lahir,
      tanggal_lahir: students.tanggal_lahir,
      alamat: students.alamat,
      nama_orang_tua: students.nama_orang_tua,
      no_hp: students.no_hp,
      status_siswa: students.status_siswa,
      created_at: students.created_at,
      school_nama: schools.nama,
    })
    .from(students)
    .leftJoin(schools, eq(students.school_id, schools.id))
    .where(whereConditions)
    .orderBy(desc(students.created_at))
    .limit(limit)
    .offset(offset)

  return NextResponse.json({
    success: true,
    data: rows,
    pagination: { total, page, limit, total_pages: Math.ceil(total / limit) },
  })
})
