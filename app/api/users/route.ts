import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, schools, employees } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export async function GET() {
  try {
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

  } catch (e) {
    console.error('[API Error]', e);
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Internal error' }, { status: 500 });
  }
  }

export async function POST(req: NextRequest) {
  try {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const body = await req.json()
  const { name, username, password, email, role, sekolah_id, pegawai_id } = body
  if (!name || !username || !password || !role) {
    return NextResponse.json({ error: 'name, username, password, role required' }, { status: 400 })
  }
  const hash = bcrypt.hashSync(password, 10)
  const [newUser] = await db.insert(users).values({
    name, username, password: hash, email, role,
    sekolah_id: sekolah_id || null, pegawai_id: pegawai_id || null,
    is_active: 1,
  }).returning()
  return NextResponse.json(newUser, { status: 201 })

  } catch (e) {
    console.error('[API Error]', e);
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Internal error' }, { status: 500 });
  }
  }
