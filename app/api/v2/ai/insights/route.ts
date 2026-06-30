import { NextResponse } from 'next/server'
import { guardApi, guardDb } from '@/lib/api-guard'
import { db } from '@/lib/db'
import { schools, employees, students } from '@/db/schema-v2'
import { eq, count, sql, and } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { error: authErr } = await guardApi()
  if (authErr) return authErr
  const dbErr = guardDb(db)
  if (dbErr.error) return dbErr.error

  const _db = db!

  const [schoolCount] = await _db.select({ value: count() }).from(schools).where(eq(schools.is_active, 1))
  const [teacherCount] = await _db.select({ value: count() }).from(employees).where(eq(employees.is_active, 1))
  const [studentCount] = await _db.select({ value: count() }).from(students).where(eq(students.status_siswa, 'aktif'))
  const [certifiedCount] = await _db.select({ value: count() }).from(employees).where(and(eq(employees.is_active, 1), eq(employees.sertifikasi, 'sudah')))
  const [uncertifiedCount] = await _db.select({ value: count() }).from(employees).where(and(eq(employees.is_active, 1), eq(employees.sertifikasi, 'belum')))

  const teacherShortageSchools = await _db
    .select({ school_id: employees.sekolah_id, count: count() })
    .from(employees)
    .where(eq(employees.is_active, 1))
    .groupBy(employees.sekolah_id)
    .having(sql`count(*) < 7`)

  const insights: Array<{
    type: 'warning' | 'info' | 'success' | 'critical'
    title: string
    description: string
    category: string
    action?: string
  }> = []

  const uncertifiedPct = teacherCount.value > 0 ? Math.round((uncertifiedCount.value / teacherCount.value) * 100) : 0
  if (uncertifiedPct > 50) {
    insights.push({
      type: 'critical',
      title: 'Rendahnya Sertifikasi Guru',
      description: `${uncertifiedPct}% guru (${uncertifiedCount.value} dari ${teacherCount.value}) belum bersertifikasi. Prioritaskan program sertifikasi.`,
      category: 'sertifikasi',
      action: 'Buka halaman Sertifikasi',
    })
  }

  if (teacherShortageSchools.length > 0) {
    insights.push({
      type: 'warning',
      title: `Kekurangan Guru di ${teacherShortageSchools.length} Sekolah`,
      description: `${teacherShortageSchools.length} sekolah memiliki kurang dari 7 guru. Rekomendasi: redistribusi guru atau rekrut PPPK.`,
      category: 'kepegawaian',
      action: 'Buka halaman Guru',
    })
  }

  const ratio = schoolCount.value > 0 ? Math.round(studentCount.value / schoolCount.value) : 0
  insights.push({
    type: 'info',
    title: 'Rasio Rata-rata Siswa per Sekolah',
    description: `Rata-rata ${ratio} siswa per sekolah dari ${schoolCount.value} sekolah aktif. Total ${studentCount.value} siswa.`,
    category: 'kesiswaan',
  })

  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const fiveYearsLater = new Date(now.getFullYear() + 5, now.getMonth(), now.getDate())
  const fiveYearsStr = fiveYearsLater.toISOString().slice(0, 10)

  const [retiringSoon] = await _db
    .select({ count: count() })
    .from(employees)
    .where(
      and(
        eq(employees.is_active, 1),
        sql`${employees.tanggal_bup} IS NOT NULL`,
        sql`${employees.tanggal_bup} >= ${todayStr}`,
        sql`${employees.tanggal_bup} <= ${fiveYearsStr}`,
      )
    )

  if (retiringSoon.count > 0) {
    insights.push({
      type: 'warning',
      title: `${retiringSoon.count} Guru Mendekati Pensiun`,
      description: `${retiringSoon.count} guru akan pensiun dalam 5 tahun ke depan. Perencanaan regenerasi diperlukan.`,
      category: 'kepegawaian',
      action: 'Buka halaman Guru',
    })
  }

  const certifiedPct = teacherCount.value > 0 ? Math.round((certifiedCount.value / teacherCount.value) * 100) : 0
  insights.push({
    type: 'success',
    title: `${certifiedPct}% Guru Sudah Tersertifikasi`,
    description: `${certifiedCount.value} dari ${teacherCount.value} guru sudah tersertifikasi. Progress baik.`,
    category: 'sertifikasi',
  })

  return NextResponse.json({
    success: true,
    data: {
      insights,
      summary: {
        totalSchools: schoolCount.value,
        totalTeachers: teacherCount.value,
        totalStudents: studentCount.value,
        certifiedTeachers: certifiedCount.value,
        uncertifiedTeachers: uncertifiedCount.value,
        teacherShortageSchools: teacherShortageSchools.length,
        retiringSoon: retiringSoon.count || 0,
      },
      generatedAt: new Date().toISOString(),
    },
  })
}
