'use client'

import { useState } from 'react'
import AppShellTopbar from '@/components/layout/AppShellTopbar'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useData, fetchJson } from '@/lib/useData'
import { GitCompare, Search, Plus } from 'lucide-react'

const TABS = ['Calon Masuk SMP', 'Anak Lanjut SMP', 'SMP Tujuan', 'Kesiapan Anak', 'Kegiatan Transisi', 'Rekap Transisi Kecamatan']

const STATUS_LABELS: Record<string, string> = {
  calon_masuk: 'Calon Masuk',
  lanjut: 'Lanjut',
  sudah_mendaftar: 'Sudah Mendaftar',
  diterima: 'Diterima',
  belum_mendaftar: 'Belum Mendaftar',
}

const STATUS_COLORS: Record<string, string> = {
  calon_masuk: 'bg-blue-100 text-blue-700',
  lanjut: 'bg-green-100 text-green-700',
  sudah_mendaftar: 'bg-purple-100 text-purple-700',
  diterima: 'bg-teal-100 text-teal-700',
  belum_mendaftar: 'bg-amber-100 text-amber-700',
}

export default function TransisiSdSmpPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(0)
  const [search, setSearch] = useState('')
  const { data: transData, loading } = useData<any>('transitions', () => fetchJson('/api/transitions'))

  const role = (session?.user as any)?.role

  if (status === 'loading') return <div className="p-8 text-center text-zinc-500">Memuat...</div>
  if (!session) { router.push('/login'); return null }

  const items = transData?.data || []
  const recap = transData?.recap || []

  const filtered = items.filter((d: any) =>
    !search || d.nama.toLowerCase().includes(search.toLowerCase()) || (d.nisn || '').includes(search)
  )

  const calonMasuk = filtered.filter((d: any) => d.status_transisi === 'calon_masuk' || d.status_transisi === 'belum_mendaftar')
  const anakLanjut = filtered.filter((d: any) => d.status_transisi === 'lanjut' || d.status_transisi === 'sudah_mendaftar' || d.status_transisi === 'diterima')
  const smpTujuan = [...new Set(filtered.map((d: any) => d.smp_tujuan).filter(Boolean))]
  const kesiapanData = filtered.filter((d: any) => d.kesiapan)
  const kegiatanData = filtered.filter((d: any) => d.kegiatan_transisi)

  const summaryRecap = TABS.map((tab, i) => {
    if (i === 0) return { tab, sd: calonMasuk.length, kb: 0 }
    if (i === 1) return { tab, sd: anakLanjut.length, kb: 0 }
    if (i === 2) return { tab, sd: smpTujuan.length, kb: 0 }
    if (i === 3) return { tab, sd: kesiapanData.length, kb: 0 }
    if (i === 4) return { tab, sd: kegiatanData.length, kb: 0 }
    if (i === 5) return { tab, sd: recap.reduce((s: number, r: any) => s + r.total, 0), kb: 0 }
    return { tab, sd: 0, kb: 0 }
  })

  return (
    <AppShellTopbar>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">Transisi SD-SMP</h1>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            <Plus className="w-4 h-4" /> Tambah Data
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {summaryRecap.map((s) => (
            <div key={s.tab} className="bg-white border border-zinc-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-700">{s.sd}</p>
              <p className="text-xs text-zinc-500 truncate">{s.tab}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-1 bg-zinc-100 p-1 rounded-lg">
          {TABS.map((tab, i) => (
            <button key={i} onClick={() => setActiveTab(i)} className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${activeTab === i ? 'bg-white text-blue-700 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}>{tab}</button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama atau NISN..." className="w-full pl-9 pr-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white" />
          </div>
        </div>

        {activeTab === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-200 font-semibold text-zinc-900">Calon Masuk SMP</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200">
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Nama</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">NISN</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Jenis Kelamin</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Kelas</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Sekolah</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-zinc-400">Memuat...</td></tr>
                  ) : calonMasuk.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-zinc-400">Belum ada data calon masuk SMP</td></tr>
                  ) : calonMasuk.map((d: any, i: number) => (
                    <tr key={d.id || i} className="border-b border-zinc-100 hover:bg-zinc-50">
                      <td className="px-4 py-3 font-medium text-zinc-900">{d.nama}</td>
                      <td className="px-4 py-3">{d.nisn || '-'}</td>
                      <td className="px-4 py-3">{d.jenis_kelamin || '-'}</td>
                      <td className="px-4 py-3">{d.kelas}</td>
                      <td className="px-4 py-3">{d.school_nama || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[d.status_transisi] || 'bg-zinc-100 text-zinc-700'}`}>{STATUS_LABELS[d.status_transisi] || d.status_transisi}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-200 font-semibold text-zinc-900">Anak Lanjut SMP</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200">
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Nama</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">NISN</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Sekolah Asal</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">SMP Tujuan</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-zinc-400">Memuat...</td></tr>
                  ) : anakLanjut.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-zinc-400">Belum ada data anak lanjut SMP</td></tr>
                  ) : anakLanjut.map((d: any, i: number) => (
                    <tr key={d.id || i} className="border-b border-zinc-100 hover:bg-zinc-50">
                      <td className="px-4 py-3 font-medium text-zinc-900">{d.nama}</td>
                      <td className="px-4 py-3">{d.nisn || '-'}</td>
                      <td className="px-4 py-3">{d.school_nama || '-'}</td>
                      <td className="px-4 py-3">{d.smp_tujuan || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[d.status_transisi] || 'bg-zinc-100 text-zinc-700'}`}>{STATUS_LABELS[d.status_transisi] || d.status_transisi}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 2 && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-200 font-semibold text-zinc-900">SMP Tujuan</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200">
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Nama SMP Tujuan</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Jumlah Siswa</th>
                  </tr>
                </thead>
                <tbody>
                  {smpTujuan.length === 0 ? (
                    <tr><td colSpan={2} className="px-4 py-8 text-center text-sm text-zinc-400">Belum ada data SMP tujuan</td></tr>
                  ) : smpTujuan.map((tujuan: string, i: number) => {
                    const count = filtered.filter((d: any) => d.smp_tujuan === tujuan).length
                    return (
                      <tr key={i} className="border-b border-zinc-100 hover:bg-zinc-50">
                        <td className="px-4 py-3 font-medium text-zinc-900">{tujuan}</td>
                        <td className="px-4 py-3 font-bold text-blue-700">{count}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 3 && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-200 font-semibold text-zinc-900">Kesiapan Anak</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200">
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Nama</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">NISN</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Kesiapan</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-zinc-400">Memuat...</td></tr>
                  ) : kesiapanData.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-zinc-400">Belum ada data kesiapan anak</td></tr>
                  ) : kesiapanData.map((d: any, i: number) => (
                    <tr key={d.id || i} className="border-b border-zinc-100 hover:bg-zinc-50">
                      <td className="px-4 py-3 font-medium text-zinc-900">{d.nama}</td>
                      <td className="px-4 py-3">{d.nisn || '-'}</td>
                      <td className="px-4 py-3">{d.kesiapan}</td>
                      <td className="px-4 py-3">{d.keterangan || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 4 && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-200 font-semibold text-zinc-900">Kegiatan Transisi</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200">
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Nama</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Kegiatan</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-zinc-400">Memuat...</td></tr>
                  ) : kegiatanData.length === 0 ? (
                    <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-zinc-400">Belum ada data kegiatan transisi</td></tr>
                  ) : kegiatanData.map((d: any, i: number) => (
                    <tr key={d.id || i} className="border-b border-zinc-100 hover:bg-zinc-50">
                      <td className="px-4 py-3 font-medium text-zinc-900">{d.nama}</td>
                      <td className="px-4 py-3">{d.kegiatan_transisi}</td>
                      <td className="px-4 py-3">{d.keterangan || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 5 && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-200 font-semibold text-zinc-900">Rekap Transisi Kecamatan</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200">
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Status Transisi</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {recap.length === 0 ? (
                    <tr><td colSpan={2} className="px-4 py-8 text-center text-sm text-zinc-400">Belum ada data rekap transisi</td></tr>
                  ) : (
                    recap.map((r: any, i: number) => (
                      <tr key={i} className="border-b border-zinc-100 hover:bg-zinc-50">
                        <td className="px-4 py-3 font-medium text-zinc-900">{STATUS_LABELS[r.status_transisi] || r.status_transisi}</td>
                        <td className="px-4 py-3 font-bold text-blue-700">{r.total}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShellTopbar>
  )
}
