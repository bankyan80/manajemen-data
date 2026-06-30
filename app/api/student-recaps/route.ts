import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { studentRecaps, schools } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export async function GET(req: NextRequest) {
  try {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const userSekolahId = (session?.user as any)?.sekolah_id

  const { searchParams } = new URL(req.url)
  const jenjang = searchParams.get('jenjang')

  let whereConditions = sql`1=1`

  if (role === 'operator_sekolah' && userSekolahId) {
    whereConditions = sql`${whereConditions} AND ${studentRecaps.school_id} = ${userSekolahId}`
  }
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

  } catch (e) {
    console.error('[API Error]', e);
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Internal error' }, { status: 500 });
  }
  }
