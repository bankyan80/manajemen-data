import { NextResponse } from 'next/server'
import { guardApi, guardDb } from '@/lib/api-guard'
import { db } from '@/lib/db'
import { schools, employees, students, sarana } from '@/db/schema-v2'
import { count, eq, sql, lt, gte, and } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET() {
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
      count: count(),
    })
    .from(employees)
    .where(eq(employees.is_active, 1))
    .groupBy(employees.sekolah_id)

  const teacherShortage = teacherCounts.filter((r) => r.count < 7).length
  const teacherSurplus = teacherCounts.filter((r) => r.count > 20).length

  const now = new Date()
  const fiveYearsLater = new Date(now.getFullYear() + 5, now.getMonth(), now.getDate())
  const fiveYearsLaterTs = fiveYearsLater.getTime()
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
      teacherShortage,
      teacherSurplus,
      certificationPending: certificationPending.value,
      retirementRisk: retirementRisk.value,
      damagedClassrooms: damagedClassrooms.value,
    },
  })
}
