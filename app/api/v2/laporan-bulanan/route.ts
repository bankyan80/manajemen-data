import { NextResponse } from 'next/server'
import { safeApi } from '@/lib/api-handler'
import { guardApi, guardDb } from '@/lib/api-guard'
import { db } from '@/lib/db'
import { schools, students, employees, ruang, studentMutations } from '@/db/schema-v2'
import { eq, and, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

export const GET = (req: Request) => safeApi(async () => {
  const { session, error: authErr } = await guardApi()
  if (authErr) return authErr
  const dbErr = guardDb(db)
  if (dbErr.error) return dbErr.error

  const _db = db!
  const role = (session?.user as any)?.role as string
  const userSekolahId = (session?.user as any)?.sekolah_id as string | undefined

  const url = new URL(req.url)
  const paramSekolahId = url.searchParams.get('sekolah_id')

  const effectiveSchoolId = role !== 'admin_kecamatan' && userSekolahId ? userSekolahId : paramSekolahId
  if (!effectiveSchoolId) {
    return NextResponse.json({ success: false, error: 'sekolah_id wajib diisi' }, { status: 400 })
  }

  const [school] = await _db
    .select({ id: schools.id, nama: schools.nama, npsn: schools.npsn, jenjang: schools.jenjang, status: schools.status, alamat: schools.alamat, desa: schools.desa })
    .from(schools)
    .where(eq(schools.id, effectiveSchoolId))
    .limit(1)

  if (!school) {
    return NextResponse.json({ success: false, error: 'Sekolah tidak ditemukan' }, { status: 404 })
  }

  const now = new Date()
  const month = now.getMonth()
  const year = now.getFullYear()
  const mm = String(month + 1).padStart(2, '0')

  const tahunPelajaran = school.jenjang === 'sd' ? '2026/2027' : '2025/2026'

  const siswaAktif = await _db
    .select({
      nama: students.nama, nisn: students.nisn, nik: students.nik,
      jenis_kelamin: students.jenis_kelamin, kelas_kelompok: students.kelas_kelompok,
      tempat_lahir: students.tempat_lahir, tanggal_lahir: students.tanggal_lahir,
    })
    .from(students)
    .where(and(eq(students.school_id, effectiveSchoolId), eq(students.status_siswa, 'aktif')))
    .orderBy(students.kelas_kelompok, students.nama)

  const byClassMap = new Map<string, { laki: number; perempuan: number; siswa: typeof siswaAktif }>()
  for (const s of siswaAktif) {
    const k = s.kelas_kelompok
    if (!byClassMap.has(k)) byClassMap.set(k, { laki: 0, perempuan: 0, siswa: [] })
    const entry = byClassMap.get(k)!
    if (s.jenis_kelamin === 'laki-laki') entry.laki++
    else entry.perempuan++
    entry.siswa.push(s)
  }

  const byClass = Array.from(byClassMap.entries()).map(([kelas_kelompok, data]) => ({
    kelas_kelompok,
    total: data.laki + data.perempuan,
    laki: data.laki,
    perempuan: data.perempuan,
    siswa: data.siswa,
  }))

  const mutasiMasuk = await _db
    .select({
      nama: studentMutations.nama, tanggal: studentMutations.tanggal,
      kelas_kelompok: studentMutations.kelas_kelompok,
      sekolah_asal: studentMutations.sekolah_asal,
      jenis_kelamin: studentMutations.jenis_kelamin,
    })
    .from(studentMutations)
    .where(and(
      eq(studentMutations.school_id, effectiveSchoolId),
      eq(studentMutations.jenis, 'masuk'),
      sql`strftime('%m', ${studentMutations.tanggal}) = ${mm}`,
      sql`strftime('%Y', ${studentMutations.tanggal}) = ${String(year)}`,
    ))
    .orderBy(studentMutations.tanggal)

  const mutasiKeluar = await _db
    .select({
      nama: studentMutations.nama, tanggal: studentMutations.tanggal,
      kelas_kelompok: studentMutations.kelas_kelompok,
      sekolah_tujuan: studentMutations.sekolah_tujuan,
      jenis_kelamin: studentMutations.jenis_kelamin,
    })
    .from(studentMutations)
    .where(and(
      eq(studentMutations.school_id, effectiveSchoolId),
      eq(studentMutations.jenis, 'keluar'),
      sql`strftime('%m', ${studentMutations.tanggal}) = ${mm}`,
      sql`strftime('%Y', ${studentMutations.tanggal}) = ${String(year)}`,
    ))
    .orderBy(studentMutations.tanggal)

  const pegawai = await _db
    .select({
      nama: employees.nama, nip: employees.nip, nuptk: employees.nuptk,
      jabatan: employees.jabatan, status_pegawai: employees.status_pegawai,
      jenis_kelamin: employees.jenis_kelamin, pendidikan_terakhir: employees.pendidikan_terakhir,
    })
    .from(employees)
    .where(and(eq(employees.sekolah_id, effectiveSchoolId), eq(employees.is_active, 1)))
    .orderBy(employees.jabatan, employees.nama)

  const guru = pegawai.filter(e =>
    e.jabatan && (e.jabatan.toLowerCase().includes('guru') || e.jabatan.toLowerCase().includes('kepala sekolah'))
  )
  const tendik = pegawai.filter(e =>
    !e.jabatan || (!e.jabatan.toLowerCase().includes('guru') && !e.jabatan.toLowerCase().includes('kepala sekolah'))
  )

  const ruangList = await _db
    .select({
      nama_ruang: ruang.nama_ruang, jenis_ruang: ruang.jenis_ruang,
      kondisi_non_struktur: ruang.kondisi_non_struktur,
      kapasitas_siswa: ruang.kapasitas_siswa, lantai_ke: ruang.lantai_ke,
    })
    .from(ruang)
    .where(eq(ruang.school_id, effectiveSchoolId))
    .orderBy(ruang.jenis_ruang, ruang.nama_ruang)

  return NextResponse.json({
    success: true,
    data: {
      school,
      periode: `${MONTH_NAMES[month]} ${year}`,
      tahun_pelajaran: tahunPelajaran,
      siswa: {
        byClass,
        totalSiswa: siswaAktif.length,
        mutasiMasuk,
        mutasiKeluar,
      },
      pegawai: {
        guru,
        tendik,
        total: pegawai.length,
      },
      infrastruktur: {
        ruang: ruangList,
        total: ruangList.length,
      },
    },
  })
})
