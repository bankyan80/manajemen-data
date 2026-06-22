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
      jumlah_diterima: ppdb.jumlah_diterima,
      jalur_domisili: ppdb.jalur_domisili,
      jalur_afirmasi: ppdb.jalur_afirmasi,
      jalur_mutasi: ppdb.jalur_mutasi,
      rekap_usia: ppdb.rekap_usia,
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
    jumlah_diterima: body.jumlah_diterima ?? 0,
    jalur_domisili: body.jalur_domisili ?? 0,
    jalur_afirmasi: body.jalur_afirmasi ?? 0,
    jalur_mutasi: body.jalur_mutasi ?? 0,
    rekap_usia: body.rekap_usia || null,
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
