import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { ppdb, schools } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export async function GET(req: NextRequest) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const userSekolahId = (session?.user as any)?.sekolah_id

  const { searchParams } = new URL(req.url)
  const tahunPelajaran = searchParams.get('tahun_pelajaran') || '2025/2026'

  let whereConditions = sql`${ppdb.tahun_pelajaran} = ${tahunPelajaran}`

  if (role === 'operator_sekolah' && userSekolahId) {
    whereConditions = sql`${whereConditions} AND ${ppdb.school_id} = ${userSekolahId}`
  }

  const rows = await db
    .select({
      id: ppdb.id,
      school_id: ppdb.school_id,
      school_nama: schools.nama,
      school_npsn: schools.npsn,
      tahun_pelajaran: ppdb.tahun_pelajaran,
      daya_tampung: ppdb.daya_tampung,
      jumlah_pendaftar: ppdb.jumlah_pendaftar,
      jumlah_pendaftar_l: ppdb.jumlah_pendaftar_l,
      jumlah_pendaftar_p: ppdb.jumlah_pendaftar_p,
      jumlah_diterima: ppdb.jumlah_diterima,
      jumlah_diterima_l: ppdb.jumlah_diterima_l,
      jumlah_diterima_p: ppdb.jumlah_diterima_p,
      jalur_domisili: ppdb.jalur_domisili,
      jalur_domisili_l: ppdb.jalur_domisili_l,
      jalur_domisili_p: ppdb.jalur_domisili_p,
      jalur_afirmasi: ppdb.jalur_afirmasi,
      jalur_afirmasi_l: ppdb.jalur_afirmasi_l,
      jalur_afirmasi_p: ppdb.jalur_afirmasi_p,
      jalur_mutasi: ppdb.jalur_mutasi,
      jalur_mutasi_l: ppdb.jalur_mutasi_l,
      jalur_mutasi_p: ppdb.jalur_mutasi_p,
      rekap_usia: ppdb.rekap_usia,
      rekap_usia_l: ppdb.rekap_usia_l,
      rekap_usia_p: ppdb.rekap_usia_p,
      kekurangan_kelebihan_kuota: ppdb.kekurangan_kelebihan_kuota,
    })
    .from(ppdb)
    .leftJoin(schools, eq(ppdb.school_id, schools.id))
    .where(whereConditions)
    .orderBy(schools.nama)

  return NextResponse.json({ data: rows })
}

export async function POST(req: NextRequest) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const session = await getServerSession(authOptions)
  const userSekolahId = (session?.user as any)?.sekolah_id

  const body = await req.json()

  const insert = {
    school_id: body.school_id || userSekolahId,
    tahun_pelajaran: body.tahun_pelajaran || '2025/2026',
    daya_tampung: body.daya_tampung ?? 0,
    jumlah_pendaftar: body.jumlah_pendaftar ?? 0,
    jumlah_pendaftar_l: body.jumlah_pendaftar_l ?? 0,
    jumlah_pendaftar_p: body.jumlah_pendaftar_p ?? 0,
    jumlah_diterima: body.jumlah_diterima ?? 0,
    jumlah_diterima_l: body.jumlah_diterima_l ?? 0,
    jumlah_diterima_p: body.jumlah_diterima_p ?? 0,
    jalur_domisili: body.jalur_domisili ?? 0,
    jalur_domisili_l: body.jalur_domisili_l ?? 0,
    jalur_domisili_p: body.jalur_domisili_p ?? 0,
    jalur_afirmasi: body.jalur_afirmasi ?? 0,
    jalur_afirmasi_l: body.jalur_afirmasi_l ?? 0,
    jalur_afirmasi_p: body.jalur_afirmasi_p ?? 0,
    jalur_mutasi: body.jalur_mutasi ?? 0,
    jalur_mutasi_l: body.jalur_mutasi_l ?? 0,
    jalur_mutasi_p: body.jalur_mutasi_p ?? 0,
    rekap_usia: body.rekap_usia || null,
    rekap_usia_l: body.rekap_usia_l || null,
    rekap_usia_p: body.rekap_usia_p || null,
    kekurangan_kelebihan_kuota: body.kekurangan_kelebihan_kuota ?? 0,
  }

  const [result] = await db.insert(ppdb).values(insert).returning()
  return NextResponse.json({ data: result })
}

export async function PATCH(req: NextRequest) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const body = await req.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const [result] = await db.update(ppdb).set(updates).where(eq(ppdb.id, id)).returning()
  return NextResponse.json({ data: result })
}

export async function DELETE(req: NextRequest) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await db.delete(ppdb).where(eq(ppdb.id, id))
  return NextResponse.json({ success: true })
}
