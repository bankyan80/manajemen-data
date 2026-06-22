'use client'

import { useState } from 'react'
import AppShellTopbar from '@/components/layout/AppShellTopbar'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useData, fetchJson } from '@/lib/useData'
import { GraduationCap, Loader2 } from 'lucide-react'

export default function KesiswaanPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'sd' | 'kb'>('sd')
  const [filterSekolah, setFilterSekolah] = useState('')
  const [naikLoading, setNaikLoading] = useState(false)
  const [naikResult, setNaikResult] = useState<string | null>(null)
  const { data: recaps, loading } = useData<any[]>(`kesiswaan-recap-${activeTab}`, () => fetchJson(`/api/kesiswaan-recap?jenjang=${activeTab}`))

  if (status === 'loading') return <div className="p-8 text-center text-zinc-500">Memuat...</div>
  if (!session) { router.push('/login'); return null }

  const role = (session?.user as any)?.role

  const filtered = (recaps || [])
    .filter(r => r.school_jenjang === activeTab)
    .filter(r => !filterSekolah || r.school_id === filterSekolah)

  const sekolahList = [...new Map((recaps || []).filter(r => r.school_jenjang === activeTab).map(r => [r.school_id, { id: r.school_id, nama: r.school_nama }])).values()]

  const handleNaikKelas = async () => {
    if (!confirm('Naikkan semua siswa SD TP 2025/2026 ke TP 2026/2027?\nKelas VI akan masuk alumni.\nTK & KB tidak diproses (manual operator).')) return
    setNaikLoading(true)
    setNaikResult(null)
    try {
      const res = await fetch('/api/naik-kelas', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setNaikResult('Gagal: ' + (data.error || ''))
      } else {
        setNaikResult(`Naik kelas: ${data.naik_kelas}, Lulus: ${data.lulus_alumni}, Skip KB: ${data.skip_kb}`)
      }
    } catch (err: any) {
      setNaikResult('Gagal: ' + err.message)
    } finally {
      setNaikLoading(false)
    }
  }

  return (
    <AppShellTopbar>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">Kesiswaan</h1>
          {role === 'admin_kecamatan' && (
            <button onClick={handleNaikKelas} disabled={naikLoading} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark text-sm font-medium flex items-center gap-2 disabled:opacity-50">
              {naikLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
              {naikLoading ? 'Memproses...' : 'Naik Kelas'}
            </button>
          )}
        </div>

        {naikResult && (
          <div className={`px-4 py-3 rounded-xl text-sm ${naikResult.startsWith('Gagal') ? 'bg-danger-soft text-danger' : 'bg-success-soft text-green-700'}`}>
            {naikResult}
          </div>
        )}

        <div className="flex gap-1 bg-zinc-100 p-1 rounded-lg w-fit">
          <button onClick={() => setActiveTab('sd')} className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'sd' ? 'bg-white text-blue-700 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}>SD</button>
          <button onClick={() => setActiveTab('kb')} className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'kb' ? 'bg-white text-blue-700 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}>TK &amp; KB</button>
        </div>

        <div className="flex gap-4 items-center">
          {role !== 'operator_sekolah' && (
            <select value={filterSekolah} onChange={e => setFilterSekolah(e.target.value)} className="px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
              <option value="">Semua Sekolah</option>
              {sekolahList.map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}
            </select>
          )}
        </div>

        {loading ? <div className="text-center py-8 text-zinc-500">Memuat...</div> : (
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Tahun Pelajaran</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Nama Sekolah</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">{activeTab === 'sd' ? 'Kelas' : 'Kelompok'}</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Laki-laki</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Perempuan</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Total</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => (
                  <tr key={d.school_id + d.kelas_kelompok || i} className="border-b border-zinc-100 hover:bg-zinc-50">
                    <td className="px-4 py-3">{d.tahun_pelajaran}</td>
                    <td className="px-4 py-3 font-medium text-zinc-900">{d.school_nama}</td>
                    <td className="px-4 py-3">{d.kelas_kelompok}</td>
                    <td className="px-4 py-3">{d.laki_laki}</td>
                    <td className="px-4 py-3">{d.perempuan}</td>
                    <td className="px-4 py-3 font-semibold">{d.total}</td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-zinc-400">Tidak ada data</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>
    </AppShellTopbar>
  )
}
