import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { studentMutations } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const row = await db.select().from(studentMutations).where(eq(studentMutations.id, id)).limit(1)
  if (!row.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (row[0].jenis !== 'keluar') return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(row[0])

  } catch (e) {
    console.error('[API Error]', e);
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Internal error' }, { status: 500 });
  }
  }

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const existing = await db.select().from(studentMutations).where(eq(studentMutations.id, id)).limit(1)
  if (!existing.length || existing[0].jenis !== 'keluar') return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const allowed = ['tanggal','nama','nisn','nik','jenis_kelamin','kelas_kelompok','sekolah_tujuan','alasan','dokumen_url','keterangan']
  const updateData: Record<string, any> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) updateData[key] = body[key]
  }

  await db.update(studentMutations).set(updateData).where(eq(studentMutations.id, id))
  return NextResponse.json({ success: true })

  } catch (e) {
    console.error('[API Error]', e);
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Internal error' }, { status: 500 });
  }
  }

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const existing = await db.select().from(studentMutations).where(eq(studentMutations.id, id)).limit(1)
  if (!existing.length || existing[0].jenis !== 'keluar') return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.delete(studentMutations).where(eq(studentMutations.id, id))
  return NextResponse.json({ success: true })

  } catch (e) {
    console.error('[API Error]', e);
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Internal error' }, { status: 500 });
  }
  }
