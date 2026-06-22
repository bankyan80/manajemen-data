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
  const [selected, setSelected] = useState<any | null>(null)
  const { data: schools, loading } = useData<any[]>('schools-all', () => fetchJson('/api/schools'))
  const closeDetail = () => setSelected(null)

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
                      <button onClick={() => setSelected(d)} className="text-blue-600 hover:underline text-xs">Detail</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={closeDetail}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
              <h3 className="font-semibold text-zinc-900">Detail Lembaga</h3>
              <button onClick={closeDetail} className="text-zinc-400 hover:text-zinc-600 text-xl leading-none">&times;</button>
            </div>
            <div className="px-6 py-4 space-y-3 text-sm">
              <Row label="Nama" value={selected.nama} />
              <Row label="NPSN" value={selected.npsn} />
              <Row label="Jenjang" value={selected.jenjang?.toUpperCase()} />
              <Row label="Status" value={selected.status?.toUpperCase()} />
              <Row label="Alamat" value={selected.alamat || '-'} />
              <Row label="Desa" value={selected.desa || '-'} />
              <Row label="Kecamatan" value={selected.kecamatan || '-'} />
              <Row label="Latitude" value={selected.latitude != null ? String(selected.latitude) : '-'} />
              <Row label="Longitude" value={selected.longitude != null ? String(selected.longitude) : '-'} />
            </div>
            <div className="flex items-center justify-end px-6 py-4 border-t border-zinc-200">
              <button onClick={closeDetail} className="px-4 py-2 text-sm bg-zinc-100 text-zinc-700 rounded-lg hover:bg-zinc-200">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </AppShellTopbar>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-4">
      <span className="w-36 shrink-0 text-zinc-500">{label}</span>
      <span className="text-zinc-900 font-medium">{value}</span>
    </div>
  )
}
