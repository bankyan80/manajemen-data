import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { settings } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const rows = await db.select().from(settings)
  const map: Record<string, string> = {}
  for (const s of rows) map[s.key] = s.value
  return NextResponse.json(map)
}

export async function PUT(req: NextRequest) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const body = await req.json()
  const { key, value } = body
  if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 })

  const existing = await db.select().from(settings).where(eq(settings.key, key)).limit(1)
  if (existing.length > 0) {
    await db.update(settings).set({ value: String(value) }).where(eq(settings.key, key))
  } else {
    await db.insert(settings).values({ key, value: String(value) })
  }
  return NextResponse.json({ success: true })
}
