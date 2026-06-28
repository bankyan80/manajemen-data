import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { students, schools } from '@/db/schema'
import { eq, sql, desc } from 'drizzle-orm'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'

const KELAS_SD = ['Kelas I', 'Kelas II', 'Kelas III', 'Kelas IV', 'Kelas V', 'Kelas VI']
const KELAS_TK = ['Kelompok A', 'Kelompok B']
const KELAS_KB = ['2\u20133 Tahun', '3\u20134 Tahun', '4\u20135 Tahun']

export async function GET(req: NextRequest) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const userSekolahId = (session?.user as any)?.sekolah_id

  const { searchParams } = new URL(req.url)
  const tahunPelajaran = searchParams.get('tahun_pelajaran')
  const jenjang = searchParams.get('jenjang')
  const statusFilter = searchParams.get('status')
  const desaFilter = searchParams.get('desa')
  const q = searchParams.get('q')
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')))
  const schoolId = searchParams.get('school_id')
  const format = searchParams.get('format') // 'excel' | null

  // Build school where conditions
  let schoolWhere = sql`1=1`
  if (role === 'operator_sekolah' && userSekolahId) {
    schoolWhere = sql`${schoolWhere} AND ${schools.id} = ${userSekolahId}`
  }
  if (jenjang) schoolWhere = sql`${schoolWhere} AND ${schools.jenjang} = ${jenjang}`
  if (statusFilter) schoolWhere = sql`${schoolWhere} AND ${schools.status} = ${statusFilter}`
  if (desaFilter) schoolWhere = sql`${schoolWhere} AND ${schools.desa} = ${desaFilter}`
  if (q) schoolWhere = sql`${schoolWhere} AND (${schools.nama} LIKE ${'%' + q + '%'} OR ${schools.npsn} LIKE ${'%' + q + '%'})`
  if (schoolId) schoolWhere = sql`${schoolWhere} AND ${schools.id} = ${schoolId}`

  // Get filter options
  const distinctTA = await db
    .select({ value: students.tahun_pelajaran })
    .from(students)
    .groupBy(students.tahun_pelajaran)
    .orderBy(desc(students.tahun_pelajaran))

  const distinctDesa = await db
    .select({ value: schools.desa })
    .from(schools)
    .groupBy(schools.desa)
    .orderBy(schools.desa)

  // Count matching schools
  const countRes = await db
    .select({ total: sql<number>`COUNT(*)` })
    .from(schools)
    .where(schoolWhere)
  const totalSchoolCount = countRes[0]?.total || 0

  // Get paginated schools
  const schoolList = await db
    .select()
    .from(schools)
    .where(schoolWhere)
    .orderBy(schools.nama)
    .limit(limit)
    .offset((page - 1) * limit)

  if (schoolList.length === 0) {
    const empty = {
      stats: { totalSekolah: 0, totalPD: 0, totalL: 0, totalP: 0, totalRombel: 0, rataRata: 0 },
      schools: [],
      chartData: { kelas: {}, gender: { laki_laki: 0, perempuan: 0 }, desa: {} },
      pagination: { page, limit, total: 0, total_pages: 0 },
      filters: { tahunPelajaran: distinctTA.map(r => r.value), desa: distinctDesa.map(r => r.value) },
    }
    return NextResponse.json(empty)
  }

  const schoolIds = schoolList.map(s => s.id)

  // Build student where conditions
  let studentWhere = sql`1=1`
  studentWhere = sql`${studentWhere} AND ${students.school_id} IN (${sql.join(schoolIds.map(id => sql`${id}`), sql`, `)})`
  if (tahunPelajaran) {
    studentWhere = sql`${studentWhere} AND ${students.tahun_pelajaran} = ${tahunPelajaran}`
  }

  // Get student data grouped by school + class
  const studentData = await db
    .select({
      school_id: students.school_id,
      kelas_kelompok: students.kelas_kelompok,
      laki_laki: sql<number>`SUM(CASE WHEN ${students.jenis_kelamin} = 'laki-laki' THEN 1 ELSE 0 END)`,
      perempuan: sql<number>`SUM(CASE WHEN ${students.jenis_kelamin} = 'perempuan' THEN 1 ELSE 0 END)`,
      total: sql<number>`COUNT(*)`,
    })
    .from(students)
    .where(studentWhere)
    .groupBy(students.school_id, students.kelas_kelompok)
    .orderBy(students.kelas_kelompok)

  // Group by school
  const dataBySchool = new Map<string, any[]>()
  for (const row of studentData) {
    if (!dataBySchool.has(row.school_id)) dataBySchool.set(row.school_id, [])
    dataBySchool.get(row.school_id)!.push(row)
  }

  const buildKelasData = (classes: any[], jenjang: string) => {
    const map = new Map(classes.map(c => [c.kelas_kelompok, c]))
    const data: Record<string, number> = {}
    if (jenjang === 'sd') {
      for (const k of KELAS_SD) data[k] = map.get(k)?.total || 0
    } else if (jenjang === 'tk') {
      for (const k of KELAS_TK) data[k] = map.get(k)?.total || 0
    } else {
      for (const k of KELAS_KB) data[k] = map.get(k)?.total || 0
    }
    return data
  }

  const resultSchools = schoolList.map(school => {
    const classes = dataBySchool.get(school.id) || []
    const kelasData = buildKelasData(classes, school.jenjang)
    const totalL = classes.reduce((s, c) => s + c.laki_laki, 0)
    const totalP = classes.reduce((s, c) => s + c.perempuan, 0)
    const total = classes.reduce((s, c) => s + c.total, 0)
    const rombel = classes.filter(c => c.total > 0).length

    return {
      id: school.id,
      npsn: school.npsn,
      nama: school.nama,
      desa: school.desa,
      status: school.status,
      jenjang: school.jenjang,
      alamat: school.alamat,
      kelasData,
      totalL,
      totalP,
      total,
      rombel,
    }
  })

  const totalPD = resultSchools.reduce((s, r) => s + r.total, 0)
  const totalL = resultSchools.reduce((s, r) => s + r.totalL, 0)
  const totalP = resultSchools.reduce((s, r) => s + r.totalP, 0)
  const totalRombel = resultSchools.reduce((s, r) => s + r.rombel, 0)

  // Chart: aggregate per class across all schools
  const chartKelas: Record<string, number> = {}
  for (const school of resultSchools) {
    for (const [k, v] of Object.entries(school.kelasData)) {
      chartKelas[k] = (chartKelas[k] || 0) + (v as number)
    }
  }

  // Chart: per desa
  const chartDesa: Record<string, number> = {}
  for (const school of resultSchools) {
    chartDesa[school.desa] = (chartDesa[school.desa] || 0) + school.total
  }

  if (format === 'excel') {
    const rows = resultSchools.map(s => {
      const row: Record<string, any> = {
        No: 0,
        NPSN: s.npsn,
        'Nama Sekolah': s.nama,
        Desa: s.desa,
        Status: s.status,
        Jenjang: s.jenjang.toUpperCase(),
      }
      if (s.jenjang === 'sd') {
        for (const k of KELAS_SD) row[k] = s.kelasData[k] || 0
      } else if (s.jenjang === 'tk') {
        for (const k of KELAS_TK) row[k] = s.kelasData[k] || 0
      } else {
        for (const k of KELAS_KB) row[k] = s.kelasData[k] || 0
      }
      row.L = s.totalL
      row.P = s.totalP
      row.Total = s.total
      row.Rombel = s.rombel
      return row
    })
    rows.forEach((r, i) => r.No = i + 1)

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)
    const colWidths = Object.keys(rows[0] || {}).map(k => ({ wch: Math.max(k.length, 10) + 2 }))
    ws['!cols'] = colWidths
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap Peserta Didik')
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=rekap-peserta-didik.xlsx`,
      },
    })
  }

  return NextResponse.json({
    stats: {
      totalSekolah: resultSchools.length,
      totalPD,
      totalL,
      totalP,
      totalRombel,
      rataRata: resultSchools.length > 0 ? Math.round((totalPD / resultSchools.length) * 10) / 10 : 0,
    },
    schools: resultSchools,
    chartData: { kelas: chartKelas, gender: { laki_laki: totalL, perempuan: totalP }, desa: chartDesa },
    pagination: {
      page,
      limit,
      total: totalSchoolCount,
      total_pages: Math.ceil(totalSchoolCount / limit),
    },
    filters: {
      tahunPelajaran: distinctTA.map(r => r.value),
      desa: distinctDesa.map(r => r.value),
    },
  })
}
