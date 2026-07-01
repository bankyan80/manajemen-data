import { NextRequest, NextResponse } from 'next/server'
import { safeApi } from '@/lib/api-handler'
import { guardApi, guardDb } from '@/lib/api-guard'
import { db } from '@/lib/db'
import { students, classes, employees } from '@/db/schema-v2'
import { eq, and, count, sql, inArray } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export const GET = (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => safeApi(async () => {
  const { error } = await guardApi()
  if (error) return error
  const dbErr = guardDb(db)
  if (dbErr.error) return dbErr.error

  const _db = db!
  const { id } = await params

  const rombelRows = await _db
    .select({
      kelas_kelompok: students.kelas_kelompok,
      total: count(),
      laki: sql<number>`SUM(CASE WHEN ${students.jenis_kelamin} IN ('laki-laki', 'L', 'Laki-laki') THEN 1 ELSE 0 END)`,
      perempuan: sql<number>`SUM(CASE WHEN ${students.jenis_kelamin} IN ('perempuan', 'P', 'Perempuan') THEN 1 ELSE 0 END)`,
    })
    .from(students)
    .where(and(eq(students.school_id, id), eq(students.status_siswa, 'aktif')))
    .groupBy(students.kelas_kelompok)
    .orderBy(students.kelas_kelompok)

  const classRows = await _db
    .select({
      nama_kelas: classes.nama_kelas,
      wali_kelas_id: classes.wali_kelas_id,
    })
    .from(classes)
    .where(eq(classes.school_id, id))

  const classMap: Record<string, string | null> = {}
  for (const c of classRows) {
    classMap[c.nama_kelas] = c.wali_kelas_id
  }

  const waliIds = classRows.filter(c => c.wali_kelas_id).map(c => c.wali_kelas_id) as string[]
  const waliNames: Record<string, string> = {}
  if (waliIds.length > 0) {
    const empRows = await _db
      .select({ id: employees.id, nama: employees.nama })
      .from(employees)
      .where(inArray(employees.id, waliIds))
    for (const e of empRows) {
      waliNames[e.id] = e.nama
    }
  }

  const rombel = rombelRows.map(r => ({
    kelas_kelompok: r.kelas_kelompok,
    total: r.total,
    laki: r.laki,
    perempuan: r.perempuan,
    wali_kelas_id: classMap[r.kelas_kelompok] || null,
    wali_kelas: (classMap[r.kelas_kelompok] && waliNames[classMap[r.kelas_kelompok]!]) || null,
  }))

  const teachers = await _db
    .select({ id: employees.id, nama: employees.nama })
    .from(employees)
    .where(eq(employees.sekolah_id, id))
    .orderBy(employees.nama)

  const totalSiswa = rombel.reduce((s, r) => s + r.total, 0)
  const totalRombel = rombel.length

  return NextResponse.json({
    success: true,
    data: { rombel, totalSiswa, totalRombel, teachers },
  })
})

export const PUT = async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => safeApi(async () => {
  const { session, error } = await guardApi()
  if (error) return error
  const dbErr = guardDb(db)
  if (dbErr.error) return dbErr.error

  const _db = db!
  const { id } = await params

  const role = (session?.user as any)?.role as string
  const userSekolahId = (session?.user as any)?.sekolah_id as string | undefined
  if (role !== 'admin_kecamatan' && userSekolahId !== id) {
    return NextResponse.json({ success: false, error: 'Tidak memiliki akses ke sekolah ini' }, { status: 403 })
  }

  const body = await req.json()
  const { kelas_kelompok, wali_kelas_id } = body
  if (!kelas_kelompok) {
    return NextResponse.json({ success: false, error: 'kelas_kelompok wajib diisi' }, { status: 400 })
  }

  const existing = await _db
    .select({ id: classes.id })
    .from(classes)
    .where(and(eq(classes.school_id, id), eq(classes.nama_kelas, kelas_kelompok)))
    .limit(1)

  if (existing.length > 0) {
    await _db.update(classes).set({ wali_kelas_id: wali_kelas_id || null }).where(eq(classes.id, existing[0].id))
  } else {
    await _db.insert(classes).values({ school_id: id, nama_kelas: kelas_kelompok, wali_kelas_id: wali_kelas_id || null, tingkat: kelas_kelompok })
  }

  return NextResponse.json({ success: true, data: { message: 'Wali kelas berhasil diupdate' } })
})
