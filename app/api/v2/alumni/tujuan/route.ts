import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { alumni } from '@/db/schema-v2'
import { eq, and } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest) {
  try {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session?.user as any)?.role
  const userSekolahId = (session?.user as any)?.sekolah_id

  const { school_id, tahun_lulus, distribusi } = await req.json()
  if (!school_id || !tahun_lulus || !distribusi) {
    return NextResponse.json({ error: 'school_id, tahun_lulus, dan distribusi wajib' }, { status: 400 })
  }

  if (role === 'operator_sekolah' && userSekolahId !== school_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { smp_negeri, smp_swasta, pondok, tidak_melanjutkan } = distribusi

  const semuaAlumni = await db
    .select({ id: alumni.id })
    .from(alumni)
    .where(and(eq(alumni.school_id, school_id), eq(alumni.tahun_lulus, tahun_lulus)))

  const total = semuaAlumni.length
  const sum = (smp_negeri || 0) + (smp_swasta || 0) + (pondok || 0) + (tidak_melanjutkan || 0)
  if (sum > total) {
    return NextResponse.json({ error: `Jumlah distribusi (${sum}) melebihi total lulusan (${total})` }, { status: 400 })
  }

  const tujuanList: (string | null)[] = []
  for (let i = 0; i < (smp_negeri || 0); i++) tujuanList.push('smp_negeri')
  for (let i = 0; i < (smp_swasta || 0); i++) tujuanList.push('smp_swasta')
  for (let i = 0; i < (pondok || 0); i++) tujuanList.push('pondok')
  for (let i = 0; i < (tidak_melanjutkan || 0); i++) tujuanList.push('tidak_melanjutkan')
  const sisa = total - sum
  for (let i = 0; i < sisa; i++) tujuanList.push(null)

  for (let i = 0; i < semuaAlumni.length; i++) {
    await db.update(alumni).set({ tujuan: tujuanList[i] }).where(eq(alumni.id, semuaAlumni[i].id))
  }

  return NextResponse.json({ success: true, total, updated: semuaAlumni.length })
  } catch (e) {
    console.error('[API Error]', e)
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Internal error' }, { status: 500 })
  }
}
