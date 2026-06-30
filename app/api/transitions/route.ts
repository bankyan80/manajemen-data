import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { transitions, schools, students } from '@/db/schema'
import { eq, and, like, count, sql, notInArray } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export async function GET(req: NextRequest) {
  try {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const userSekolahId = (session?.user as any)?.sekolah_id

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const q = searchParams.get('q')

  let whereConditions = sql`1=1`

  if (role === 'operator_sekolah' && userSekolahId) {
    whereConditions = sql`${whereConditions} AND ${transitions.school_id} = ${userSekolahId}`
  }
  if (status) whereConditions = sql`${whereConditions} AND ${transitions.status_transisi} = ${status}`
  if (q) whereConditions = sql`${whereConditions} AND (${transitions.nama} like ${`%${q}%`} OR ${transitions.nisn} like ${`%${q}%`})`

  const rows = await db
    .select({
      id: transitions.id,
      school_id: transitions.school_id,
      student_id: transitions.student_id,
      tahun_pelajaran: transitions.tahun_pelajaran,
      nama: transitions.nama,
      nisn: transitions.nisn,
      jenis_kelamin: transitions.jenis_kelamin,
      kelas: transitions.kelas,
      status_transisi: transitions.status_transisi,
      smp_tujuan: transitions.smp_tujuan,
      kesiapan: transitions.kesiapan,
      kegiatan_transisi: transitions.kegiatan_transisi,
      keterangan: transitions.keterangan,
      created_at: transitions.created_at,
      school_nama: schools.nama,
    })
    .from(transitions)
    .leftJoin(schools, eq(transitions.school_id, schools.id))
    .where(whereConditions)
    .orderBy(transitions.nama)

  const recap = await db
    .select({
      status_transisi: transitions.status_transisi,
      total: count(),
    })
    .from(transitions)
    .where(whereConditions)
    .groupBy(transitions.status_transisi)

  // Fetch grade 6 SD students who are not yet in transitions
  const existingStudentIds = rows.filter(r => r.student_id).map(r => r.student_id) as string[]

  const latestTP = await db
    .select({ tp: students.tahun_pelajaran })
    .from(students)
    .where(eq(students.jenjang, 'sd'))
    .orderBy(sql`${students.tahun_pelajaran} DESC`)
    .limit(1)

  const currentTP = latestTP[0]?.tp

  const studentConditions = [
    eq(students.jenjang, 'sd'),
    like(students.kelas_kelompok, 'Kelas VI%'),
    eq(students.status_siswa, 'aktif'),
  ]
  if (currentTP) {
    studentConditions.push(eq(students.tahun_pelajaran, currentTP))
  }
  if (role === 'operator_sekolah' && userSekolahId) {
    studentConditions.push(eq(students.school_id, userSekolahId))
  }
  if (existingStudentIds.length > 0) {
    studentConditions.push(notInArray(students.id, existingStudentIds))
  }

  const grade6Students = await db
    .select({
      id: students.id,
      school_id: students.school_id,
      tahun_pelajaran: students.tahun_pelajaran,
      nama: students.nama,
      nisn: students.nisn,
      jenis_kelamin: students.jenis_kelamin,
      kelas_kelompok: students.kelas_kelompok,
      school_nama: schools.nama,
    })
    .from(students)
    .leftJoin(schools, eq(students.school_id, schools.id))
    .where(and(...studentConditions))

  const virtualRows = grade6Students.map(s => ({
    id: s.id + '-auto',
    school_id: s.school_id,
    student_id: s.id,
    tahun_pelajaran: s.tahun_pelajaran,
    nama: s.nama,
    nisn: s.nisn || null,
    jenis_kelamin: s.jenis_kelamin || null,
    kelas: s.kelas_kelompok,
    status_transisi: 'calon_masuk',
    smp_tujuan: null,
    kesiapan: null,
    kegiatan_transisi: null,
    keterangan: null,
    created_at: null,
    school_nama: s.school_nama || null,
  }))

  const totalCalonMasukTable = recap.find(r => r.status_transisi === 'calon_masuk')?.total || 0
  const recapWithVirtual = [
    { status_transisi: 'calon_masuk', total: totalCalonMasukTable + virtualRows.length },
    ...recap.filter(r => r.status_transisi !== 'calon_masuk'),
  ]

  const allRows = [...rows, ...virtualRows].sort((a, b) => a.nama.localeCompare(b.nama))

  if (q) {
    const lowered = q.toLowerCase()
    const filtered = allRows.filter(r =>
      r.nama.toLowerCase().includes(lowered) || (r.nisn || '').includes(q)
    )
    return NextResponse.json({
      data: filtered,
      recap: recapWithVirtual,
      virtual_count: virtualRows.length,
    })
  }

  return NextResponse.json({
    data: allRows,
    recap: recapWithVirtual,
    virtual_count: virtualRows.length,
  })

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
  const userSekolahId = (session?.user as any)?.sekolah_id

  const body = await req.json()

  const insert = {
    school_id: body.school_id || userSekolahId,
    tahun_pelajaran: body.tahun_pelajaran,
    nama: body.nama,
    nisn: body.nisn || null,
    jenis_kelamin: body.jenis_kelamin || null,
    kelas: body.kelas,
    status_transisi: body.status_transisi || 'calon_masuk',
    smp_tujuan: body.smp_tujuan || null,
    kesiapan: body.kesiapan || null,
    kegiatan_transisi: body.kegiatan_transisi || null,
    keterangan: body.keterangan || null,
    student_id: body.student_id || null,
  } as const

  const [result] = await db.insert(transitions).values(insert).returning()

  return NextResponse.json({ data: result })

  } catch (e) {
    console.error('[API Error]', e);
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Internal error' }, { status: 500 });
  }
  }
