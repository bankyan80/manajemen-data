import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { schools } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const { id } = await params
  const [school] = await db.select().from(schools).where(eq(schools.id, id)).limit(1)
  if (!school) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(school)

  } catch (e) {
    console.error('[API Error]', e);
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Internal error' }, { status: 500 });
  }
  }

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const { id } = await params
  const body = await req.json()

  const allowed = [
    'nama', 'npsn', 'jenjang', 'status',
    'alamat', 'desa', 'kecamatan',
    'kepala_id', 'latitude', 'longitude',
  ]

  const update: Record<string, any> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) update[key] = body[key]
  }
  update.updated_at = Date.now()

  await db.update(schools).set(update).where(eq(schools.id, id))

  return NextResponse.json({ success: true })

  } catch (e) {
    console.error('[API Error]', e);
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Internal error' }, { status: 500 });
  }
  }

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const { id } = await params
  await db.delete(schools).where(eq(schools.id, id))
  return NextResponse.json({ success: true })

  } catch (e) {
    console.error('[API Error]', e);
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Internal error' }, { status: 500 });
  }
  }
