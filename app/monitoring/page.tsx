'use client'

import { useState } from 'react'
import AppShellTopbar from '@/components/layout/AppShellTopbar'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const REPORTS = [
  { sekolah: 'SD Negeri 1 Margaasih', bulan: 'Januari 2026', status: 'Sudah Lapor', tglSubmit: '25-01-2026', catatan: 'Laporan sudah sesuai' },
  { sekolah: 'SD Negeri 1 Margaasih', bulan: 'Februari 2026', status: 'Sudah Lapor', tglSubmit: '22-02-2026', catatan: 'Laporan sudah sesuai' },
  { sekolah: 'SD Negeri 1 Margaasih', bulan: 'Maret 2026', status: 'Diverifikasi', tglSubmit: '28-03-2026', catatan: 'Perbaiki data siswa keluar' },
  { sekolah: 'SD Negeri 2 Margaasih', bulan: 'Januari 2026', status: 'Sudah Lapor', tglSubmit: '26-01-2026', catatan: 'Laporan sudah sesuai' },
  { sekolah: 'SD Negeri 2 Margaasih', bulan: 'Februari 2026', status: 'Belum Lapor', tglSubmit: '-', catatan: '-' },
  { sekolah: 'SD Negeri 2 Margaasih', bulan: 'Maret 2026', status: 'Terlambat', tglSubmit: '05-04-2026', catatan: 'Terlambat 5 hari' },
  { sekolah: 'SD Negeri 3 Cangkuang', bulan: 'Januari 2026', status: 'Sudah Lapor', tglSubmit: '24-01-2026', catatan: 'Laporan sudah sesuai' },
  { sekolah: 'SD Negeri 3 Cangkuang', bulan: 'Februari 2026', status: 'Sudah Lapor', tglSubmit: '20-02-2026', catatan: 'Laporan sudah sesuai' },
  { sekolah: 'SD Negeri 3 Cangkuang', bulan: 'Maret 2026', status: 'Belum Lapor', tglSubmit: '-', catatan: '-' },
  { sekolah: 'SD Swasta Bina Bangsa', bulan: 'Januari 2026', status: 'Sudah Lapor', tglSubmit: '27-01-2026', catatan: 'Laporan sudah sesuai' },
  { sekolah: 'SD Swasta Bina Bangsa', bulan: 'Februari 2026', status: 'Sudah Lapor', tglSubmit: '23-02-2026', catatan: 'Laporan sudah sesuai' },
  { sekolah: 'SD Swasta Bina Bangsa', bulan: 'Maret 2026', status: 'Diverifikasi', tglSubmit: '30-03-2026', catatan: 'Perbaiki lampiran' },
]

const MONTHLY_DATA = [
  { bulan: 'Jan', sudah: 4, belum: 0, terlambat: 0 },
  { bulan: 'Feb', sudah: 3, belum: 1, terlambat: 0 },
  { bulan: 'Mar', sudah: 2, belum: 1, terlambat: 1 },
  { bulan: 'Apr', sudah: 3, belum: 1, terlambat: 0 },
  { bulan: 'Mei', sudah: 4, belum: 0, terlambat: 0 },
  { bulan: 'Jun', sudah: 2, belum: 2, terlambat: 0 },
]

export default function MonitoringPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [filterBulan, setFilterBulan] = useState('')
  const [filterSekolah, setFilterSekolah] = useState('')

  if (status === 'loading') return <div className="p-8 text-center text-zinc-500">Memuat...</div>
  if (!session) { router.push('/login'); return null }

  const filtered = REPORTS.filter(d => {
    if (filterBulan && d.bulan !== filterBulan) return false
    if (filterSekolah && d.sekolah !== filterSekolah) return false
    return true
  })

  const sudah = REPORTS.filter(r => r.status === 'Sudah Lapor' || r.status === 'Diverifikasi').length
  const belum = REPORTS.filter(r => r.status === 'Belum Lapor').length
  const terlambat = REPORTS.filter(r => r.status === 'Terlambat').length

  return (
    <AppShellTopbar>
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-zinc-900">Monitoring Laporan</h1>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-5">
            <p className="text-sm text-zinc-500">Sudah Lapor</p>
            <p className="text-3xl font-bold text-green-700 mt-1">{sudah}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-5">
            <p className="text-sm text-zinc-500">Belum Lapor</p>
            <p className="text-3xl font-bold text-red-700 mt-1">{belum}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-5">
            <p className="text-sm text-zinc-500">Terlambat Lapor</p>
            <p className="text-3xl font-bold text-amber-700 mt-1">{terlambat}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-5">
            <p className="text-sm text-zinc-500">Total Laporan</p>
            <p className="text-3xl font-bold text-blue-700 mt-1">{REPORTS.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
          <h3 className="font-semibold text-zinc-900 mb-4">Grafik Pengiriman Laporan per Bulan</h3>
          <div className="flex items-end gap-3 h-40">
            {MONTHLY_DATA.map((m, i) => {
              const maxVal = Math.max(...MONTHLY_DATA.map(x => x.sudah + x.belum + x.terlambat))
              const total = m.sudah + m.belum + m.terlambat
              const height = maxVal > 0 ? (total / maxVal) * 100 : 0
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full relative" style={{ height: `${Math.max(height, 10)}%` }}>
                    <div className="absolute bottom-0 left-0 right-0 flex flex-col-reverse">
                      <div className="w-full bg-green-400 rounded-t" style={{ height: `${(m.sudah / total) * 100}%` }} title={`Sudah: ${m.sudah}`} />
                      <div className="w-full bg-red-400" style={{ height: `${(m.belum / total) * 100}%` }} title={`Belum: ${m.belum}`} />
                      <div className="w-full bg-amber-400 rounded-t" style={{ height: `${(m.terlambat / total) * 100}%` }} title={`Terlambat: ${m.terlambat}`} />
                    </div>
                  </div>
                  <span className="text-xs text-zinc-500">{m.bulan}</span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-zinc-600">
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-400" /> Sudah</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400" /> Belum</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400" /> Terlambat</div>
          </div>
        </div>

        <div className="flex gap-4 items-center flex-wrap">
          <select value={filterBulan} onChange={e => setFilterBulan(e.target.value)} className="px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
            <option value="">Semua Bulan</option>
            {[...new Set(REPORTS.map(r => r.bulan))].map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={filterSekolah} onChange={e => setFilterSekolah(e.target.value)} className="px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
            <option value="">Semua Sekolah</option>
            {[...new Set(REPORTS.map(r => r.sekolah))].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Sekolah</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Bulan</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Status Laporan</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Tanggal Submit</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Catatan Revisi</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => (
                  <tr key={i} className="border-b border-zinc-100 hover:bg-zinc-50">
                    <td className="px-4 py-3 font-medium text-zinc-900">{d.sekolah}</td>
                    <td className="px-4 py-3">{d.bulan}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.status === 'Sudah Lapor' ? 'bg-green-100 text-green-700' : d.status === 'Belum Lapor' ? 'bg-red-100 text-red-700' : d.status === 'Diverifikasi' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{d.status}</span>
                    </td>
                    <td className="px-4 py-3">{d.tglSubmit}</td>
                    <td className="px-4 py-3 max-w-[200px] truncate" title={d.catatan}>{d.catatan}</td>
                    <td className="px-4 py-3">
                      <button className="text-blue-600 hover:underline text-xs">Detail</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShellTopbar>
  )
}
