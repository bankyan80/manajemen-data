import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { spmbPendaftar } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const nik = req.nextUrl.searchParams.get('nik')
  if (!nik || nik.length < 4) {
    return NextResponse.json({ data: null })
  }

  try {
    const rows = await db.select({
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

    return NextResponse.json({ data: rows[0] || null })
  } catch {
    return NextResponse.json({ data: null })
  }
}
