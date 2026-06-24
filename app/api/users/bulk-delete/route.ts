import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function DELETE() {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const toDelete = await db.select({ id: users.id }).from(users).where(eq(users.role, 'pegawai'))
  const ids = toDelete.map(u => u.id)

  if (ids.length === 0) {
    return NextResponse.json({ deleted: 0, message: 'Tidak ada user pegawai yang ditemukan' })
  }

  for (const id of ids) {
    await db.delete(users).where(eq(users.id, id))
  }

  return NextResponse.json({ deleted: ids.length, message: `Berhasil menghapus ${ids.length} user pegawai` })
}
