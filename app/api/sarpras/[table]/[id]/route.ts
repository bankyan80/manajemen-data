import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tanah, bangunan, ruang, subRuang, sarana, buku } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

const TABLES: Record<string, any> = { tanah, bangunan, ruang, sub_ruang: subRuang, sarana, buku }

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ table: string; id: string }> }) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const { table, id } = await params
  const tbl = TABLES[table]
  if (!tbl) return NextResponse.json({ error: `Unknown table: ${table}` }, { status: 400 })

  const body = await req.json()
  const update: Record<string, any> = { updated_at: Date.now() }
  for (const key of Object.keys(body)) {
    if (key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
      update[key] = body[key]
    }
  }

  await db.update(tbl).set(update).where(eq(tbl.id, id))
  return NextResponse.json({ success: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ table: string; id: string }> }) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const { table, id } = await params
  const tbl = TABLES[table]
  if (!tbl) return NextResponse.json({ error: `Unknown table: ${table}` }, { status: 400 })

  await db.delete(tbl).where(eq(tbl.id, id))
  return NextResponse.json({ success: true })
}
