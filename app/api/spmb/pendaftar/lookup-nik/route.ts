import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { spmbPendaftar, students, schools } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const nik = req.nextUrl.searchParams.get('nik')
  if (!nik || nik.length < 4) {
    return NextResponse.json({ data: null })
  }

  try {
    if (!db) return NextResponse.json({ data: null })

    // First try from existing spmb_pendaftar
    const spmbRows = await db.select({
      nama_lengkap: spmbPendaftar.nama_lengkap,
      jenis_kelamin: spmbPendaftar.jenis_kelamin,
      tempat_lahir: spmbPendaftar.tempat_lahir,
      tanggal_lahir: spmbPendaftar.tanggal_lahir,
      alamat: spmbPendaftar.alamat,
      desa: spmbPendaftar.desa,
      asal_tk_paud: spmbPendaftar.asal_tk_paud,
      nama_orang_tua: spmbPendaftar.nama_orang_tua,
      no_hp: spmbPendaftar.no_hp,
    })
      .from(spmbPendaftar)
      .where(eq(spmbPendaftar.nik, nik))
      .limit(1)

    if (spmbRows[0]) {
      return NextResponse.json({ data: spmbRows[0] })
    }

    // Fallback to students table
    const studentRows = await db.select({
      nama_lengkap: students.nama,
      jenis_kelamin: students.jenis_kelamin,
      tempat_lahir: students.tempat_lahir,
      tanggal_lahir: students.tanggal_lahir,
      alamat: students.alamat,
      nama_orang_tua: students.nama_orang_tua,
      no_hp: students.no_hp,
      jenjang: students.jenjang,
      school_nama: schools.nama,
    })
      .from(students)
      .leftJoin(schools, eq(students.school_id, schools.id))
      .where(eq(students.nik, nik))
      .limit(1)

    if (studentRows[0]) {
      const s = studentRows[0]
      const asalTkPaud = s.jenjang === 'tk' || s.jenjang === 'kb' ? (s.school_nama || '') : ''
      return NextResponse.json({
        data: {
          nama_lengkap: s.nama_lengkap,
          jenis_kelamin: s.jenis_kelamin === 'L' ? 'laki-laki' : s.jenis_kelamin === 'P' ? 'perempuan' : s.jenis_kelamin,
          tempat_lahir: s.tempat_lahir,
          tanggal_lahir: s.tanggal_lahir,
          alamat: s.alamat,
          desa: '',
          asal_tk_paud: asalTkPaud,
          nama_orang_tua: s.nama_orang_tua,
          no_hp: s.no_hp,
        },
      })
    }

    return NextResponse.json({ data: null })
  } catch {
    return NextResponse.json({ data: null })
  }
}
