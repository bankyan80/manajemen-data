import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { employees } from '@/db/schema'
import { lte, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role

  if (role !== 'admin_kecamatan') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const today = new Date().toISOString().split('T')[0]

  const result = await db
    .update(employees)
    .set({ is_active: 0 })
    .where(sql`${employees.tanggal_bup} <= ${today} AND ${employees.is_active} = 1`)

  const affected = result.rowsAffected || 0

  return NextResponse.json({
    success: true,
    nonaktifkan: affected,
    message: `${affected} pegawai dinonaktifkan karena sudah BUP`,
  })
}
