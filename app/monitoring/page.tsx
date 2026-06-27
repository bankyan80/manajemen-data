'use client'

import { useState, useEffect } from 'react'
import AppShellTopbar from '@/components/layout/AppShellTopbar'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useData, fetchJson } from '@/lib/useData'


const BULAN = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

export default function MonitoringPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [filterBulan, setFilterBulan] = useState('')
  const [filterSekolah, setFilterSekolah] = useState('')
  const { data: reportData, loading } = useData<any>('reports', () => fetchJson('/api/reports'))

  if (status === 'loading') return <div className="p-8 text-center text-zinc-500">Memuat...</div>


  if (!session) { router.push('/login'); return null }

  const role = (session?.user as any)?.role

  const reports = reportData?.data || []
  const statusSummary = reportData?.statusSummary || []

  const filtered = reports.filter((r: any) => {
    if (filterBulan && r.periode_bulan !== parseInt(filterBulan)) return false
    if (filterSekolah && r.school_id !== filterSekolah) return false
    return true
  })

  const statusMap: Record<string, number> = {}
  for (const s of statusSummary) statusMap[s.status] = s.total

  return (
    <AppShellTopbar>
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-zinc-900">Monitoring Laporan</h1>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-5">
            <p className="text-sm text-zinc-500">Draft</p>
            <p className="text-3xl font-bold text-zinc-700 mt-1">{statusMap['draft'] || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-5">
            <p className="text-sm text-zinc-500">Submitted</p>
            <p className="text-3xl font-bold text-blue-700 mt-1">{statusMap['submitted'] || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-5">
            <p className="text-sm text-zinc-500">Verified</p>
            <p className="text-3xl font-bold text-green-700 mt-1">{statusMap['verified'] || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-5">
            <p className="text-sm text-zinc-500">Total Laporan</p>
            <p className="text-3xl font-bold text-blue-700 mt-1">{reports.length}</p>
          </div>
        </div>

        <div className="flex gap-4 items-center flex-wrap">
          <select value={filterBulan} onChange={e => setFilterBulan(e.target.value)} className="px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
            <option value="">Semua Bulan</option>
            {BULAN.filter(Boolean).map((b, i) => <option key={i + 1} value={i + 1}>{b}</option>)}
          </select>
          {role !== 'operator_sekolah' && (
            <select value={filterSekolah} onChange={e => setFilterSekolah(e.target.value)} className="px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
              <option value="">Semua Sekolah</option>
              {[...new Set(reports.map((r: any) => r.school_id))].slice(0, 20).map((sid: any) => {
                const s = reports.find((r: any) => r.school_id === sid)
                return <option key={sid} value={sid}>{s?.school_nama || sid}</option>
              })}
            </select>
          )}
        </div>

        {loading ? <div className="text-center py-8 text-zinc-500">Memuat...</div> : (
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Sekolah</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Bulan</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Tahun</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Catatan</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r: any, i: number) => (
                  <tr key={r.id || i} className="border-b border-zinc-100 hover:bg-zinc-50">
                    <td className="px-4 py-3 font-medium text-zinc-900">{r.school_nama || '-'}</td>
                    <td className="px-4 py-3">{BULAN[r.periode_bulan] || r.periode_bulan}</td>
                    <td className="px-4 py-3">{r.tahun}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.status === 'draft' ? 'bg-zinc-100 text-zinc-600' : r.status === 'submitted' ? 'bg-blue-100 text-blue-700' : r.status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3 max-w-[200px] truncate">{r.catatan_revisi || '-'}</td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-zinc-400">Tidak ada data</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>
    </AppShellTopbar>
  )
}
