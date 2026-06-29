import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { employees, schools } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const userSekolahId = (session?.user as any)?.sekolah_id

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')
  const status_pegawai = searchParams.get('status_pegawai')
  const sekolah_id = searchParams.get('sekolah_id')
  const showNonaktif = searchParams.get('show_nonaktif') === '1'

  let query = db
    .select({
      id: employees.id,
      sekolah_id: employees.sekolah_id,
      nama: employees.nama,
      nik: employees.nik,
      nip: employees.nip,
      nuptk: employees.nuptk,
      email: employees.email,
      no_hp: employees.no_hp,
      jenis_kelamin: employees.jenis_kelamin,
      jabatan: employees.jabatan,
      status_pegawai: employees.status_pegawai,
      pangkat_golongan: employees.pangkat_golongan,
      pendidikan_terakhir: employees.pendidikan_terakhir,
      sertifikasi: employees.sertifikasi,
      tanggal_lahir: employees.tanggal_lahir,
      tempat_lahir: employees.tempat_lahir,
      tmt_kerja: employees.tmt_kerja,
      tanggal_bup: employees.tanggal_bup,
      foto_url: employees.foto_url,
      is_active: employees.is_active,
      school_nama: schools.nama,
      school_npsn: schools.npsn,
      school_jenjang: schools.jenjang,
    })
    .from(employees)
    .leftJoin(schools, eq(employees.sekolah_id, schools.id))
    .orderBy(employees.nama)
    .$dynamic()

  if (!showNonaktif) {
    query = query.where(eq(employees.is_active, 1))
  }
  if (role === 'operator_sekolah' && userSekolahId) {
    query = query.where(eq(employees.sekolah_id, userSekolahId))
  } else if (sekolah_id) {
    query = query.where(eq(employees.sekolah_id, sekolah_id))
  }
  if (q) {
    query = query.where(
      sql`(${employees.nama} like ${`%${q}%`} or ${employees.nik} like ${`%${q}%`} or ${employees.nip} like ${`%${q}%`})`
    )
  }
  if (status_pegawai) query = query.where(eq(employees.status_pegawai, status_pegawai))

  const rows = await query

  return NextResponse.json(rows, { headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' } })
}

export async function POST(req: NextRequest) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (role !== 'admin_kecamatan') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { v4: uuidv4 } = await import('uuid')

  const id = uuidv4()
  const now = Date.now()

  await db.insert(employees).values({
    id,
    sekolah_id: body.sekolah_id,
    nama: body.nama,
    nik: body.nik,
    nip: body.nip || null,
    nuptk: body.nuptk || null,
    email: body.email || null,
    no_hp: body.no_hp || null,
    tempat_lahir: body.tempat_lahir || null,
    tanggal_lahir: body.tanggal_lahir || null,
    jenis_kelamin: body.jenis_kelamin || null,
    jabatan: body.jabatan || null,
    status_pegawai: body.status_pegawai || null,
    pangkat_golongan: body.pangkat_golongan || null,
    pendidikan_terakhir: body.pendidikan_terakhir || null,
    jurusan: body.jurusan || null,
    sertifikasi: body.sertifikasi || null,
    tmt_kerja: body.tmt_kerja || null,
    tanggal_bup: body.tanggal_bup || null,
    is_active: 1,
    created_at: now,
    updated_at: now,
  })

  return NextResponse.json({ success: true, id })
}
