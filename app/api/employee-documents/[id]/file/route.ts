import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { employeeDocuments } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const doc = await db
    .select()
    .from(employeeDocuments)
    .where(eq(employeeDocuments.id, id))
    .limit(1)
    .then(r => r[0])

  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const filePath = join(process.cwd(), 'public', doc.drive_url)
  try {
    const fileBuffer = await readFile(filePath)
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': doc.mime_type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${doc.nama_file}"`,
        'Content-Length': String(fileBuffer.length),
      },
    })
  } catch {
    return NextResponse.json({ error: 'File not found on disk' }, { status: 404 })
  }
}
