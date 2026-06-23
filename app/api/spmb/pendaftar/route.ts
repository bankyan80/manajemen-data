import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { spmbPendaftar, schools } from '@/db/schema'
import { eq, sql, or } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const userSekolahId = (session?.user as any)?.sekolah_id
  const { searchParams } = new URL(req.url)
  const tahunPelajaran = searchParams.get('tahun_pelajaran') || '2026/2027'
  const search = searchParams.get('search') || ''
  const sekolahId = searchParams.get('sekolah_id') || ''
  const jalur = searchParams.get('jalur') || ''
  const status = searchParams.get('status') || ''

  let where = sql`${spmbPendaftar.tahun_pelajaran} = ${tahunPelajaran}`
  if (role === 'operator_sekolah' && userSekolahId) {
    where = sql`${where} AND ${spmbPendaftar.school_id} = ${userSekolahId}`
  }
  if (sekolahId && role === 'admin_kecamatan') {
    where = sql`${where} AND ${spmbPendaftar.school_id} = ${sekolahId}`
  }
  if (jalur) where = sql`${where} AND ${spmbPendaftar.jalur} = ${jalur}`
  if (status) where = sql`${where} AND ${spmbPendaftar.status_seleksi} = ${status}`

  const rows = await db
    .select({
      id: spmbPendaftar.id,
      school_id: spmbPendaftar.school_id,
      sekolah_nama: schools.nama,
      tahun_pelajaran: spmbPendaftar.tahun_pelajaran,
      no_pendaftaran: spmbPendaftar.no_pendaftaran,
      nik: spmbPendaftar.nik,
      nama_lengkap: spmbPendaftar.nama_lengkap,
      jenis_kelamin: spmbPendaftar.jenis_kelamin,
      tempat_lahir: spmbPendaftar.tempat_lahir,
      tanggal_lahir: spmbPendaftar.tanggal_lahir,
      usia: spmbPendaftar.usia,
      alamat: spmbPendaftar.alamat,
      desa: spmbPendaftar.desa,
      asal_tk_paud: spmbPendaftar.asal_tk_paud,
      nama_orang_tua: spmbPendaftar.nama_orang_tua,
      no_hp: spmbPendaftar.no_hp,
      jalur: spmbPendaftar.jalur,
      status_seleksi: spmbPendaftar.status_seleksi,
      status_kk: spmbPendaftar.status_kk,
      status_akta: spmbPendaftar.status_akta,
      status_dokumen_tambahan: spmbPendaftar.status_dokumen_tambahan,
      catatan_verifikasi: spmbPendaftar.catatan_verifikasi,
      file_kk_url: spmbPendaftar.file_kk_url,
      file_akta_url: spmbPendaftar.file_akta_url,
      file_afirmasi_url: spmbPendaftar.file_afirmasi_url,
      file_mutasi_url: spmbPendaftar.file_mutasi_url,
      created_at: spmbPendaftar.created_at,
      updated_at: spmbPendaftar.updated_at,
    })
    .from(spmbPendaftar)
    .leftJoin(schools, eq(spmbPendaftar.school_id, schools.id))
    .where(where)
    .orderBy(spmbPendaftar.created_at)

  let data = rows
  if (search) {
    const q = search.toLowerCase()
    data = data.filter((r: any) =>
      r.nama_lengkap.toLowerCase().includes(q) ||
      r.nik?.includes(search) ||
      r.no_pendaftaran?.toLowerCase().includes(q)
    )
  }
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const userSekolahId = (session?.user as any)?.sekolah_id
  if (role !== 'operator_sekolah') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const thn = body.tahun_pelajaran || '2026/2027'

  const [last] = await db
    .select({ count: sql`COUNT(*)`.as('count') })
    .from(spmbPendaftar)
    .where(sql`${spmbPendaftar.school_id} = ${userSekolahId} AND ${spmbPendaftar.tahun_pelajaran} = ${thn}`)
  const nomor = (Number((last as any)?.count || 0) + 1).toString().padStart(4, '0')
  const noPendaftaran = `${thn.split('/')[0]}.${userSekolahId.slice(-4)}.${nomor}`

  let usia = 0
  if (body.tanggal_lahir) {
    const birth = new Date(body.tanggal_lahir)
    const now = new Date()
    usia = now.getFullYear() - birth.getFullYear()
    const m = now.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) usia--
  }

  const [result] = await db.insert(spmbPendaftar).values({
    school_id: userSekolahId,
    tahun_pelajaran: thn,
    no_pendaftaran: noPendaftaran,
    nik: body.nik,
    nama_lengkap: body.nama_lengkap,
    jenis_kelamin: body.jenis_kelamin || 'laki-laki',
    tempat_lahir: body.tempat_lahir || null,
    tanggal_lahir: body.tanggal_lahir,
    usia,
    alamat: body.alamat || null,
    desa: body.desa || null,
    asal_tk_paud: body.asal_tk_paud || null,
    nama_orang_tua: body.nama_orang_tua || null,
    no_hp: body.no_hp || null,
    jalur: body.jalur || 'domisili',
    status_seleksi: 'pending',
  }).returning()
  return NextResponse.json({ data: result })
}
