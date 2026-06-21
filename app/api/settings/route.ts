import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { settings } from '@/db/schema'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export async function GET() {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const rows = await db.select().from(settings)
  const map: Record<string, string> = {}
  for (const s of rows) map[s.key] = s.value
  return NextResponse.json(map)
}
