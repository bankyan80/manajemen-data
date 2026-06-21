'use client'

import { useState } from 'react'
import AppShellTopbar from '@/components/layout/AppShellTopbar'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useData, fetchJson } from '@/lib/useData'

const TABS = ['Data Kepala Sekolah', 'Data Guru', 'Data Tenaga Kependidikan', 'Status Pegawai', 'Sertifikasi', 'Pendidikan Terakhir', 'BUP/Pensiun']

export default function GtkPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(0)
  const [search, setSearch] = useState('')
  const { data: employees, loading } = useData<any[]>('employees', () => fetchJson('/api/employees'))

  if (status === 'loading') return <div className="p-8 text-center text-zinc-500">Memuat...</div>
  if (!session) { router.push('/login'); return null }

  const filtered = (employees || []).filter(e =>
    e.nama.toLowerCase().includes(search.toLowerCase()) ||
    e.nik.includes(search) ||
    (e.nip && e.nip.includes(search))
  )

  const dataKepsek = filtered.filter(e => e.jabatan?.toLowerCase().includes('kepala sekolah'))
  const dataGuru = filtered.filter(e => e.jabatan?.toLowerCase().includes('guru'))
  const dataTendik = filtered.filter(e => !e.jabatan?.toLowerCase().includes('guru') && !e.jabatan?.toLowerCase().includes('kepala'))

  const pns = filtered.filter(e => e.status_pegawai === 'pns')
  const pppk = filtered.filter(e => e.status_pegawai === 'pppk')
  const nonAsn = filtered.filter(e => e.status_pegawai === 'non_asn')

  const tersertifikasi = filtered.filter(e => e.sertifikasi === 'sudah')
  const belumSertifikasi = filtered.filter(e => e.sertifikasi === 'belum')

  const displayData = activeTab === 0 ? dataKepsek : activeTab === 1 ? dataGuru : activeTab === 2 ? dataTendik : filtered

  if (loading) return <div className="p-8 text-center text-zinc-500">Memuat data...</div>

  return (
    <AppShellTopbar>
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-zinc-900">GTK / Kepegawaian</h1>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-zinc-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{filtered.length}</p>
            <p className="text-xs text-zinc-500">Total GTK</p>
          </div>
          <div className="bg-white border border-zinc-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{pns.length}</p>
            <p className="text-xs text-zinc-500">PNS</p>
          </div>
          <div className="bg-white border border-zinc-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{pppk.length}</p>
            <p className="text-xs text-zinc-500">PPPK</p>
          </div>
          <div className="bg-white border border-zinc-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{nonAsn.length}</p>
            <p className="text-xs text-zinc-500">Non ASN</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 bg-zinc-100 p-1 rounded-lg">
          {TABS.map((tab, i) => (
            <button key={i} onClick={() => setActiveTab(i)} className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${activeTab === i ? 'bg-white text-blue-700 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}>{tab}</button>
          ))}
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama, NIK, NIP..." className="w-80 px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white" />
          <select className="px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
            <option value="">Semua Status</option>
            <option>pns</option>
            <option>pppk</option>
            <option>non_asn</option>
          </select>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Nama</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">NIK</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">NIP</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Jabatan</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Unit Kerja</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Jenis Kelamin</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {displayData.map((e, i) => (
                  <tr key={e.id || i} className="border-b border-zinc-100 hover:bg-zinc-50">
                    <td className="px-4 py-3 font-medium text-zinc-900">{e.nama}</td>
                    <td className="px-4 py-3">{e.nik}</td>
                    <td className="px-4 py-3">{e.nip || '-'}</td>
                    <td className="px-4 py-3">{e.jabatan || '-'}</td>
                    <td className="px-4 py-3">{e.school_nama || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${e.status_pegawai === 'pns' ? 'bg-green-100 text-green-700' : e.status_pegawai === 'pppk' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{e.status_pegawai || '-'}</span>
                    </td>
                    <td className="px-4 py-3">{e.jenis_kelamin || '-'}</td>
                    <td className="px-4 py-3">
                      <button className="text-blue-600 hover:underline text-xs">Detail</button>
                    </td>
                  </tr>
                ))}
                {displayData.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-zinc-400">Tidak ada data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {activeTab === 6 && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
            <h3 className="font-semibold text-zinc-900 mb-4">BUP / Pensiun</h3>
            <p className="text-sm text-zinc-500">Data BUP belum tersedia (tanggal_bup tidak ada di data sumber).</p>
          </div>
        )}
      </div>
    </AppShellTopbar>
  )
}
