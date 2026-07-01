import { NextRequest, NextResponse } from 'next/server'
import { safeApi } from '@/lib/api-handler'
import { guardApi, guardDb } from '@/lib/api-guard'
import { db } from '@/lib/db'
import { schools, employees, students, studentMutations, studentRecaps, certifications, alumni } from '@/db/schema-v2'
import { eq, and, count, sql, gte, lte, like } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

const CURRENT_MONTH = 6
const CURRENT_YEAR = 2026
const TP_SD = '2026/2027'
const TP_TK_KB = '2025/2026'

async function reportMonthly(_db: NonNullDb, schoolFilter: any, effectiveSchoolId: string | null) {
  const studentFilter = effectiveSchoolId
    ? and(eq(students.status_siswa, 'aktif'), eq(students.school_id, effectiveSchoolId))
    : eq(students.status_siswa, 'aktif')

  const allSchools = await _db
    .select({
      id: schools.id, nama: schools.nama, npsn: schools.npsn,
      jenjang: schools.jenjang, status: schools.status, desa: schools.desa,
    })
    .from(schools)
    .where(schoolFilter)

  const [totalStudentsResult] = await _db.select({ value: count() }).from(students).where(studentFilter)
  const [totalTeachersResult] = await _db.select({ value: count() }).from(employees)
    .where(effectiveSchoolId ? and(eq(employees.is_active, 1), eq(employees.sekolah_id, effectiveSchoolId)) : eq(employees.is_active, 1))

  const siswaPerKelas = await _db
    .select({
      jenjang: students.jenjang,
      kelas_kelompok: students.kelas_kelompok,
      total: count(),
      laki: sql<number>`SUM(CASE WHEN ${students.jenis_kelamin} = 'laki-laki' THEN 1 ELSE 0 END)`,
      perempuan: sql<number>`SUM(CASE WHEN ${students.jenis_kelamin} = 'perempuan' THEN 1 ELSE 0 END)`,
    })
    .from(students)
    .where(studentFilter)
    .groupBy(students.jenjang, students.kelas_kelompok)
    .orderBy(students.jenjang, students.kelas_kelompok)

  const mutasiBulanIni = await _db
    .select({
      jenis: studentMutations.jenis,
      total: count(),
    })
    .from(studentMutations)
    .where(
      effectiveSchoolId
        ? and(eq(studentMutations.school_id, effectiveSchoolId), sql`strftime('%m', ${studentMutations.tanggal}) = '06'`, sql`strftime('%Y', ${studentMutations.tanggal}) = '2026'`)
        : and(sql`strftime('%m', ${studentMutations.tanggal}) = '06'`, sql`strftime('%Y', ${studentMutations.tanggal}) = '2026'`)
    )
    .groupBy(studentMutations.jenis)

  return {
    type: 'monthly',
    format: 'pdf',
    school_id: effectiveSchoolId || null,
    tahun_pelajaran: `${CURRENT_YEAR}/${CURRENT_YEAR + 1}`,
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
    details: {
      siswaPerKelas,
      mutasiMasuk: mutasiBulanIni.find(m => m.jenis === 'masuk')?.total || 0,
      mutasiKeluar: mutasiBulanIni.find(m => m.jenis === 'keluar')?.total || 0,
      periode: `Juni ${CURRENT_YEAR}`,
    },
    downloadUrl: '#',
  }
}

