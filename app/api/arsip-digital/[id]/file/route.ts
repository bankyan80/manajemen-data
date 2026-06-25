import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { arsipDigital } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const { id } = await params

  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const record = await db.select().from(arsipDigital).where(eq(arsipDigital.id, id)).limit(1)
  if (!record[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const doc = record[0]

  if (doc.storage === 'blob' && doc.file_url) {
    const res = await fetch(doc.file_url)
    if (!res.ok) return NextResponse.json({ error: 'File not found on storage' }, { status: 404 })
    const blob = await res.blob()
    return new NextResponse(blob, {
      headers: {
        'Content-Type': doc.file_type,
        'Content-Disposition': `inline; filename="${doc.file_name}"`,
        'Cache-Control': 'public, max-age=31536000',
      },
    })
  }

  return NextResponse.json({ error: 'File tidak tersedia' }, { status: 404 })
}
