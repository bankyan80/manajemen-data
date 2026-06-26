import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { students, schools } from '@/db/schema'
import { eq, sql, like, count, desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const userSekolahId = (session?.user as any)?.sekolah_id

  const { searchParams } = new URL(req.url)
  const school_id = searchParams.get('school_id')
  const jenjang = searchParams.get('jenjang')
  const kelas = searchParams.get('kelas')
  const status = searchParams.get('status')
  const tahun_pelajaran = searchParams.get('tahun_pelajaran')
  const q = searchParams.get('q')
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const offset = (page - 1) * limit

  let whereConditions = sql`1=1`
  if (role === 'operator_sekolah' && userSekolahId) {
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

  const [totalResult] = await db.select({ value: count() }).from(students).leftJoin(schools, eq(students.school_id, schools.id)).where(whereConditions)
  const total = totalResult.value

  const rows = await db
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
    .orderBy(desc(students.kelas_kelompok), students.nama)
    .limit(limit)
    .offset(offset)

  return NextResponse.json({ data: rows, total, page, limit, total_pages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session?.user as any)?.role
  const userSekolahId = (session?.user as any)?.sekolah_id

  const body = await req.json()
  const { school_id, tahun_pelajaran, jenjang, kelas_kelompok, nama, nik, nisn, jenis_kelamin, tempat_lahir, tanggal_lahir, alamat, nama_orang_tua, no_hp } = body

  if (!nama) return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 })
  if (!school_id && role === 'operator_sekolah') body.school_id = userSekolahId
  if (!body.school_id) return NextResponse.json({ error: 'School ID wajib' }, { status: 400 })
  if (!tahun_pelajaran) return NextResponse.json({ error: 'Tahun pelajaran wajib' }, { status: 400 })
  if (!jenjang) return NextResponse.json({ error: 'Jenjang wajib' }, { status: 400 })
  if (!kelas_kelompok) return NextResponse.json({ error: 'Kelas/kelompok wajib' }, { status: 400 })

  await db.insert(students).values({
    school_id: body.school_id,
    tahun_pelajaran,
    jenjang,
    kelas_kelompok,
    nama,
    nik: nik || null,
    nisn: nisn || null,
    jenis_kelamin: jenis_kelamin || null,
    tempat_lahir: tempat_lahir || null,
    tanggal_lahir: tanggal_lahir || null,
    alamat: alamat || null,
    nama_orang_tua: nama_orang_tua || null,
    no_hp: no_hp || null,
    status_siswa: 'aktif',
  })

  return NextResponse.json({ success: true }, { status: 201 })
}
