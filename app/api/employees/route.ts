import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { employees, schools } from '@/db/schema'
import { eq, like, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export async function GET(req: NextRequest) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')
  const status_pegawai = searchParams.get('status_pegawai')
  const sekolah_id = searchParams.get('sekolah_id')

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
      school_nama: schools.nama,
      school_npsn: schools.npsn,
      school_jenjang: schools.jenjang,
    })
    .from(employees)
    .leftJoin(schools, eq(employees.sekolah_id, schools.id))
    .orderBy(employees.nama)
    .$dynamic()

  if (q) {
    query = query.where(
      sql`(${employees.nama} like ${`%${q}%`} or ${employees.nik} like ${`%${q}%`} or ${employees.nip} like ${`%${q}%`})`
    )
  }
  if (sekolah_id) query = query.where(eq(employees.sekolah_id, sekolah_id))
  if (status_pegawai) query = query.where(eq(employees.status_pegawai, status_pegawai))

  const rows = await query

  return NextResponse.json(rows)
}
