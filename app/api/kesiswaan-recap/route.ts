import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { students, schools } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const userSekolahId = (session?.user as any)?.sekolah_id

  const { searchParams } = new URL(req.url)
  const jenjang = searchParams.get('jenjang')

  let whereConditions = sql`1=1`
  if (role === 'operator_sekolah' && userSekolahId) {
    whereConditions = sql`${whereConditions} AND ${students.school_id} = ${userSekolahId}`
  }
  if (jenjang) whereConditions = sql`${whereConditions} AND ${schools.jenjang} = ${jenjang}`

  const rows = await db
    .select({
      school_id: students.school_id,
      school_nama: schools.nama,
      school_npsn: schools.npsn,
      school_jenjang: schools.jenjang,
      tahun_pelajaran: students.tahun_pelajaran,
      kelas_kelompok: students.kelas_kelompok,
      laki_laki: sql<number>`SUM(CASE WHEN ${students.jenis_kelamin} = 'laki-laki' THEN 1 ELSE 0 END)`,
      perempuan: sql<number>`SUM(CASE WHEN ${students.jenis_kelamin} = 'perempuan' THEN 1 ELSE 0 END)`,
      total: sql<number>`COUNT(*)`,
    })
    .from(students)
    .leftJoin(schools, eq(students.school_id, schools.id))
    .where(whereConditions)
    .groupBy(students.school_id, students.tahun_pelajaran, students.kelas_kelompok)
    .orderBy(schools.nama, students.kelas_kelompok)

  return NextResponse.json(rows, { headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' } })
}
