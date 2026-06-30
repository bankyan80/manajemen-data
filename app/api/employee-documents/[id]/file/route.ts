import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { employeeDocuments } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
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

  if (!doc || !doc.drive_url) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.redirect(doc.drive_url)

  } catch (e) {
    console.error('[API Error]', e);
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Internal error' }, { status: 500 });
  }
  }