async function reportSemester(_db: NonNullDb, schoolFilter: any, effectiveSchoolId: string | null) {
  const allSchools = await _db
    .select({
      id: schools.id, nama: schools.nama, npsn: schools.npsn,
      jenjang: schools.jenjang, status: schools.status, desa: schools.desa,
    })
    .from(schools)
    .where(schoolFilter)

  const recapFilter = effectiveSchoolId ? eq(studentRecaps.school_id, effectiveSchoolId) : undefined
  const recaps = await _db
    .select({
      semester: studentRecaps.semester,
      tahun_pelajaran: studentRecaps.tahun_pelajaran,
      totalLaki: sql<number>`SUM(${studentRecaps.laki_laki})`,
      totalPerempuan: sql<number>`SUM(${studentRecaps.perempuan})`,
      total: sql<number>`SUM(${studentRecaps.total})`,
      siswaMasuk: sql<number>`SUM(${studentRecaps.siswa_masuk})`,
      siswaKeluar: sql<number>`SUM(${studentRecaps.siswa_keluar})`,
    })
    .from(studentRecaps)
    .where(recapFilter || undefined)
    .groupBy(studentRecaps.tahun_pelajaran, studentRecaps.semester)
    .orderBy(studentRecaps.tahun_pelajaran, studentRecaps.semester)

  const [totalStudentsResult] = await _db.select({ value: count() }).from(students)
    .where(effectiveSchoolId ? and(eq(students.status_siswa, 'aktif'), eq(students.school_id, effectiveSchoolId)) : eq(students.status_siswa, 'aktif'))
  const [totalTeachersResult] = await _db.select({ value: count() }).from(employees)
    .where(effectiveSchoolId ? and(eq(employees.is_active, 1), eq(employees.sekolah_id, effectiveSchoolId)) : eq(employees.is_active, 1))

  const ganjil = recaps.filter(r => r.semester === 'ganjil')
  const genap = recaps.filter(r => r.semester === 'genap')

  return {
    type: 'semester',
    format: 'pdf',
    school_id: effectiveSchoolId || null,
    tahun_pelajaran: TP_SD,
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
    details: {
      recaps,
      ringkasanGanjil: {
        total: ganjil.reduce((s, r) => s + r.total, 0),
        masuk: ganjil.reduce((s, r) => s + r.siswaMasuk, 0),
        keluar: ganjil.reduce((s, r) => s + r.siswaKeluar, 0),
      },
      ringkasanGenap: {
        total: genap.reduce((s, r) => s + r.total, 0),
        masuk: genap.reduce((s, r) => s + r.siswaMasuk, 0),
        keluar: genap.reduce((s, r) => s + r.siswaKeluar, 0),
      },
    },
    downloadUrl: '#',
  }
}

async function reportAnnual(_db: NonNullDb, schoolFilter: any, effectiveSchoolId: string | null) {
  const allSchools = await _db
    .select({
      id: schools.id, nama: schools.nama, npsn: schools.npsn,
      jenjang: schools.jenjang, status: schools.status, desa: schools.desa,
    })
    .from(schools)
    .where(schoolFilter)

  const studentFilter = effectiveSchoolId
    ? eq(students.school_id, effectiveSchoolId)
    : undefined

  const perTahun = await _db
    .select({
      tahun_pelajaran: students.tahun_pelajaran,
      jenjang: students.jenjang,
      total: count(),
    })
    .from(students)
    .where(studentFilter || undefined)
    .groupBy(students.tahun_pelajaran, students.jenjang)
    .orderBy(students.tahun_pelajaran, students.jenjang)

  const alumniPerTahun = await _db
    .select({
      tahun_lulus: alumni.tahun_lulus,
      total: count(),
    })
    .from(alumni)
    .where(effectiveSchoolId ? eq(alumni.school_id, effectiveSchoolId) : undefined)
    .groupBy(alumni.tahun_lulus)
    .orderBy(alumni.tahun_lulus)

  const [totalStudentsResult] = await _db.select({ value: count() }).from(students)
    .where(effectiveSchoolId ? and(eq(students.status_siswa, 'aktif'), eq(students.school_id, effectiveSchoolId)) : eq(students.status_siswa, 'aktif'))
  const [totalTeachersResult] = await _db.select({ value: count() }).from(employees)
    .where(effectiveSchoolId ? and(eq(employees.is_active, 1), eq(employees.sekolah_id, effectiveSchoolId)) : eq(employees.is_active, 1))

  const sdData = perTahun.filter(r => r.jenjang === 'sd').map(r => ({ tahun: r.tahun_pelajaran, total: r.total }))
  const tkData = perTahun.filter(r => r.jenjang === 'tk').map(r => ({ tahun: r.tahun_pelajaran, total: r.total }))
  const kbData = perTahun.filter(r => r.jenjang === 'kb').map(r => ({ tahun: r.tahun_pelajaran, total: r.total }))

  const sdGrowth = sdData.length >= 2
    ? Math.round(((sdData[sdData.length - 1].total - sdData[0].total) / sdData[0].total) * 100)
    : 0

  return {
    type: 'annual',
    format: 'pdf',
    school_id: effectiveSchoolId || null,
    tahun_pelajaran: TP_SD,
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
    details: {
      trendSd: sdData,
      trendTk: tkData,
      trendKb: kbData,
      alumni: alumniPerTahun,
      pertumbuhanSd: `${sdGrowth >= 0 ? '+' : ''}${sdGrowth}%`,
    },
    downloadUrl: '#',
  }
}

