import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { spmbDayaTampung, schools } from '@/db/schema'
import { eq, sql, like, and, count } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const userSekolahId = (session?.user as any)?.sekolah_id
  const { searchParams } = new URL(req.url)
  const tahunPelajaran = searchParams.get('tahun_pelajaran') || '2026/2027'
  const search = searchParams.get('search') || ''
  const desa = searchParams.get('desa') || ''

  let where = sql`${spmbDayaTampung.tahun_pelajaran} = ${tahunPelajaran}`
  if (role === 'operator_sekolah' && userSekolahId) {
    where = sql`${where} AND ${spmbDayaTampung.school_id} = ${userSekolahId}`
  }

  const rows = await db
    .select({
      id: spmbDayaTampung.id,
      school_id: spmbDayaTampung.school_id,
      tahun_pelajaran: spmbDayaTampung.tahun_pelajaran,
      jumlah_rombel: spmbDayaTampung.jumlah_rombel,
      kuota_per_rombel: spmbDayaTampung.kuota_per_rombel,
      npsn: schools.npsn,
      school_nama: schools.nama,
      desa: schools.desa,
      created_at: spmbDayaTampung.created_at,
    })
    .from(spmbDayaTampung)
    .leftJoin(schools, eq(spmbDayaTampung.school_id, schools.id))
    .where(where)
    .orderBy(schools.nama)

  const pendaftarCounts = await db
    .select({
      school_id: sql`${spmbDayaTampung.school_id}`,
      count: sql`COUNT(*)`.as('count'),
    })
    .from(sql`spmb_pendaftar`)
    .where(sql`tahun_pelajaran = ${tahunPelajaran}`)
    .groupBy(sql`school_id`)

  const countMap = new Map(pendaftarCounts.map((r: any) => [r.school_id, Number(r.count)]))

  let data = rows.map((r: any) => {
    const terisi = countMap.get(r.school_id) || 0
    return {
      ...r,
      total_daya_tampung: r.jumlah_rombel * r.kuota_per_rombel,
      terisi,
      sisa: r.jumlah_rombel * r.kuota_per_rombel - terisi,
    }
  })

  if (search) data = data.filter((r: any) => r.school_nama.toLowerCase().includes(search.toLowerCase()) || r.npsn?.includes(search))
  if (desa) data = data.filter((r: any) => r.desa?.toLowerCase() === desa.toLowerCase())

  return NextResponse.json({ data })

  } catch (e) {
    console.error('[API Error]', e);
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Internal error' }, { status: 500 });
  }
  }

export async function POST(req: NextRequest) {
  try {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (role !== 'admin_kecamatan') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  const [result] = await db.insert(spmbDayaTampung).values(body).returning()
  return NextResponse.json({ data: result })

  } catch (e) {
    console.error('[API Error]', e);
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Internal error' }, { status: 500 });
  }
  }

export async function PATCH(req: NextRequest) {
  try {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const body = await req.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const [result] = await db.update(spmbDayaTampung).set(updates).where(eq(spmbDayaTampung.id, id)).returning()
  return NextResponse.json({ data: result })

  } catch (e) {
    console.error('[API Error]', e);
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Internal error' }, { status: 500 });
  }
  }
