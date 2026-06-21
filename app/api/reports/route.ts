import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { reports, schools } from '@/db/schema'
import { eq, count, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export async function GET(req: NextRequest) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  let whereConditions = sql`1=1`
  if (status) whereConditions = sql`${whereConditions} AND ${reports.status} = ${status}`

  const rows = await db
    .select({
      id: reports.id,
      school_id: reports.school_id,
      periode_bulan: reports.periode_bulan,
      tahun: reports.tahun,
      jenis_laporan: reports.jenis_laporan,
      status: reports.status,
      submitted_at: reports.submitted_at,
      verified_at: reports.verified_at,
      catatan_revisi: reports.catatan_revisi,
      school_nama: schools.nama,
      school_npsn: schools.npsn,
    })
    .from(reports)
    .leftJoin(schools, eq(reports.school_id, schools.id))
    .where(whereConditions)
    .orderBy(reports.tahun, reports.periode_bulan)

  const statusSummary = await db
    .select({ status: reports.status, total: count() })
    .from(reports)
    .groupBy(reports.status)

  return NextResponse.json({ data: rows, statusSummary })
}