async function reportGis(_db: NonNullDb, schoolFilter: any, effectiveSchoolId: string | null) {
  const allSchools = await _db
    .select({
      id: schools.id, nama: schools.nama, npsn: schools.npsn,
      jenjang: schools.jenjang, status: schools.status,
      desa: schools.desa, latitude: schools.latitude, longitude: schools.longitude,
    })
    .from(schools)
    .where(schoolFilter)

  const perDesa = allSchools.reduce((acc, s) => {
    const key = s.desa || 'Lainnya'
    if (!acc[key]) acc[key] = { sd: 0, tk: 0, kb: 0, total: 0 }
    acc[key][s.jenjang as keyof typeof acc[typeof key]]++
    acc[key].total++
    return acc
  }, {} as Record<string, { sd: number; tk: number; kb: number; total: number }>)

  const [totalStudentsResult] = await _db.select({ value: count() }).from(students)
    .where(effectiveSchoolId ? and(eq(students.status_siswa, 'aktif'), eq(students.school_id, effectiveSchoolId)) : eq(students.status_siswa, 'aktif'))
  const [totalTeachersResult] = await _db.select({ value: count() }).from(employees)
    .where(effectiveSchoolId ? and(eq(employees.is_active, 1), eq(employees.sekolah_id, effectiveSchoolId)) : eq(employees.is_active, 1))

  return {
    type: 'gis',
    format: 'pdf',
    school_id: effectiveSchoolId || null,
    tahun_pelajaran: null,
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
    details: {
      sebaranDesa: Object.entries(perDesa).map(([desa, data]) => ({ desa, ...data })),
      sekolahBerkoordinat: allSchools.filter(s => s.latitude && s.longitude).length,
      sekolahTanpaKoordinat: allSchools.filter(s => !s.latitude || !s.longitude).length,
    },
    downloadUrl: '#',
  }
}

async function reportCertification(_db: NonNullDb, schoolFilter: any, effectiveSchoolId: string | null) {
  const allSchools = await _db
    .select({
      id: schools.id, nama: schools.nama, npsn: schools.npsn,
      jenjang: schools.jenjang, status: schools.status, desa: schools.desa,
    })
    .from(schools)
    .where(schoolFilter)

  const empFilter = effectiveSchoolId ? eq(employees.sekolah_id, effectiveSchoolId) : undefined

  const statusSertifikasi = await _db
    .select({
      status: employees.sertifikasi,
      total: count(),
    })
    .from(employees)
    .where(effectiveSchoolId ? and(eq(employees.is_active, 1), eq(employees.sekolah_id, effectiveSchoolId)) : eq(employees.is_active, 1))
    .groupBy(employees.sertifikasi)

  const perSekolah = await _db
    .select({
      sekolahId: employees.sekolah_id,
      sekolahNama: schools.nama,
      jenjang: schools.jenjang,
      totalGuru: count(),
      tersertifikasi: sql<number>`SUM(CASE WHEN ${employees.sertifikasi} = 'sudah' THEN 1 ELSE 0 END)`,
      belumSertifikasi: sql<number>`SUM(CASE WHEN ${employees.sertifikasi} = 'belum' OR ${employees.sertifikasi} IS NULL THEN 1 ELSE 0 END)`,
    })
    .from(employees)
    .innerJoin(schools, eq(employees.sekolah_id, schools.id))
    .where(empFilter || eq(employees.is_active, 1))
    .groupBy(employees.sekolah_id, schools.nama, schools.jenjang)
    .orderBy(schools.nama)

  const rsertifDetails = await _db
    .select({
      status: certifications.status,
      total: count(),
    })
    .from(certifications)
    .groupBy(certifications.status)

  const [totalStudentsResult] = await _db.select({ value: count() }).from(students)
    .where(effectiveSchoolId ? and(eq(students.status_siswa, 'aktif'), eq(students.school_id, effectiveSchoolId)) : eq(students.status_siswa, 'aktif'))

  const sudah = statusSertifikasi.find(s => s.status === 'sudah')?.total || 0
  const belum = statusSertifikasi.find(s => s.status === 'belum' || !s.status)?.total || 0
  const totalGuru = sudah + belum

  return {
    type: 'certification',
    format: 'pdf',
    school_id: effectiveSchoolId || null,
    tahun_pelajaran: null,
    generatedAt: new Date().toISOString(),
    summary: {
      totalSchools: allSchools.length,
      totalStudents: totalStudentsResult.value,
      totalTeachers: totalGuru,
      sdSchools: allSchools.filter(s => s.jenjang === 'sd').length,
      tkSchools: allSchools.filter(s => s.jenjang === 'tk').length,
      kbSchools: allSchools.filter(s => s.jenjang === 'kb').length,
    },
    schools: allSchools,
    details: {
      statusSertifikasi: { sudah, belum, total: totalGuru, persenSudah: totalGuru > 0 ? Math.round((sudah / totalGuru) * 100) : 0 },
      perSekolah,
      detailStatus: rsertifDetails,
    },
    downloadUrl: '#',
  }
}

