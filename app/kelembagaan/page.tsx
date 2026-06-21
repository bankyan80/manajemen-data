'use client'

import { useState } from 'react'
import AppShellTopbar from '@/components/layout/AppShellTopbar'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useData, fetchJson } from '@/lib/useData'

export default function KelembagaanPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [filterJenjang, setFilterJenjang] = useState('')
  const { data: schools, loading } = useData<any[]>('schools-all', () => fetchJson('/api/schools'))

  if (status === 'loading') return <div className="p-8 text-center text-zinc-500">Memuat...</div>
  if (!session) { router.push('/login'); return null }

  const filtered = filterJenjang ? (schools || []).filter(d => d.jenjang === filterJenjang) : (schools || [])

  return (
    <AppShellTopbar>
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-zinc-900">Kelembagaan</h1>
        <div className="flex items-center gap-4">
          <select value={filterJenjang} onChange={e => setFilterJenjang(e.target.value)} className="px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
            <option value="">Semua Jenjang</option>
            <option value="sd">SD</option>
            <option value="paud">PAUD</option>
          </select>
          <span className="text-sm text-zinc-500">{filtered.length} lembaga</span>
        </div>
        {loading ? <div className="text-center py-8 text-zinc-500">Memuat...</div> : (
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Nama</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">NPSN</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Jenjang</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Alamat</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Desa</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Kecamatan</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => (
                  <tr key={d.id || i} className="border-b border-zinc-100 hover:bg-zinc-50">
                    <td className="px-4 py-3 font-medium text-zinc-900">{d.nama}</td>
                    <td className="px-4 py-3">{d.npsn}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.jenjang === 'sd' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{d.jenjang?.toUpperCase()}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.status === 'negeri' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{d.status?.toUpperCase()}</span>
                    </td>
                    <td className="px-4 py-3">{d.alamat || '-'}</td>
                    <td className="px-4 py-3">{d.desa || '-'}</td>
                    <td className="px-4 py-3">{d.kecamatan || '-'}</td>
                    <td className="px-4 py-3">
                      <button className="text-blue-600 hover:underline text-xs">Detail</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>
    </AppShellTopbar>
  )
}
