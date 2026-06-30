import { NextRequest, NextResponse } from 'next/server'
import { guardApi, guardDb } from '@/lib/api-guard'
import { db } from '@/lib/db'
import { schools, employees, students } from '@/db/schema'
import { eq, and, count, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { session, error: authErr } = await guardApi()
  if (authErr) return authErr
  const dbErr = guardDb(db)
  if (dbErr.error) return dbErr.error

  const body = await req.json()
  const { type, format, school_id, tahun_pelajaran } = body

  const _db = db!
  const role = (session?.user as any)?.role as string
  const userSekolahId = (session?.user as any)?.sekolah_id as string | undefined

  const effectiveSchoolId = role !== 'admin_kecamatan' && userSekolahId ? userSekolahId : school_id

  const schoolFilter = effectiveSchoolId ? eq(schools.id, effectiveSchoolId) : eq(schools.is_active, 1)
  const allSchools = await _db.select().from(schools).where(schoolFilter)

  const studentFilter = effectiveSchoolId
    ? and(eq(students.status_siswa, 'aktif'), eq(students.school_id, effectiveSchoolId))
    : eq(students.status_siswa, 'aktif')
  const employeeFilter = effectiveSchoolId
    ? and(eq(employees.is_active, 1), eq(employees.sekolah_id, effectiveSchoolId))
    : eq(employees.is_active, 1)

  const [totalStudentsResult] = await _db.select({ value: count() }).from(students).where(studentFilter)
  const [totalTeachersResult] = await _db.select({ value: count() }).from(employees).where(employeeFilter)

  return NextResponse.json({
    success: true,
    data: {
      type,
      format,
      school_id: effectiveSchoolId || null,
      tahun_pelajaran: tahun_pelajaran || null,
      generatedAt: new Date().toISOString(),
      summary: {
        totalSchools: allSchools.length,
        totalStudents: totalStudentsResult.value,
        totalTeachers: totalTeachersResult.value,
        sdSchools: allSchools.filter(s => s.jenjang === 'sd').length,
        tkSchools: allSchools.filter(s => s.jenjang === 'tk').length,
        kbSchools: allSchools.filter(s => s.jenjang === 'kb').length,
      },
      schools: allSchools,
      downloadUrl: '#',
    },
  })
}
