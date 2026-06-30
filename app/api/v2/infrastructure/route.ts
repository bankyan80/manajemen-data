import { NextRequest, NextResponse } from 'next/server'
import { guardApi, guardDb } from '@/lib/api-guard'
import { db } from '@/lib/db'
import { ruang, schools } from '@/db/schema-v2'
import { count, eq, sql, desc, and } from 'drizzle-orm'

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
  const jenis = searchParams.get('jenis')
  const kondisi = searchParams.get('kondisi')
  const school_id = searchParams.get('school_id')
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const offset = (page - 1) * limit

  let whereConditions = sql`1=1`

  if (role !== 'admin_kecamatan' && userSekolahId) {
    whereConditions = sql`${whereConditions} AND ${ruang.school_id} = ${userSekolahId}`
  }
  if (school_id) whereConditions = sql`${whereConditions} AND ${ruang.school_id} = ${school_id}`
  if (jenis) whereConditions = sql`${whereConditions} AND ${ruang.jenis_ruang} = ${jenis}`
  if (kondisi) {
    if (kondisi === 'rusak_berat' || kondisi === 'rusak_ringan') {
      whereConditions = sql`${whereConditions} AND ${ruang.kondisi_non_struktur} = ${kondisi}`
    } else {
      whereConditions = sql`${whereConditions} AND ${ruang.kondisi_non_struktur} = ${kondisi}`
    }
  }
  if (q) {
    whereConditions = sql`${whereConditions} AND (${schools.nama} LIKE ${'%' + q + '%'} OR ${ruang.nama_ruang} LIKE ${'%' + q + '%'})`
  }

  const [totalResult] = await _db
    .select({ value: count() })
    .from(ruang)
    .innerJoin(schools, eq(ruang.school_id, schools.id))
    .where(whereConditions)
  const total = totalResult.value

  const rows = await _db
    .select({
      id: ruang.id,
      school_id: ruang.school_id,
      school_nama: schools.nama,
      school_npsn: schools.npsn,
      jenis: ruang.jenis_ruang,
      nama: ruang.nama_ruang,
      jumlah: ruang.kapasitas_siswa,
      kondisi: ruang.kondisi_non_struktur,
    })
    .from(ruang)
    .innerJoin(schools, eq(ruang.school_id, schools.id))
    .where(whereConditions)
    .orderBy(desc(ruang.created_at))
    .limit(limit)
    .offset(offset)

  const summaryRows = await _db
    .select({
      jenis_ruang: ruang.jenis_ruang,
      kondisi_non_struktur: ruang.kondisi_non_struktur,
      total: count(),
    })
    .from(ruang)
    .innerJoin(schools, eq(ruang.school_id, schools.id))
    .groupBy(ruang.jenis_ruang, ruang.kondisi_non_struktur)

  const summary = {
    total_ruang_kelas: 0,
    ruang_kelas_baik: 0,
    ruang_kelas_rusak: 0,
    total_lab: 0,
    lab_baik: 0,
    lab_rusak: 0,
    total_perpustakaan: 0,
    perpustakaan_baik: 0,
    perpustakaan_rusak: 0,
    total_wc: 0,
    wc_baik: 0,
    wc_rusak: 0,
  }

  for (const row of summaryRows) {
    const jenis = row.jenis_ruang || 'lainnya'
    const kondisi = row.kondisi_non_struktur || 'unknown'
    const isBaik = kondisi === 'baik' || kondisi === 'sedang'

    if (jenis === 'umum' || jenis === 'ruang_kelas') {
      summary.total_ruang_kelas += row.total
      if (isBaik) summary.ruang_kelas_baik += row.total
      else summary.ruang_kelas_rusak += row.total
    } else if (jenis === 'laboratorium' || jenis === 'lab') {
      summary.total_lab += row.total
      if (isBaik) summary.lab_baik += row.total
      else summary.lab_rusak += row.total
    } else if (jenis === 'perpustakaan') {
      summary.total_perpustakaan += row.total
      if (isBaik) summary.perpustakaan_baik += row.total
      else summary.perpustakaan_rusak += row.total
    } else if (jenis === 'wc') {
      summary.total_wc += row.total
      if (isBaik) summary.wc_baik += row.total
      else summary.wc_rusak += row.total
    }
  }

  return NextResponse.json({
    success: true,
    data: rows,
    summary,
    pagination: { total, page, limit, total_pages: Math.ceil(total / limit) },
  })
}
