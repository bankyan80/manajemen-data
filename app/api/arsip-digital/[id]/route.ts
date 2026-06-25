import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { arsipDigital } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { del } from '@vercel/blob'
import { deleteFileFromDrive } from '@/lib/drive'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const { id } = await params

  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session?.user as any)?.role
  const userSekolahId = (session?.user as any)?.sekolah_id

  const where = role === 'operator_sekolah' && userSekolahId
    ? and(eq(arsipDigital.id, id), eq(arsipDigital.school_id, userSekolahId))
    : eq(arsipDigital.id, id)

  const record = await db.select().from(arsipDigital).where(where).limit(1)
  if (!record[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ data: record[0] })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const { id } = await params

  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const allowed = ['category', 'document_type', 'deskripsi']
  const updates: Record<string, any> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Tidak ada field yang diupdate' }, { status: 400 })
  }

  await db.update(arsipDigital).set(updates).where(eq(arsipDigital.id, id))
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const { id } = await params

  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session?.user as any)?.role

  const where = eq(arsipDigital.id, id)
  const record = await db.select().from(arsipDigital).where(where).limit(1)
  if (!record[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    if (record[0].storage === 'drive' && record[0].drive_file_id) {
      await deleteFileFromDrive(record[0].drive_file_id).catch(() => {})
    } else if (record[0].storage === 'blob' && record[0].file_url) {
      await del(record[0].file_url).catch(() => {})
    }
  } catch {}

  await db.delete(arsipDigital).where(eq(arsipDigital.id, id))
  return NextResponse.json({ success: true })
}
