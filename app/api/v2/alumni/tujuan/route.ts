import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { alumni } from '@/db/schema-v2'
import { eq, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest) {
  try {
    if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const role = (session?.user as any)?.role
    const userSekolahId = (session?.user as any)?.sekolah_id

    const body = await req.json()
    const schoolId = role === 'operator_sekolah' ? userSekolahId : body.school_id
    if (!schoolId || !body.tahun_lulus) {
      return NextResponse.json({ error: 'school_id dan tahun_lulus wajib' }, { status: 400 })
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
        school_id: schoolId,
        tahun_lulus: body.tahun_lulus,
        nama: 'REKAP',
        nisn: '',
        nik: '',
        kelas: '',
        tujuan: JSON.stringify(summary),
      } as any)
    }

    return NextResponse.json({ success: true, summary }, { status: 200 })
  } catch (e) {
    console.error('[API Error]', e)
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Internal error' }, { status: 500 })
  }
}
