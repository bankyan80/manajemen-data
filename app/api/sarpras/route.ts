import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { infrastructure, schools } from '@/db/schema'
import { eq, desc, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const userSekolahId = (session?.user as any)?.sekolah_id

  const { searchParams } = new URL(req.url)
  const schoolId = searchParams.get('school_id')
  const jenis = searchParams.get('jenis_sarpras')

  let effectiveSchoolId = schoolId
  if (role === 'operator_sekolah' && userSekolahId) {
    effectiveSchoolId = userSekolahId
  }

  let filters = sql`1=1`
  if (effectiveSchoolId) filters = sql`${filters} AND ${eq(infrastructure.school_id, effectiveSchoolId)}`
  if (jenis) filters = sql`${filters} AND ${eq(infrastructure.jenis_sarpras, jenis)}`

  const data = await db
    .select({
      id: infrastructure.id,
      school_id: infrastructure.school_id,
      school_nama: schools.nama,
      school_npsn: schools.npsn,
      tahun_pelajaran: infrastructure.tahun_pelajaran,
      jenis_sarpras: infrastructure.jenis_sarpras,
      jumlah: infrastructure.jumlah,
      kondisi_baik: infrastructure.kondisi_baik,
      rusak_ringan: infrastructure.rusak_ringan,
      rusak_sedang: infrastructure.rusak_sedang,
      rusak_berat: infrastructure.rusak_berat,
      kebutuhan: infrastructure.kebutuhan,
      keterangan: infrastructure.keterangan,
    })
    .from(infrastructure)
    .leftJoin(schools, eq(infrastructure.school_id, schools.id))
    .where(filters)
    .orderBy(desc(infrastructure.created_at))

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const userSekolahId = (session?.user as any)?.sekolah_id

  const body = await req.json()
  let { school_id, tahun_pelajaran, jenis_sarpras, jumlah, kondisi_baik, rusak_ringan, rusak_sedang, rusak_berat, kebutuhan, keterangan } = body

  if (role === 'operator_sekolah' && userSekolahId) {
    school_id = userSekolahId
  }

  if (!school_id || !tahun_pelajaran || !jenis_sarpras) {
    return NextResponse.json({ error: 'school_id, tahun_pelajaran, jenis_sarpras required' }, { status: 400 })
  }

  const id = crypto.randomUUID()
  const now = Date.now()

  await db.insert(infrastructure).values({
    id,
    school_id,
    tahun_pelajaran,
    jenis_sarpras,
    jumlah: jumlah || 0,
    kondisi_baik: kondisi_baik || 0,
    rusak_ringan: rusak_ringan || 0,
    rusak_sedang: rusak_sedang || 0,
    rusak_berat: rusak_berat || 0,
    kebutuhan: kebutuhan || 0,
    keterangan: keterangan || null,
    created_at: now,
    updated_at: now,
  })

  return NextResponse.json({ success: true, id })
}
