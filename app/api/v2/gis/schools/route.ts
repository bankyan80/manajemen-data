import { NextRequest, NextResponse } from 'next/server'
import { safeApi } from '@/lib/api-handler'
import { guardApi, guardDb } from '@/lib/api-guard'
import { db } from '@/lib/db'
import { schools, employees, students } from '@/db/schema-v2'
import { eq, sql, count } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export const GET = (req: NextRequest) => safeApi(async () => {
  const { session, error } = await guardApi()
  if (error) return error
  const dbErr = guardDb(db)
  if (dbErr.error) return dbErr.error

  const _db = db!
  const role = (session?.user as any)?.role as string
  const userSekolahId = (session?.user as any)?.sekolah_id as string | undefined

  const { searchParams } = new URL(req.url)
  const layer = searchParams.get('layer') || 'teacher_shortage'

  let whereConditions = sql`${schools.is_active} = 1`
  if (role !== 'admin_kecamatan' && userSekolahId) {
    whereConditions = sql`${whereConditions} AND ${schools.id} = ${userSekolahId}`
  }

  const schoolRows = await _db
    .select({
      id: schools.id,
      nama: schools.nama,
      npsn: schools.npsn,
      jenjang: schools.jenjang,
      status: schools.status,
      desa: schools.desa,
      latitude: schools.latitude,
      longitude: schools.longitude,
    })
    .from(schools)
    .where(whereConditions)

  const teacherCounts = await _db
    .select({
      school_id: employees.sekolah_id,
      count: count(),
      certified: sql<number>`SUM(CASE WHEN ${employees.sertifikasi} = 'sudah' THEN 1 ELSE 0 END)`,
      retiring_soon: sql<number>`SUM(CASE WHEN ${employees.tanggal_bup} IS NOT NULL AND ${employees.tanggal_bup} <= date('now', '+5 years') THEN 1 ELSE 0 END)`,
    })
    .from(employees)
    .where(eq(employees.is_active, 1))
    .groupBy(employees.sekolah_id)

  const studentCounts = await _db
    .select({
      school_id: students.school_id,
      count: count(),
    })
    .from(students)
    .where(eq(students.status_siswa, 'aktif'))
    .groupBy(students.school_id)

  const tcMap = new Map(teacherCounts.map(t => [t.school_id, t]))
  const scMap = new Map(studentCounts.map(s => [s.school_id, s.count]))

  const features = schoolRows
    .filter(s => s.latitude && s.longitude)
    .map(s => {
      const tc = tcMap.get(s.id)
      const studentCount = scMap.get(s.id) || 0
      const teacherCount = tc?.count || 0
      const ratio = studentCount > 0 ? Math.round((teacherCount / studentCount) * 100) / 100 : 0

      let markerColor = '#10B981'
      if (layer === 'teacher_shortage') {
        if (teacherCount < 5) markerColor = '#EF4444'
        else if (teacherCount < 8) markerColor = '#F59E0B'
        else if (teacherCount > 20) markerColor = '#3B82F6'
      } else if (layer === 'certification') {
        const certified = tc?.certified || 0
        const pct = teacherCount > 0 ? certified / teacherCount : 0
        if (pct < 0.3) markerColor = '#EF4444'
        else if (pct < 0.6) markerColor = '#F59E0B'
        else markerColor = '#10B981'
      } else if (layer === 'student_density') {
        if (studentCount > 500) markerColor = '#EF4444'
        else if (studentCount > 250) markerColor = '#F59E0B'
        else markerColor = '#10B981'
      } else if (layer === 'retirement') {
        const retiring = tc?.retiring_soon || 0
        if (retiring > 5) markerColor = '#EF4444'
        else if (retiring > 2) markerColor = '#F59E0B'
        else markerColor = '#10B981'
      }

      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [s.longitude, s.latitude],
        },
        properties: {
          id: s.id,
          nama: s.nama,
          npsn: s.npsn,
          jenjang: s.jenjang,
          status: s.status,
          desa: s.desa,
          teacherCount,
          studentCount,
          ratio,
          certifiedTeachers: tc?.certified || 0,
          retiringSoon: tc?.retiring_soon || 0,
          healthScore: 0,
          markerColor,
        },
      }
    })

  return NextResponse.json({
    success: true,
    data: {
      type: 'FeatureCollection',
      features,
      center: [-7.0, 108.5],
      zoom: 12,
    },
  })
})
