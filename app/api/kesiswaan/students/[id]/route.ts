import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { students } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const row = await db.select().from(students).where(eq(students.id, id)).limit(1)
  if (!row.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(row[0])
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const existing = await db.select().from(students).where(eq(students.id, id)).limit(1)
  if (!existing.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const allowed = ['nama','nik','nisn','jenis_kelamin','tempat_lahir','tanggal_lahir','alamat','nama_orang_tua','no_hp','kelas_kelompok','status_siswa','tahun_pelajaran','jenjang']
  const updateData: Record<string, any> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) updateData[key] = body[key]
  }

  await db.update(students).set(updateData).where(eq(students.id, id))
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const existing = await db.select().from(students).where(eq(students.id, id)).limit(1)
  if (!existing.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.delete(students).where(eq(students.id, id))
  return NextResponse.json({ success: true })
}
