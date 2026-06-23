import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const { id } = await params
  const body = await req.json()
  const allowed = ['name', 'username', 'email', 'role', 'sekolah_id', 'pegawai_id', 'is_active']
  const update: Record<string, any> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) update[key] = body[key]
  }
  if (body.password) {
    update.password = bcrypt.hashSync(body.password, 10)
  }
  update.updated_at = Date.now()
  await db.update(users).set(update).where(eq(users.id, id))
  return NextResponse.json({ success: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const { id } = await params
  await db.delete(users).where(eq(users.id, id))
  return NextResponse.json({ success: true })
}
