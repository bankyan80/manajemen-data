import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { spmbPendaftar } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { put } from '@vercel/blob'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  const pendaftarId = formData.get('pendaftar_id') as string
  const jenis = formData.get('jenis') as string

  if (!file || !pendaftarId || !jenis) {
    return NextResponse.json({ error: 'file, pendaftar_id, jenis required' }, { status: 400 })
  }

  const blob = await put(`spmb/${pendaftarId}/${jenis}_${file.name}`, file, { access: 'public' })

  const fieldMap: Record<string, string> = {
    kk: 'file_kk_url',
    akta: 'file_akta_url',
    afirmasi: 'file_afirmasi_url',
    mutasi: 'file_mutasi_url',
  }
  const field = fieldMap[jenis]
  if (!field) return NextResponse.json({ error: 'Invalid jenis' }, { status: 400 })

  await db.update(spmbPendaftar).set({ [field]: blob.url } as any).where(eq(spmbPendaftar.id, pendaftarId))

  return NextResponse.json({ data: { url: blob.url, jenis } })

  } catch (e) {
    console.error('[API Error]', e);
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Internal error' }, { status: 500 });
  }
  }
