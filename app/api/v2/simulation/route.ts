import { NextRequest, NextResponse } from 'next/server'
import { safeApi } from '@/lib/api-handler'
import { guardApi, guardDb } from '@/lib/api-guard'
import { db } from '@/lib/db'
import { schools, employees, students } from '@/db/schema'
import { eq, count, and, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export const POST = (req: NextRequest) => safeApi(async () => {
  const { session, error: authErr } = await guardApi('admin_kecamatan')
  if (authErr) return authErr
  const dbErr = guardDb(db)
  if (dbErr.error) return dbErr.error

  const body = await req.json()
  const { scenario, params } = body

  const _db = db!

  const [totalTeachers] = await _db.select({ value: count() }).from(employees).where(eq(employees.is_active, 1))
  const [totalStudents] = await _db.select({ value: count() }).from(students).where(eq(students.status_siswa, 'aktif'))
  const [certifiedCount] = await _db.select({ value: count() }).from(employees).where(and(eq(employees.is_active, 1), eq(employees.sertifikasi, 'sudah')))

  const schoolTeacherCounts = await _db
    .select({ school_id: employees.sekolah_id, count: count() })
    .from(employees)
    .where(eq(employees.is_active, 1))
    .groupBy(employees.sekolah_id)

  const schoolsWithShortage = schoolTeacherCounts.filter(s => s.count < 7).length
  const teachersInSurplus = schoolTeacherCounts.filter(s => s.count > 20).reduce((sum, s) => sum + (s.count - 20), 0)

  const before = {
    totalTeachers: totalTeachers.value,
    totalStudents: totalStudents.value,
    certifiedTeachers: certifiedCount.value,
    schoolsWithShortage,
    teachersInSurplus,
  }

  let after = { ...before }
  let recommendations: string[] = []
  let costImpact = 0

  switch (scenario) {
    case 'retirement': {
      const years = params?.years || 5
      const retiringCount = params?.retiringCount || Math.round(totalTeachers.value * 0.15)
      after.totalTeachers = Math.max(0, before.totalTeachers - retiringCount)
      after.schoolsWithShortage = Math.min(schoolTeacherCounts.length, before.schoolsWithShortage + Math.round(retiringCount / 3))
      recommendations = [
        `Rekrut ${retiringCount} guru baru dalam ${years} tahun (${Math.ceil(retiringCount / years)}/tahun)`,
        'Prioritaskan rekrutmen guru PNS/PPPK untuk mengganti pensiun',
        'Buka program sertifikasi untuk guru pengganti',
      ]
      costImpact = retiringCount * 120000000
      break
    }
    case 'pppk': {
      const newTeachers = params?.newTeachers || 50
      after.totalTeachers = before.totalTeachers + newTeachers
      after.schoolsWithShortage = Math.max(0, before.schoolsWithShortage - Math.round(newTeachers / 3))
      recommendations = [
        `Distribusi ${newTeachers} guru PPPK ke ${Math.round(newTeachers / 3)} sekolah prioritas`,
        'Fokus pada sekolah swasta dengan kekurangan guru',
        'Buat program induksi untuk guru baru',
      ]
      costImpact = newTeachers * 65000000
      break
    }
    case 'redistribution': {
      const movedTeachers = params?.movedTeachers || Math.min(20, teachersInSurplus)
      after.teachersInSurplus = before.teachersInSurplus - movedTeachers
      after.schoolsWithShortage = Math.max(0, before.schoolsWithShortage - Math.round(movedTeachers / 2))
      recommendations = [
        `Pindahkan ${movedTeachers} guru dari ${Math.ceil(movedTeachers / 5)} sekolah surplus`,
        'Prioritaskan guru dengan masa kerja > 5 tahun untuk mutasi',
        'Buat insentif mutasi untuk guru yang bersedia pindah',
      ]
      costImpact = movedTeachers * 5000000
      break
    }
    case 'student_growth': {
      const growthRate = params?.growthRate || 5
      const newStudents = Math.round(before.totalStudents * growthRate / 100)
      after.totalStudents = before.totalStudents + newStudents
      recommendations = [
        `Antisipasi ${newStudents} siswa baru (${growthRate}% growth)`,
        `Butuh ${Math.ceil(newStudents / 28)} rombel baru`,
        `Butuh ${Math.ceil(newStudents / 20)} guru tambahan`,
      ]
      costImpact = newStudents * 2000000
      break
    }
    default:
      return NextResponse.json({ success: false, error: 'Scenario not found' }, { status: 400 })
  }

  const delta = {
    totalTeachers: after.totalTeachers - before.totalTeachers,
    totalStudents: after.totalStudents - before.totalStudents,
    certifiedTeachers: after.certifiedTeachers - before.certifiedTeachers,
    schoolsWithShortage: after.schoolsWithShortage - before.schoolsWithShortage,
    teachersInSurplus: after.teachersInSurplus - before.teachersInSurplus,
  }

  return NextResponse.json({
    success: true,
    data: {
      scenario,
      params,
      before,
      after,
      delta,
      costImpact,
      recommendations,
    },
  })
})
