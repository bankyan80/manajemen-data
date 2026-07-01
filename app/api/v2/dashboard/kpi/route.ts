import { NextResponse } from 'next/server'
import { safeApi } from '@/lib/api-handler'
import { guardApi, guardDb } from '@/lib/api-guard'
import { db } from '@/lib/db'
import { schools, employees, students, sarana } from '@/db/schema-v2'
import { count, eq, sql, and } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export const GET = () => safeApi(async () => {
  const { error } = await guardApi()
  if (error) return error
  const dbErr = guardDb(db)
  if (dbErr.error) return dbErr.error

  const _db = db!

  const [totalSchools] = await _db.select({ value: count() }).from(schools).where(eq(schools.is_active, 1))

  const [totalStudents] = await _db.select({ value: count() }).from(students).where(eq(students.status_siswa, 'aktif'))

  const [totalTeachers] = await _db.select({ value: count() }).from(employees).where(eq(employees.is_active, 1))

  const [certificationPending] = await _db.select({ value: count() }).from(employees).where(eq(employees.sertifikasi, 'belum'))

  const teacherCounts = await _db
    .select({
      school_id: employees.sekolah_id,
      school_nama: schools.nama,
      count: count(),
    })
    .from(employees)
    .leftJoin(schools, eq(employees.sekolah_id, schools.id))
    .where(sql`${employees.is_active} = 1 AND ${schools.status} = 'negeri'`)
    .groupBy(employees.sekolah_id)

  const shortageSchools = teacherCounts.filter((r) => r.count < 7).map(r => ({
    school_id: r.school_id,
    school_nama: r.school_nama || 'Unknown',
    teacher_count: r.count,
  }))

  const surplusSchools = teacherCounts.filter((r) => r.count > 20).map(r => ({
    school_id: r.school_id,
    school_nama: r.school_nama || 'Unknown',
    teacher_count: r.count,
  }))

  const now = new Date()
  const fiveYearsLater = new Date(now.getFullYear() + 5, now.getMonth(), now.getDate())
  const todayStr = now.toISOString().slice(0, 10)
  const fiveYearsStr = fiveYearsLater.toISOString().slice(0, 10)

  const [retirementRisk] = await _db
    .select({ value: count() })
    .from(employees)
    .where(
      and(
        sql`${employees.tanggal_bup} IS NOT NULL`,
        sql`${employees.tanggal_bup} >= ${todayStr}`,
        sql`${employees.tanggal_bup} <= ${fiveYearsStr}`,
      )
    )

  const [damagedClassrooms] = await _db
    .select({ value: count() })
    .from(sarana)
    .where(sql`${sarana.kondisi} IN ('rusak_sedang', 'rusak_berat')`)

  return NextResponse.json({
    success: true,
    data: {
      totalSchools: totalSchools.value,
      totalStudents: totalStudents.value,
      totalTeachers: totalTeachers.value,
      teacherShortage: shortageSchools.length,
      teacherSurplus: surplusSchools.length,
      teacherShortageSchools: shortageSchools,
      teacherSurplusSchools: surplusSchools,
      certificationPending: certificationPending.value,
      retirementRisk: retirementRisk.value,
      damagedClassrooms: damagedClassrooms.value,
    },
  })
})
