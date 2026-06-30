import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { spmbPendaftar, spmbDayaTampung, schools } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const userSekolahId = (session?.user as any)?.sekolah_id
  const { searchParams } = new URL(req.url)
  const tahunPelajaran = searchParams.get('tahun_pelajaran') || '2026/2027'
  const type = searchParams.get('type') || 'jalur'
  const sekolahId = searchParams.get('sekolah_id') || ''
  const desa = searchParams.get('desa') || ''
  const jalurFilter = searchParams.get('jalur') || ''

  let filter = sql`${spmbPendaftar.tahun_pelajaran} = ${tahunPelajaran}`
  if (role === 'operator_sekolah' && userSekolahId) {
    filter = sql`${filter} AND ${spmbPendaftar.school_id} = ${userSekolahId}`
  }
  if (sekolahId && role !== 'operator_sekolah') {
    filter = sql`${filter} AND ${spmbPendaftar.school_id} = ${sekolahId}`
  }
  if (jalurFilter) filter = sql`${filter} AND ${spmbPendaftar.jalur} = ${jalurFilter}`

  if (type === 'jalur') {
    const rows = await db
      .select({
        id: spmbPendaftar.id,
        nama_lengkap: spmbPendaftar.nama_lengkap,
        jalur: spmbPendaftar.jalur,
        status_seleksi: spmbPendaftar.status_seleksi,
        sekolah_nama: schools.nama,
        school_id: spmbPendaftar.school_id,
      })
      .from(spmbPendaftar)
      .leftJoin(schools, eq(spmbPendaftar.school_id, schools.id))
      .where(filter)
      .orderBy(spmbPendaftar.jalur, spmbPendaftar.nama_lengkap)

      let data = rows
      if (desa) {
        const desaSchools = await db.select({ id: schools.id }).from(schools).where(sql`LOWER(${schools.desa}) = LOWER(${desa})`)
        const ids = new Set(desaSchools.map((s: any) => s.id))
        data = data.filter((r: any) => ids.has(r.school_id))
      }

      const stats = { domisili: 0, afirmasi: 0, mutasi: 0 }
      for (const r of data as any[]) {
        if (r.jalur in stats) (stats as any)[r.jalur]++
      }

    return NextResponse.json({ data, stats })
  }

  if (type === 'usia') {
    const rows = await db
      .select({
        school_id: spmbPendaftar.school_id,
        sekolah_nama: schools.nama,
        npsn: schools.npsn,
        desa: schools.desa,
        usia: spmbPendaftar.usia,
        jenis_kelamin: spmbPendaftar.jenis_kelamin,
      })
      .from(spmbPendaftar)
      .leftJoin(schools, eq(spmbPendaftar.school_id, schools.id))
      .where(filter)

      let data = rows
      if (desa) data = data.filter((r: any) => r.desa?.toLowerCase() === desa.toLowerCase())

      const groups = new Map<string, any>()
      for (const r of data as any[]) {
        if (!groups.has(r.school_id)) {
          groups.set(r.school_id, {
            school_id: r.school_id,
            npsn: r.npsn,
            sekolah_nama: r.sekolah_nama,
            lt6: 0,
            _6_7: 0,
            gt7: 0,
            l: 0,
            p: 0,
            total: 0,
          })
        }
        const g = groups.get(r.school_id)!
        const u = r.usia ?? 7
        if (u < 6) g.lt6++
        else if (u <= 7) g._6_7++
        else g.gt7++
        if (r.jenis_kelamin === 'laki-laki') g.l++
        else g.p++
        g.total++
      }

      const chartData = Array.from(groups.values())
      const summary = { lt6: 0, _6_7: 0, gt7: 0 }
      for (const g of chartData) {
        summary.lt6 += g.lt6
        summary._6_7 += g._6_7
        summary.gt7 += g.gt7
      }

    return NextResponse.json({ data: chartData, summary })
  }

  if (type === 'monitoring') {
    const dtRows = await db
      .select({
        school_id: spmbDayaTampung.school_id,
        sekolah_nama: schools.nama,
        jumlah_rombel: spmbDayaTampung.jumlah_rombel,
        kuota_per_rombel: spmbDayaTampung.kuota_per_rombel,
      })
      .from(spmbDayaTampung)
      .leftJoin(schools, eq(spmbDayaTampung.school_id, schools.id))
      .where(sql`${spmbDayaTampung.tahun_pelajaran} = ${tahunPelajaran}`)

    const countRows = await db
      .select({
        school_id: spmbPendaftar.school_id,
        count: sql`COUNT(*)`.as('count'),
      })
      .from(spmbPendaftar)
      .where(sql`${spmbPendaftar.tahun_pelajaran} = ${tahunPelajaran}`)
      .groupBy(spmbPendaftar.school_id)

    const countMap = new Map(countRows.map((r: any) => [r.school_id, Number(r.count)]))

    const data = dtRows.map((r: any) => {
      const pendaftar = countMap.get(r.school_id) || 0
      const daya = r.jumlah_rombel * r.kuota_per_rombel
      const selisih = pendaftar - daya
      const status = selisih > 0 ? 'over' : selisih < 0 ? 'under' : 'normal'
      return { school_id: r.school_id, sekolah_nama: r.sekolah_nama, daya_tampung: daya, pendaftar, selisih, status }
    })

    return NextResponse.json({ data })
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  } catch (e) {
    console.error('[API Error]', e);
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Internal error' }, { status: 500 });
  }
  }
