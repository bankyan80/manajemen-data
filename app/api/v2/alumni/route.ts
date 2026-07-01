import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { alumni, schools } from '@/db/schema-v2'
import { eq, sql, desc, isNotNull } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

const EMPTY_SUMMARY = {
  jumlah_lulusan: 0,
  smp_negeri_l: 0, smp_negeri_p: 0,
  smp_swasta_l: 0, smp_swasta_p: 0,
  pondok_l: 0, pondok_p: 0,
  tidak_melanjutkan_l: 0, tidak_melanjutkan_p: 0,
}

export async function GET(req: NextRequest) {
  try {
    if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role
    const userSekolahId = (session?.user as any)?.sekolah_id

    const { searchParams } = new URL(req.url)
    const tahun_lulus = searchParams.get('tahun_lulus')

    if (!tahun_lulus) {
      const rows = await db
        .select({ tahun: alumni.tahun_lulus })
        .from(alumni)
        .groupBy(alumni.tahun_lulus)
        .orderBy(desc(alumni.tahun_lulus))
      return NextResponse.json({ tahun_list: rows.map(r => r.tahun), data: [] })
    }

    let schoolFilter = sql`1=1`
    if (role === 'operator_sekolah' && userSekolahId) {
      schoolFilter = sql`${schools.id} = ${userSekolahId}`
    }

    const list = await db
      .select({
        id: schools.id,
        nama: schools.nama,
        npsn: schools.npsn,
        summaryJson: alumni.tujuan,
      })
      .from(schools)
      .leftJoin(alumni, sql`${alumni.school_id} = ${schools.id} AND ${alumni.tahun_lulus} = ${tahun_lulus} AND ${alumni.nama} = 'REKAP'`)
      .where(sql`${schoolFilter} AND ${schools.jenjang} = 'sd'`)
      .orderBy(schools.nama)

    const data = list.map(s => {
      let summary = { ...EMPTY_SUMMARY }
      if (s.summaryJson) {
        try { summary = { ...EMPTY_SUMMARY, ...JSON.parse(s.summaryJson) } } catch {}
      }
      return {
        school_id: s.id,
        school_nama: s.nama,
        school_npsn: s.npsn,
        summary,
      }
    })

    const tahunRows = await db
      .select({ tahun: alumni.tahun_lulus })
      .from(alumni)
      .where(eq(alumni.nama, 'REKAP'))
      .groupBy(alumni.tahun_lulus)
      .orderBy(desc(alumni.tahun_lulus))

    return NextResponse.json({ data, tahun_list: tahunRows.map(r => r.tahun) })
  } catch (e) {
    console.error('[API Error]', e)
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Internal error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const role = (session?.user as any)?.role
    const userSekolahId = (session?.user as any)?.sekolah_id

    const body = await req.json()
    const schoolId = role === 'operator_sekolah' ? userSekolahId : body.school_id
    if (!schoolId) return NextResponse.json({ error: 'School ID wajib' }, { status: 400 })
    if (!body.tahun_lulus) {
      return NextResponse.json({ error: 'Tahun lulus wajib' }, { status: 400 })
    }

    const summary = {
      jumlah_lulusan: body.jumlah_lulusan || 0,
      smp_negeri_l: body.smp_negeri_l || 0,
      smp_negeri_p: body.smp_negeri_p || 0,
      smp_swasta_l: body.smp_swasta_l || 0,
      smp_swasta_p: body.smp_swasta_p || 0,
      pondok_l: body.pondok_l || 0,
      pondok_p: body.pondok_p || 0,
      tidak_melanjutkan_l: body.tidak_melanjutkan_l || 0,
      tidak_melanjutkan_p: body.tidak_melanjutkan_p || 0,
    }

    const existing = await db
      .select({ id: alumni.id })
      .from(alumni)
      .where(sql`${alumni.school_id} = ${schoolId} AND ${alumni.tahun_lulus} = ${body.tahun_lulus} AND ${alumni.nama} = 'REKAP'`)
      .limit(1)

    const now = Date.now()
    if (existing.length > 0) {
      await db.update(alumni).set({ tujuan: JSON.stringify(summary), updated_at: now }).where(eq(alumni.id, existing[0].id))
    } else {
      await db.insert(alumni).values({
        id: crypto.randomUUID(),
        school_id: schoolId,
        tahun_lulus: body.tahun_lulus,
        nama: 'REKAP',
        nisn: null,
        nik: null,
        kelas: null,
        tujuan: JSON.stringify(summary),
        created_at: now,
        updated_at: now,
      })
    }

    return NextResponse.json({ success: true, summary }, { status: 200 })
  } catch (e) {
    console.error('[API Error]', e)
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Internal error' }, { status: 500 })
  }
}
