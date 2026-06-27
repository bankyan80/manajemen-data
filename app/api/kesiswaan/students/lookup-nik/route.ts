import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { spmbPendaftar, students } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const nik = req.nextUrl.searchParams.get('nik')
  const jenjang = req.nextUrl.searchParams.get('jenjang')

  if (!nik || nik.length < 4) {
    return NextResponse.json({ data: null })
  }

  try {
    if (!db) return NextResponse.json({ data: null })

    // 1. Cari dari spmb_pendaftar (data pendaftar PPDB/SPMB)
    const fromSpmb = await db.select({
      nama: spmbPendaftar.nama_lengkap,
      nik: spmbPendaftar.nik,
      jenis_kelamin: spmbPendaftar.jenis_kelamin,
      tempat_lahir: spmbPendaftar.tempat_lahir,
      tanggal_lahir: spmbPendaftar.tanggal_lahir,
      alamat: spmbPendaftar.alamat,
      nama_orang_tua: spmbPendaftar.nama_orang_tua,
      no_hp: spmbPendaftar.no_hp,
    })
      .from(spmbPendaftar)
      .where(eq(spmbPendaftar.nik, nik))
      .limit(1)

    if (fromSpmb[0]) {
      return NextResponse.json({ data: { ...fromSpmb[0], sumber: 'spmb' } })
    }

    // 2. Cari dari students (peserta didik existing)
    const fromStudents = await db.select({
      nama: students.nama,
      nik: students.nik,
      nisn: students.nisn,
      jenis_kelamin: students.jenis_kelamin,
      tempat_lahir: students.tempat_lahir,
      tanggal_lahir: students.tanggal_lahir,
      alamat: students.alamat,
      nama_orang_tua: students.nama_orang_tua,
      no_hp: students.no_hp,
    })
      .from(students)
      .where(eq(students.nik, nik))
      .limit(1)

    if (fromStudents[0]) {
      return NextResponse.json({ data: { ...fromStudents[0], sumber: 'student' } })
    }

    return NextResponse.json({ data: null })
  } catch {
    return NextResponse.json({ data: null })
  }
}