const GURU_MAPEL = [
  'Guru Pendidikan Agama', 'Guru PJOK', 'Guru Bahasa Inggris',
  'Guru Matematika', 'Guru Bahasa Indonesia', 'Guru IPA', 'Guru IPS',
  'Guru PPKn', 'Guru Seni Budaya', 'Guru TIK', 'Guru Muatan Lokal',
]

async function reportShortage(_db: NonNullDb, schoolFilter: any, effectiveSchoolId: string | null) {
  const allSchools = await _db
    .select({
      id: schools.id, nama: schools.nama, npsn: schools.npsn,
      jenjang: schools.jenjang, status: schools.status, desa: schools.desa,
    })
    .from(schools)
    .where(schoolFilter)

  const analisisPerSekolah = []
  for (const school of allSchools) {
    const [siswaResult] = await _db.select({ value: count() }).from(students)
      .where(and(eq(students.school_id, school.id), eq(students.status_siswa, 'aktif')))
    const rombelRows = await _db
      .select({ kelas: students.kelas_kelompok })
      .from(students)
      .where(and(eq(students.school_id, school.id), eq(students.status_siswa, 'aktif')))
      .groupBy(students.kelas_kelompok)
    const jumlahRombel = rombelRows.length

    const empByJabatan = await _db
      .select({ jabatan: employees.jabatan, count: count() })
      .from(employees)
      .where(and(eq(employees.sekolah_id, school.id), eq(employees.is_active, 1)))
      .groupBy(employees.jabatan)

    const jabatanCount: Record<string, number> = {}
    for (const r of empByJabatan) {
      if (r.jabatan) jabatanCount[r.jabatan] = r.count
    }

    const siswaCount = siswaResult.value
    const guruKelasActual = jabatanCount['Guru Kelas'] || 0
    const guruBKActual = jabatanCount['Guru BK'] || 0
    const kepalaSekolahActual = jabatanCount['Kepala Sekolah'] || 0
    const tendikActual = jabatanCount['Tenaga Kependidikan'] || 0

    const guruKelasTarget = jumlahRombel
    const guruBKTarget = 1
    const kepalaSekolahTarget = 1
    const subjectTargetPerMapel = jumlahRombel > 12 ? 2 : 1

    const jabatanTarget: Record<string, { actual: number; target: number }> = {}
    jabatanTarget['Guru Kelas'] = { actual: guruKelasActual, target: guruKelasTarget }
    jabatanTarget['Guru BK'] = { actual: guruBKActual, target: guruBKTarget }
    jabatanTarget['Kepala Sekolah'] = { actual: kepalaSekolahActual, target: kepalaSekolahTarget }

    for (const mapel of GURU_MAPEL) {
      const actual = jabatanCount[mapel] || 0
      jabatanTarget[mapel] = { actual, target: subjectTargetPerMapel }
    }

    // Treat any other Guru-* jabatan as subject teachers
    for (const [jab, count] of Object.entries(jabatanCount)) {
      if (!jabatanTarget[jab] && jab.startsWith('Guru ')) {
        jabatanTarget[jab] = { actual: count, target: subjectTargetPerMapel }
      }
      if (!jabatanTarget[jab]) {
        jabatanTarget[jab] = { actual: count, target: count }
      }
    }

    let totalTarget = 0
    let totalActual = 0
    const perJabatan: Record<string, { actual: number; target: number; shortage: number; surplus: number }> = {}
    for (const [jab, { actual, target }] of Object.entries(jabatanTarget)) {
      totalTarget += target
      totalActual += actual
      perJabatan[jab] = { actual, target, shortage: Math.max(0, target - actual), surplus: Math.max(0, actual - target) }
    }

    const totalKekuranganGuru = Math.max(0, totalTarget - totalActual)
    const rasio = totalActual > 0 ? Math.round(siswaCount / totalActual) : 0
    const status = totalKekuranganGuru > 0 ? 'kekurangan' : rasio > 20 ? 'kelebihan_siswa' : 'ideal'

    analisisPerSekolah.push({
      sekolahId: school.id,
      sekolahNama: school.nama,
      jenjang: school.jenjang,
      status: school.status,
      desa: school.desa,
      jumlahSiswa: siswaCount,
      jumlahRombel,
      jumlahGuru: totalActual,
      targetGuru: totalTarget,
      kekuranganGuru: totalKekuranganGuru,
      rasioSiswaGuru: rasio,
      statusKetenagaan: status,
      perJabatan,
    })
  }

  const [totalStudentsResult] = await _db.select({ value: count() }).from(students)
    .where(effectiveSchoolId ? and(eq(students.status_siswa, 'aktif'), eq(students.school_id, effectiveSchoolId)) : eq(students.status_siswa, 'aktif'))
  const [totalTeachersResult] = await _db.select({ value: count() }).from(employees)
    .where(effectiveSchoolId ? and(eq(employees.is_active, 1), eq(employees.sekolah_id, effectiveSchoolId)) : eq(employees.is_active, 1))

  const totalKekurangan = analisisPerSekolah.filter(a => a.statusKetenagaan === 'kekurangan').length
  const totalIdeal = analisisPerSekolah.filter(a => a.statusKetenagaan === 'ideal').length
  const totalKelebihanSiswa = analisisPerSekolah.filter(a => a.statusKetenagaan === 'kelebihan_siswa').length
  const totalKekuranganGuruAll = analisisPerSekolah.reduce((s, a) => s + a.kekuranganGuru, 0)

  return {
    type: 'shortage',
    format: 'pdf',
    school_id: effectiveSchoolId || null,
    tahun_pelajaran: TP_SD,
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
    details: {
      analisis: analisisPerSekolah,
      rekapitulasi: {
        kekurangan: totalKekurangan,
        ideal: totalIdeal,
        kelebihanSiswa: totalKelebihanSiswa,
        totalKekuranganGuru: totalKekuranganGuruAll,
        rataRataRasio: analisisPerSekolah.length > 0
          ? Math.round(analisisPerSekolah.reduce((s, a) => s + a.rasioSiswaGuru, 0) / analisisPerSekolah.length)
          : 0,
      },
    },
    downloadUrl: '#',
  }
}

