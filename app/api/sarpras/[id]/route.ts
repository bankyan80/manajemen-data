import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { infrastructure } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const { id } = await params
  const body = await req.json()

  const allowed = ['tahun_pelajaran','jenis_sarpras','jumlah','kondisi_baik','rusak_ringan','rusak_sedang','rusak_berat','kebutuhan','keterangan']
  const update: Record<string, any> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) update[key] = body[key]
  }
  update.updated_at = Date.now()

  await db.update(infrastructure).set(update).where(eq(infrastructure.id, id))
  return NextResponse.json({ success: true })
}
