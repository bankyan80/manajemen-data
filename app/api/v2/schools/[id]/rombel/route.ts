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
      laki: sql<number>`SUM(CASE WHEN ${students.jenis_kelamin} = 'laki-laki' THEN 1 ELSE 0 END)`,
      perempuan: sql<number>`SUM(CASE WHEN ${students.jenis_kelamin} = 'perempuan' THEN 1 ELSE 0 END)`,
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

  const waliMap: Record<string, string> = {}
  for (const c of classRows) {
    if (c.wali_kelas_id) {
      waliMap[c.wali_kelas_id] = c.nama_kelas
    }
  }

  const waliIds = classRows.filter(c => c.wali_kelas_id).map(c => c.wali_kelas_id)
  const waliNames: Record<string, string> = {}
  if (waliIds.length > 0) {
    const empRows = await _db
      .select({ id: employees.id, nama: employees.nama })
      .from(employees)
      .where(inArray(employees.id, waliIds as string[]))
    for (const e of empRows) {
      waliNames[e.id] = e.nama
    }
  }

  const rombel = rombelRows.map(r => ({
    kelas_kelompok: r.kelas_kelompok,
    total: r.total,
    laki: r.laki,
    perempuan: r.perempuan,
    wali_kelas: waliNames[Object.keys(waliMap).find(k => waliMap[k] === r.kelas_kelompok) || ''] || null,
  }))

  const totalSiswa = rombel.reduce((s, r) => s + r.total, 0)
  const totalRombel = rombel.length

  return NextResponse.json({
    success: true,
    data: { rombel, totalSiswa, totalRombel },
  })
})