type NonNullDb = NonNullable<typeof db>

const REPORT_HANDLERS: Record<string, (_db: NonNullDb, schoolFilter: any, effectiveSchoolId: string | null) => Promise<any>> = {
  monthly: reportMonthly,
  semester: reportSemester,
  annual: reportAnnual,
  gis: reportGis,
  certification: reportCertification,
  shortage: reportShortage,
}

export const POST = (req: NextRequest) => safeApi(async () => {
  const { session, error: authErr } = await guardApi()
  if (authErr) return authErr
  const dbErr = guardDb(db)
  if (dbErr.error) return dbErr.error

  const body = await req.json()
  const { type, format, school_id, tahun_pelajaran, jenjang } = body

  const _db = db!
  const role = (session?.user as any)?.role as string
  const userSekolahId = (session?.user as any)?.sekolah_id as string | undefined

  const effectiveSchoolId = role !== 'admin_kecamatan' && userSekolahId ? userSekolahId : school_id
  let schoolFilter: any = effectiveSchoolId ? eq(schools.id, effectiveSchoolId) : eq(schools.is_active, 1)
  if (jenjang && !effectiveSchoolId) {
    schoolFilter = and(schoolFilter, eq(schools.jenjang, jenjang))
  }

  const handler = REPORT_HANDLERS[type as string]
  if (!handler) {
    return NextResponse.json({ success: false, error: `Tipe laporan "${type}" tidak dikenal` }, { status: 400 })
  }

  const result = await handler(_db, schoolFilter, effectiveSchoolId)
  result.format = format || 'pdf'
  result.tahun_pelajaran = tahun_pelajaran || result.tahun_pelajaran

  return NextResponse.json({ success: true, data: result })
})
