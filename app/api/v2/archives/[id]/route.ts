import { NextRequest, NextResponse } from 'next/server'
import { safeApi } from '@/lib/api-handler'
import { guardApi, guardDb } from '@/lib/api-guard'
import { db } from '@/lib/db'
import { arsipDigital } from '@/db/schema-v2'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export const PUT = (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => safeApi(async () => {
  const { session, error } = await guardApi()
  if (error) return error
  const dbErr = guardDb(db)
  if (dbErr.error) return dbErr.error

  const { id } = await params
  const body = await req.json()

  const _db = db!

  const existing = await _db.select({ id: arsipDigital.id }).from(arsipDigital).where(eq(arsipDigital.id, id)).limit(1)
  if (existing.length === 0) {
    return NextResponse.json({ success: false, error: 'Arsip tidak ditemukan' }, { status: 404 })
  }

  await _db.update(arsipDigital).set({
    category: body.category,
    document_type: body.document_type,
    deskripsi: body.deskripsi,
  }).where(eq(arsipDigital.id, id))

  return NextResponse.json({ success: true })
})
