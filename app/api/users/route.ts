import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, schools, employees } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export async function GET() {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      email: users.email,
      role: users.role,
      is_active: users.is_active,
      sekolah_id: users.sekolah_id,
      pegawai_id: users.pegawai_id,
      school_nama: schools.nama,
      school_npsn: schools.npsn,
      employee_nama: employees.nama,
    })
    .from(users)
    .leftJoin(schools, eq(users.sekolah_id, schools.id))
    .leftJoin(employees, eq(users.pegawai_id, employees.id))
    .orderBy(users.name)

  return NextResponse.json(rows)
}
