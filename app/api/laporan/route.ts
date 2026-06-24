import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { students, schools, employees, transitions } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!db) return new Response('DB not configured', { status: 500 })

  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const userSekolahId = (session?.user as any)?.sekolah_id

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'cetak'
  const sekolahId = searchParams.get('sekolah_id') || (role === 'operator_sekolah' ? userSekolahId : '') || ''

  let schoolFilter = sql`1=1`
  if (sekolahId) schoolFilter = sql`${schoolFilter} AND ${students.school_id} = ${sekolahId}`

  if (type === 'pdf' || type === 'cetak') {
    const sekolah = sekolahId ? (await db.select().from(schools).where(eq(schools.id, sekolahId)).limit(1))[0] : null
    const siswa = await db.select({
      kelas: students.kelas_kelompok,
      total: sql<number>`COUNT(*)`,
      l: sql<number>`SUM(CASE WHEN ${students.jenis_kelamin} = 'laki-laki' THEN 1 ELSE 0 END)`,
      p: sql<number>`SUM(CASE WHEN ${students.jenis_kelamin} = 'perempuan' THEN 1 ELSE 0 END)`,
    }).from(students).where(sql`${schoolFilter} AND ${students.jenjang} = ${sekolah?.jenjang || 'sd'}`).groupBy(students.kelas_kelompok).orderBy(students.kelas_kelompok)

    const gtks = await db.select({ total: sql<number>`COUNT(*)` }).from(employees).where(schoolFilter)
    const transisi = await db.select({ total: sql<number>`COUNT(*)` }).from(transitions).where(schoolFilter)

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Laporan ${sekolah?.nama || 'Sekolah'}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; }
  h1 { font-size: 16px; margin-bottom: 4px; }
  h2 { font-size: 13px; margin-bottom: 12px; font-weight: normal; color: #555; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th, td { border: 1px solid #333; padding: 6px 8px; text-align: left; }
  th { background: #eee; font-weight: bold; font-size: 11px; }
  td { font-size: 11px; }
  .summary { display: flex; gap: 16px; margin-bottom: 16px; }
  .summary div { flex: 1; border: 1px solid #ccc; padding: 10px; text-align: center; border-radius: 6px; }
  .summary div strong { display: block; font-size: 18px; }
  .header { text-align: center; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #333; }
  @media print { body { padding: 0; } .no-print { display: none; } }
</style></head>
<body>
<div class="header">
  <h1>LAPORAN DATA PENDIDIKAN</h1>
  <h2>${sekolah?.nama || 'SEMUA SEKOLAH'} (${(sekolah?.jenjang || 'semua').toUpperCase()})</h2>
  <p>TP ${new Date().getFullYear()-1}/${new Date().getFullYear()} — ${new Date().toLocaleDateString('id-ID')}</p>
</div>
<div class="summary">
  <div><strong>${siswa.reduce((s,r) => s + r.total, 0)}</strong>Siswa</div>
  <div><strong>${gtks[0]?.total || 0}</strong>GTK</div>
  <div><strong>${transisi[0]?.total || 0}</strong>Transisi</div>
</div>
<h3 style="margin:0 0 8px">Data Siswa per Kelas</h3>
<table>
  <thead><tr><th>Kelas</th><th>L</th><th>P</th><th>Total</th></tr></thead>
  <tbody>
    ${siswa.map(r => `<tr><td>${r.kelas}</td><td>${r.l}</td><td>${r.p}</td><td><strong>${r.total}</strong></td></tr>`).join('')}
    <tr style="font-weight:bold;background:#f5f5f5"><td>Jumlah</td>
      <td>${siswa.reduce((s,r) => s + r.l, 0)}</td>
      <td>${siswa.reduce((s,r) => s + r.p, 0)}</td>
      <td>${siswa.reduce((s,r) => s + r.total, 0)}</td>
    </tr>
  </tbody>
</table>
<p style="text-align:center;color:#888;font-size:10px;margin-top:24px">Dicetak dari Sistem Manajemen Satu Data</p>
<script>window.print()</script>
</body></html>`

    return new Response(html, { headers: { 'Content-Type': 'text/html' } })
  }

  if (type === 'excel') {
    const rows = await db.select({
      nama: students.nama, nisn: students.nisn, nik: students.nik,
      kelas: students.kelas_kelompok, jk: students.jenis_kelamin,
      tempat_lahir: students.tempat_lahir, tanggal_lahir: students.tanggal_lahir,
    }).from(students).where(schoolFilter).orderBy(students.kelas_kelompok, students.nama)

    const csv = [
      ['Nama', 'NISN', 'NIK', 'Kelas', 'Jenis Kelamin', 'Tempat Lahir', 'Tanggal Lahir'],
      ...rows.map(r => [r.nama, r.nisn || '', r.nik || '', r.kelas, r.jk || '', r.tempat_lahir || '', r.tanggal_lahir || '']),
    ].map(r => r.map(c => `"${(c||'').replace(/"/g, '""')}"`).join(',')).join('\r\n')

    return new Response('\uFEFF' + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=export-siswa-${sekolahId || 'all'}.csv`,
      },
    })
  }

  return new Response('Tipe tidak dikenal', { status: 400 })
}
