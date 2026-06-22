import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { students, alumni } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

const KELAS_MAP: Record<string, string> = {
  'Kelas I': 'Kelas II',
  'Kelas II': 'Kelas III',
  'Kelas III': 'Kelas IV',
  'Kelas IV': 'Kelas V',
  'Kelas V': 'Kelas VI',
}

const KELAS_LULUS = ['Kelas VI']

export async function POST() {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (role !== 'admin_kecamatan') {
    return NextResponse.json({ error: 'Hanya admin kecamatan' }, { status: 403 })
  }

  const tpLama = '2025/2026'
  const tpBaru = '2026/2027'

  // Check if already promoted
  const existing = await db.select({ id: students.id }).from(students).where(eq(students.tahun_pelajaran, tpBaru)).limit(1)
  if (existing.length > 0) {
    return NextResponse.json({ error: `Sudah ada siswa untuk TP ${tpBaru}. Hapus dulu jika ingin naik kelas ulang.` }, { status: 400 })
  }

  const allStudents = await db.select().from(students).where(eq(students.tahun_pelajaran, tpLama))

  let naik = 0
  let lulus = 0
  let skip = 0

  for (const s of allStudents) {
    if (s.jenjang === 'kb') {
      skip++
      continue
    }

    if (KELAS_LULUS.includes(s.kelas_kelompok)) {
      // → alumni
      await db.insert(alumni).values({
        school_id: s.school_id,
        tahun_lulus: tpBaru,
        nama: s.nama,
        nisn: s.nisn,
        nik: s.nik,
        jenis_kelamin: s.jenis_kelamin,
        tempat_lahir: s.tempat_lahir,
        tanggal_lahir: s.tanggal_lahir,
        kelas: s.kelas_kelompok,
      })
      lulus++
      continue
    }

    const kelasNaik = KELAS_MAP[s.kelas_kelompok]
    if (!kelasNaik) {
      skip++
      continue
    }

    // → naik kelas
    await db.insert(students).values({
      school_id: s.school_id,
      tahun_pelajaran: tpBaru,
      jenjang: s.jenjang,
      kelas_kelompok: kelasNaik,
      nama: s.nama,
      nik: s.nik,
      nisn: s.nisn,
      jenis_kelamin: s.jenis_kelamin,
      tempat_lahir: s.tempat_lahir,
      tanggal_lahir: s.tanggal_lahir,
      alamat: s.alamat,
      nama_orang_tua: s.nama_orang_tua,
      status_siswa: 'aktif',
    })
    naik++
  }

  return NextResponse.json({
    success: true,
    tp_lama: tpLama,
    tp_baru: tpBaru,
    naik_kelas: naik,
    lulus_alumni: lulus,
    skip_kb: skip,
    total_diproses: naik + lulus + skip,
  })
}
