import { NextRequest, NextResponse } from 'next/server'
import { safeApi } from '@/lib/api-handler'
import { guardApi, guardDb } from '@/lib/api-guard'
import { db } from '@/lib/db'
import { schools, employees, students } from '@/db/schema-v2'
import { eq, and, count, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export const POST = (req: NextRequest) => safeApi(async () => {
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
  const allSchools = await _db
    .select({
      id: schools.id,
      nama: schools.nama,
      npsn: schools.npsn,
      jenjang: schools.jenjang,
      status: schools.status,
      alamat: schools.alamat,
      desa: schools.desa,
      kecamatan: schools.kecamatan,
      kepala_id: schools.kepala_id,
      latitude: schools.latitude,
      longitude: schools.longitude,
      is_active: schools.is_active,
      created_at: schools.created_at,
      updated_at: schools.updated_at,
    })
    .from(schools)
    .where(schoolFilter)

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
})
