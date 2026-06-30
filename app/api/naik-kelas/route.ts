import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { students, alumni } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'

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
  try {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (role !== 'admin_kecamatan') {
    return NextResponse.json({ error: 'Hanya admin kecamatan' }, { status: 403 })
  }

  const tpLama = '2025/2026'
  const tpBaru = '2026/2027'

  // Check if non-Kelas-I already exist for new TP (Kelas I comes from SPMB)
  const existing = await db.select({ id: students.id }).from(students).where(
    and(eq(students.tahun_pelajaran, tpBaru), sql`kelas_kelompok != 'Kelas I'`)
  ).limit(1)
  if (existing.length > 0) {
    return NextResponse.json({ error: `Sudah ada siswa (non-Kelas I) untuk TP ${tpBaru}. Hapus dulu jika ingin naik kelas ulang.` }, { status: 400 })
  }

  const allStudents = await db.select().from(students).where(eq(students.tahun_pelajaran, tpLama))
  const existingNikRows = await db.select({ nik: students.nik }).from(students).where(and(eq(students.tahun_pelajaran, tpBaru), sql`nik IS NOT NULL AND nik != ''`))
  const existingNikSet = new Set(existingNikRows.filter(r => r.nik).map(r => r.nik))

  let naik = 0
  let lulus = 0
  let skip = 0

  for (const s of allStudents) {
    if (s.jenjang === 'kb' || s.jenjang === 'tk') {
      skip++
      continue
    }

    if (s.nik && existingNikSet.has(s.nik)) {
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

  } catch (e) {
    console.error('[API Error]', e);
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Internal error' }, { status: 500 });
  }
  }
