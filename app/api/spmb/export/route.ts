import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { spmbPendaftar, spmbDayaTampung, schools } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { exportToExcel } from '@/lib/export-excel'
import { exportToPDF } from '@/lib/export-pdf'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { type, format, tahunPelajaran, sekolahId, jalur } = body

  let data: any[] = []
  let title = ''
  let headers: string[] = []

  if (type === 'daya_tampung') {
    const rows = await db
      .select({
        npsn: schools.npsn,
        sekolah: schools.nama,
        jumlah_rombel: spmbDayaTampung.jumlah_rombel,
        kuota_per_rombel: spmbDayaTampung.kuota_per_rombel,
      })
      .from(spmbDayaTampung)
      .leftJoin(schools, eq(spmbDayaTampung.school_id, schools.id))
      .where(sql`${spmbDayaTampung.tahun_pelajaran} = ${tahunPelajaran}`)
      .orderBy(schools.nama)
    data = rows.map((r: any) => ({
      NPSN: r.npsn,
      Sekolah: r.sekolah,
      'Jml Rombel': r.jumlah_rombel,
      'Kuota/Rombel': r.kuota_per_rombel,
      'Total Daya Tampung': r.jumlah_rombel * r.kuota_per_rombel,
    }))
    title = 'Daya Tampung SPMB'
    headers = ['NPSN', 'Sekolah', 'Jml Rombel', 'Kuota/Rombel', 'Total Daya Tampung']
  } else if (type === 'pendaftar') {
    let where = sql`${spmbPendaftar.tahun_pelajaran} = ${tahunPelajaran}`
    if (sekolahId) where = sql`${where} AND ${spmbPendaftar.school_id} = ${sekolahId}`
    if (jalur) where = sql`${where} AND ${spmbPendaftar.jalur} = ${jalur}`
    const rows = await db
      .select({
        no_pendaftaran: spmbPendaftar.no_pendaftaran,
        nama: spmbPendaftar.nama_lengkap,
        nik: spmbPendaftar.nik,
        jk: spmbPendaftar.jenis_kelamin,
        tgl_lahir: spmbPendaftar.tanggal_lahir,
        usia: spmbPendaftar.usia,
        jalur: spmbPendaftar.jalur,
        sekolah: schools.nama,
        status: spmbPendaftar.status_seleksi,
      })
      .from(spmbPendaftar)
      .leftJoin(schools, eq(spmbPendaftar.school_id, schools.id))
      .where(where)
      .orderBy(spmbPendaftar.nama_lengkap)
    data = rows
    title = 'Data Pendaftar SPMB'
    headers = ['No Pendaftaran', 'Nama', 'NIK', 'JK', 'Tgl Lahir', 'Usia', 'Jalur', 'Sekolah', 'Status']
  } else if (type === 'rekap_jalur') {
    let where = sql`${spmbPendaftar.tahun_pelajaran} = ${tahunPelajaran}`
    if (jalur) where = sql`${where} AND ${spmbPendaftar.jalur} = ${jalur}`
    const rows = await db
      .select({ nama: spmbPendaftar.nama_lengkap, jalur: spmbPendaftar.jalur, sekolah: schools.nama, status: spmbPendaftar.status_seleksi })
      .from(spmbPendaftar)
      .leftJoin(schools, eq(spmbPendaftar.school_id, schools.id))
      .where(where)
      .orderBy(spmbPendaftar.jalur, spmbPendaftar.nama_lengkap)
    data = rows
    title = 'Rekap Jalur SPMB'
    headers = ['Nama', 'Jalur', 'Sekolah', 'Status']
  } else if (type === 'monitoring') {
    const dt = await db
      .select({ school_id: spmbDayaTampung.school_id, sekolah: schools.nama, jml: spmbDayaTampung.jumlah_rombel, kuota: spmbDayaTampung.kuota_per_rombel })
      .from(spmbDayaTampung)
      .leftJoin(schools, eq(spmbDayaTampung.school_id, schools.id))
      .where(sql`${spmbDayaTampung.tahun_pelajaran} = ${tahunPelajaran}`)
    const pc = await db
      .select({ school_id: spmbPendaftar.school_id, c: sql`COUNT(*)`.as('c') })
      .from(spmbPendaftar)
      .where(sql`${spmbPendaftar.tahun_pelajaran} = ${tahunPelajaran}`)
      .groupBy(spmbPendaftar.school_id)
    const cm = new Map(pc.map((r: any) => [r.school_id, Number(r.c)]))
    data = dt.map((r: any) => {
      const p = cm.get(r.school_id) || 0
      const dt_ = r.jml * r.kuota
      return { Sekolah: r.sekolah, 'Daya Tampung': dt_, Pendaftar: p, Selisih: p - dt_ }
    })
    title = 'Monitoring Kuota SPMB'
    headers = ['Sekolah', 'Daya Tampung', 'Pendaftar', 'Selisih']
  } else {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  if (format === 'excel') {
    const buf = await exportToExcel(data, title, `${title}.xlsx`)
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${title}.xlsx"`,
      },
    })
  }

  if (format === 'pdf') {
    const buf = await exportToPDF(title, headers, data.map((r: any) => headers.map(h => r[h] ?? '')), `${title}.pdf`)
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${title}.pdf"`,
      },
    })
  }

  return NextResponse.json({ error: 'Invalid format' }, { status: 400 })

  } catch (e) {
    console.error('[API Error]', e);
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Internal error' }, { status: 500 });
  }
  }
