import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { infrastructure } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const { id } = await params
  const body = await req.json()

  const update: Record<string, any> = {}
  if (body.tahun_pelajaran !== undefined) update.tahun_pelajaran = body.tahun_pelajaran
  if (body.kategori !== undefined) update.kategori = body.kategori
  if (body.data !== undefined) update.data = typeof body.data === 'string' ? body.data : JSON.stringify(body.data)
  if (body.keterangan !== undefined) update.keterangan = body.keterangan
  update.updated_at = Date.now()

  await db.update(infrastructure).set(update).where(eq(infrastructure.id, id))
  return NextResponse.json({ success: true })
}
