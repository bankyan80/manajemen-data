import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { studentMutations, students, schools } from '@/db/schema'
import { eq, sql, count } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const userSekolahId = (session?.user as any)?.sekolah_id

  const { searchParams } = new URL(req.url)
  const school_id = searchParams.get('school_id')
  const q = searchParams.get('q')
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const offset = (page - 1) * limit

  let whereConditions = sql`${studentMutations.jenis} = 'keluar'`
  if (role === 'operator_sekolah' && userSekolahId) {
    whereConditions = sql`${whereConditions} AND ${studentMutations.school_id} = ${userSekolahId}`
  } else if (school_id) {
    whereConditions = sql`${whereConditions} AND ${studentMutations.school_id} = ${school_id}`
  }
  if (q) {
    whereConditions = sql`${whereConditions} AND (${studentMutations.nama} LIKE ${'%' + q + '%'} OR ${studentMutations.nisn} LIKE ${'%' + q + '%'})`
  }

  const [totalResult] = await db.select({ value: count() }).from(studentMutations).leftJoin(schools, eq(studentMutations.school_id, schools.id)).where(whereConditions)
  const total = totalResult.value

  const rows = await db
    .select({
      id: studentMutations.id,
      school_id: studentMutations.school_id,
      student_id: studentMutations.student_id,
      tanggal: studentMutations.tanggal,
      nama: studentMutations.nama,
      nisn: studentMutations.nisn,
      jenis_kelamin: studentMutations.jenis_kelamin,
      kelas_kelompok: studentMutations.kelas_kelompok,
      sekolah_tujuan: studentMutations.sekolah_tujuan,
      alasan: studentMutations.alasan,
      dokumen_url: studentMutations.dokumen_url,
      keterangan: studentMutations.keterangan,
      created_at: studentMutations.created_at,
      school_nama: schools.nama,
    })
    .from(studentMutations)
    .leftJoin(schools, eq(studentMutations.school_id, schools.id))
    .where(whereConditions)
    .orderBy(sql`${studentMutations.tanggal} DESC`)
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
  const schoolId = role === 'operator_sekolah' ? userSekolahId : body.school_id
  if (!schoolId) return NextResponse.json({ error: 'School ID wajib' }, { status: 400 })
  if (!body.tanggal) return NextResponse.json({ error: 'Tanggal wajib' }, { status: 400 })
  if (!body.nama) return NextResponse.json({ error: 'Nama wajib' }, { status: 400 })
  if (!body.kelas_kelompok) return NextResponse.json({ error: 'Kelompok wajib' }, { status: 400 })

  await db.insert(studentMutations).values({
    school_id: schoolId,
    jenis: 'keluar',
    tanggal: body.tanggal,
    nama: body.nama,
    nisn: body.nisn || null,
    jenis_kelamin: body.jenis_kelamin || 'laki-laki',
    kelas_kelompok: body.kelas_kelompok,
    sekolah_tujuan: body.sekolah_tujuan || null,
    alasan: body.alasan || null,
    dokumen_url: body.dokumen_url || null,
    keterangan: body.keterangan || null,
  })

  // Auto-update student status
  const studentRows = await db
    .select({ id: students.id })
    .from(students)
    .where(sql`${students.school_id} = ${schoolId} AND ${students.nama} = ${body.nama} AND ${students.status_siswa} = 'aktif'`)
    .limit(1)

  if (studentRows.length > 0) {
    await db.update(students).set({ status_siswa: 'pindah' }).where(eq(students.id, studentRows[0].id))
  }

  return NextResponse.json({ success: true }, { status: 201 })
}
