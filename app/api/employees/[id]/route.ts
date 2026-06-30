import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { employees } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const { id } = await params
  const body = await req.json()

  const allowed = [
    'nama', 'nik', 'nip', 'nuptk', 'email', 'no_hp',
    'tempat_lahir', 'tanggal_lahir', 'jenis_kelamin',
    'jabatan', 'status_pegawai', 'pangkat_golongan',
    'pendidikan_terakhir', 'jurusan', 'sertifikasi',
    'tmt_kerja', 'tanggal_bup', 'is_active', 'sekolah_id',
  ]

  const update: Record<string, any> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) update[key] = body[key]
  }
  update.updated_at = Date.now()

  await db.update(employees).set(update).where(eq(employees.id, id))

  return NextResponse.json({ success: true })

  } catch (e) {
    console.error('[API Error]', e);
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Internal error' }, { status: 500 });
  }
  }
