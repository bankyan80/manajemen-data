import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { studentRecaps, schools } from '@/db/schema'
import { eq, count, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export async function GET(req: NextRequest) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const { searchParams } = new URL(req.url)
  const jenjang = searchParams.get('jenjang')

  let whereConditions = sql`1=1`
  if (jenjang) whereConditions = sql`${whereConditions} AND ${schools.jenjang} = ${jenjang}`

  const rows = await db
    .select({
      id: studentRecaps.id,
      school_id: studentRecaps.school_id,
      tahun_pelajaran: studentRecaps.tahun_pelajaran,
      semester: studentRecaps.semester,
      kelas_kelompok: studentRecaps.kelas_kelompok,
      laki_laki: studentRecaps.laki_laki,
      perempuan: studentRecaps.perempuan,
      total: studentRecaps.total,
      siswa_masuk: studentRecaps.siswa_masuk,
      siswa_keluar: studentRecaps.siswa_keluar,
      keterangan: studentRecaps.keterangan,
      school_nama: schools.nama,
      school_npsn: schools.npsn,
      school_jenjang: schools.jenjang,
    })
    .from(studentRecaps)
    .leftJoin(schools, eq(studentRecaps.school_id, schools.id))
    .where(whereConditions)
    .orderBy(schools.nama, studentRecaps.kelas_kelompok)

  return NextResponse.json(rows)
}
