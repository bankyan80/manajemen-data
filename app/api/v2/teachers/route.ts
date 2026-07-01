import { NextRequest, NextResponse } from 'next/server'
import { safeApi } from '@/lib/api-handler'
import { guardApi, guardDb } from '@/lib/api-guard'
import { db } from '@/lib/db'
import { employees, schools } from '@/db/schema-v2'
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
  const id = searchParams.get('id')
  const sekolah_id = searchParams.get('sekolah_id')
  const status_pegawai = searchParams.get('status_pegawai')
  const sertifikasi = searchParams.get('sertifikasi')
  const q = searchParams.get('q')
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const offset = (page - 1) * limit

  let whereConditions = sql`1=1`
  if (id) {
    whereConditions = sql`${whereConditions} AND ${employees.id} = ${id}`
  }
  if (role !== 'admin_kecamatan' && userSekolahId) {
    whereConditions = sql`${whereConditions} AND ${employees.sekolah_id} = ${userSekolahId}`
  } else if (sekolah_id) {
    whereConditions = sql`${whereConditions} AND ${employees.sekolah_id} = ${sekolah_id}`
  }
  if (status_pegawai) whereConditions = sql`${whereConditions} AND ${employees.status_pegawai} = ${status_pegawai}`
  if (sertifikasi) whereConditions = sql`${whereConditions} AND ${employees.sertifikasi} = ${sertifikasi}`
  if (q) {
    whereConditions = sql`${whereConditions} AND (${employees.nama} LIKE ${'%' + q + '%'} OR ${employees.nik} LIKE ${'%' + q + '%'} OR ${employees.nip} LIKE ${'%' + q + '%'})`
  }

  const [totalResult] = await _db.select({ value: count() }).from(employees).where(whereConditions)
  const total = totalResult.value

  const rows = await _db
    .select({
      id: employees.id,
      sekolah_id: employees.sekolah_id,
      nama: employees.nama,
      nik: employees.nik,
      nip: employees.nip,
      nuptk: employees.nuptk,
      email: employees.email,
      no_hp: employees.no_hp,
      tempat_lahir: employees.tempat_lahir,
      tanggal_lahir: employees.tanggal_lahir,
      jenis_kelamin: employees.jenis_kelamin,
      jabatan: employees.jabatan,
      status_pegawai: employees.status_pegawai,
      pangkat_golongan: employees.pangkat_golongan,
      pendidikan_terakhir: employees.pendidikan_terakhir,
      jurusan: employees.jurusan,
      sertifikasi: employees.sertifikasi,
      tmt_kerja: employees.tmt_kerja,
      tanggal_bup: employees.tanggal_bup,
      foto_url: employees.foto_url,
      is_active: employees.is_active,
      created_at: employees.created_at,
      school_nama: schools.nama,
    })
    .from(employees)
    .leftJoin(schools, eq(employees.sekolah_id, schools.id))
    .where(whereConditions)
    .orderBy(desc(employees.created_at))
    .limit(limit)
    .offset(offset)

  return NextResponse.json({
    success: true,
    data: {
      teachers: rows,
      pagination: id ? undefined : { total, page, limit, total_pages: Math.ceil(total / limit) },
    },
  })
})

export const PUT = (req: NextRequest) => safeApi(async () => {
  const { session, error } = await guardApi()
  if (error) return error
  const dbErr = guardDb(db)
  if (dbErr.error) return dbErr.error

  const _db = db!
  const role = (session?.user as any)?.role as string
  const userSekolahId = (session?.user as any)?.sekolah_id as string | undefined

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ success: false, error: 'ID diperlukan' }, { status: 400 })

  const body = await req.json()
  const allowedFields = [
    'nama', 'nik', 'nip', 'nuptk', 'email', 'no_hp',
    'tempat_lahir', 'tanggal_lahir', 'jenis_kelamin',
    'jabatan', 'status_pegawai', 'pangkat_golongan',
    'pendidikan_terakhir', 'jurusan', 'tmt_kerja',
    'tanggal_bup', 'foto_url',
  ]

  const updateData: Record<string, any> = {}
  for (const field of allowedFields) {
    if (body[field] !== undefined) updateData[field] = body[field]
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ success: false, error: 'Tidak ada data yang diupdate' }, { status: 400 })
  }

  const existing = await _db.select({ id: employees.id, sekolah_id: employees.sekolah_id }).from(employees).where(eq(employees.id, id)).limit(1)
  if (existing.length === 0) {
    return NextResponse.json({ success: false, error: 'Guru tidak ditemukan' }, { status: 404 })
  }

  if (role !== 'admin_kecamatan' && userSekolahId && existing[0].sekolah_id !== userSekolahId) {
    return NextResponse.json({ success: false, error: 'Tidak memiliki akses ke guru ini' }, { status: 403 })
  }

  await _db.update(employees).set(updateData).where(eq(employees.id, id))

  return NextResponse.json({ success: true, data: { message: 'Data guru berhasil diupdate' } })
})

export const DELETE = (req: NextRequest) => safeApi(async () => {
  const { session, error } = await guardApi('admin_kecamatan')
  if (error) return error
  const dbErr = guardDb(db)
  if (dbErr.error) return dbErr.error

  const _db = db!
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ success: false, error: 'ID diperlukan' }, { status: 400 })

  const existing = await _db.select({ id: employees.id }).from(employees).where(eq(employees.id, id)).limit(1)
  if (existing.length === 0) {
    return NextResponse.json({ success: false, error: 'Guru tidak ditemukan' }, { status: 404 })
  }

  await _db.delete(employees).where(eq(employees.id, id))

  return NextResponse.json({ success: true, data: { message: 'Guru berhasil dihapus' } })
})
