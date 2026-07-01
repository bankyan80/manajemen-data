import { NextRequest, NextResponse } from 'next/server'
import { safeApi } from '@/lib/api-handler'
import { guardApi, guardDb } from '@/lib/api-guard'
import { db } from '@/lib/db'
import { ruang, schools } from '@/db/schema-v2'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export const PUT = (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => safeApi(async () => {
  const { session, error: authErr } = await guardApi()
  if (authErr) return authErr
  const dbErr = guardDb(db)
  if (dbErr.error) return dbErr.error

  const _db = db!
  const role = (session?.user as any)?.role as string
  const userSekolahId = (session?.user as any)?.sekolah_id as string | undefined
  const { id } = await params

  const body = await req.json()
  const { nama_ruang, jenis_ruang, kapasitas_siswa, kondisi_non_struktur } = body

  const existing = await _db
    .select({ id: ruang.id, school_id: ruang.school_id })
    .from(ruang)
    .where(eq(ruang.id, id))
    .limit(1)

  if (!existing[0]) {
    return NextResponse.json({ success: false, error: 'Data tidak ditemukan' }, { status: 404 })
  }

  if (role !== 'admin_kecamatan' && userSekolahId && existing[0].school_id !== userSekolahId) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  const updateData: Record<string, any> = { updated_at: Date.now() }
  if (nama_ruang !== undefined) updateData.nama_ruang = nama_ruang
  if (jenis_ruang !== undefined) updateData.jenis_ruang = jenis_ruang
  if (kapasitas_siswa !== undefined) updateData.kapasitas_siswa = kapasitas_siswa
  if (kondisi_non_struktur !== undefined) updateData.kondisi_non_struktur = kondisi_non_struktur

  await _db.update(ruang).set(updateData).where(eq(ruang.id, id))

  return NextResponse.json({ success: true, data: { id, ...updateData } })
})
