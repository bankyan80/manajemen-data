'use client'

import { useState, useCallback, useEffect } from 'react'
import AppShellTopbar from '@/components/layout/AppShellTopbar'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useData, fetchJson } from '@/lib/useData'
import { Loader2, Trash2, FileText, Download } from 'lucide-react'
import { usePageGuard } from '@/lib/usePermissions'

const TABS = ['Data Kepala Sekolah', 'Data Guru', 'Data Tenaga Kependidikan', 'Status Pegawai', 'Sertifikasi', 'Pendidikan Terakhir', 'BUP/Pensiun']

export default function GtkPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(0)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [pendidikanFilter, setPendidikanFilter] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [form, setForm] = useState<any>({})
  const [cleanupLoading, setCleanupLoading] = useState(false)
  const [cleanupResult, setCleanupResult] = useState<string | null>(null)
  const { data: employees, loading, error } = useData<any[]>(`employees-${refreshKey}`, () => fetchJson('/api/employees?show_nonaktif=1'))
  const [schools, setSchools] = useState<any[]>([])
  useEffect(() => { fetchJson<any[]>('/api/schools').then(setSchools).catch(() => {}) }, [])

  const openEdit = (e: any) => { setSelected(e); setForm({ ...e }) }
  const closeDetail = () => { setSelected(null); setForm({}) }

  const handleSave = useCallback(async () => {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch(`/api/employees/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Gagal menyimpan')
      closeDetail()
      setRefreshKey(k => k + 1)
    } catch (err: any) {
      alert('Gagal menyimpan: ' + err.message)
    } finally {
      setSaving(false)
    }
  }, [selected, form])

  if (status === 'loading') return <div className="p-8 text-center text-zinc-500">Memuat...</div>

  const allowed = usePageGuard('gtk')
  if (!session) { router.push('/login'); return null }
  if (!allowed) return null

  const role = (session?.user as any)?.role

  const filtered = (employees || []).filter(e =>
    (e.nama.toLowerCase().includes(search.toLowerCase()) ||
    e.nik.includes(search) ||
    (e.nip && e.nip.includes(search))) &&
    (!statusFilter || e.status_pegawai === statusFilter) &&
    (!pendidikanFilter || (e.pendidikan_terakhir || '') === pendidikanFilter)
  )
  const aktif = filtered.filter(e => e.is_active !== 0)

  const dataKepsek = aktif.filter(e => e.jabatan?.toLowerCase().includes('kepala sekolah'))
  const dataGuru = aktif.filter(e => e.jabatan?.toLowerCase().includes('guru'))
  const dataTendik = aktif.filter(e => !e.jabatan?.toLowerCase().includes('guru') && !e.jabatan?.toLowerCase().includes('kepala'))

  const STATUS_LABELS: Record<string, string> = { pns: 'PNS', pppk: 'PPPK', pppk_paruh_waktu: 'PPPK Paruh Waktu', honorer: 'Honorer', gty: 'GTY', gtt: 'GTT' }
  const STATUS_COLORS: Record<string, string> = { pns: 'bg-green-100 text-green-700', pppk: 'bg-blue-100 text-blue-700', pppk_paruh_waktu: 'bg-indigo-100 text-indigo-700', honorer: 'bg-amber-100 text-amber-700', gty: 'bg-orange-100 text-orange-700', gtt: 'bg-red-100 text-red-700' }
  const STATUS_KEYS = ['pns', 'pppk', 'pppk_paruh_waktu', 'honorer', 'gty', 'gtt']

  const PENDIDIKAN_OPTIONS = ['SD Sederajat', 'SMP Sederajat', 'SMA Sederajat', 'D.1', 'D.2', 'D.3', 'S.1', 'S.2', 'S.3']

  const tersertifikasi = aktif.filter(e => e.sertifikasi === 'sudah')
  const belumSertifikasi = aktif.filter(e => e.sertifikasi === 'belum')

  const dataGuruDanKepsek = aktif.filter(e => e.jabatan?.toLowerCase().includes('guru') || e.jabatan?.toLowerCase().includes('kepala'))
  const displayData = activeTab === 6 ? filtered : activeTab === 0 ? dataKepsek : activeTab === 1 ? dataGuru : activeTab === 2 ? dataTendik : activeTab === 4 ? dataGuruDanKepsek : aktif

  if (loading) return <div className="p-8 text-center text-zinc-500">Memuat data...</div>

  return (
    <AppShellTopbar>
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-zinc-900">GTK / Kepegawaian</h1>

        {activeTab !== 6 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-zinc-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{aktif.length}</p>
            <p className="text-xs text-zinc-500">Total GTK</p>
          </div>
          {STATUS_KEYS.map(k => (
            <div key={k} className="bg-white border border-zinc-200 rounded-xl p-4 text-center">
              <p className={`text-2xl font-bold ${STATUS_COLORS[k].split(' ')[1]}`}>{aktif.filter(e => e.status_pegawai === k).length}</p>
              <p className="text-xs text-zinc-500">{STATUS_LABELS[k]}</p>
            </div>
          ))}
        </div>
        )}

        <div className="flex flex-wrap gap-1 bg-zinc-100 p-1 rounded-lg">
          {TABS.map((tab, i) => (
            <button key={i} onClick={() => setActiveTab(i)} className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${activeTab === i ? 'bg-white text-blue-700 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}>{tab}</button>
          ))}
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama, NIK, NIP..." className="w-80 px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
            <option value="">Semua Status</option>
            {STATUS_KEYS.map(k => <option key={k} value={k}>{STATUS_LABELS[k]}</option>)}
          </select>
          <select value={pendidikanFilter} onChange={e => setPendidikanFilter(e.target.value)} className="px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
            <option value="">Semua Pendidikan</option>
            {PENDIDIKAN_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>

        {activeTab !== 6 && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  {activeTab === 3 ? (
                    <tr className="bg-zinc-50 border-b border-zinc-200">
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Nama</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">NIK</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Jabatan</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Unit Kerja</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Status Pegawai</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Jenis Kelamin</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Aksi</th>
                    </tr>
                  ) : activeTab === 4 ? (
                    <tr className="bg-zinc-50 border-b border-zinc-200">
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Nama</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">NIK</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">NIP</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Jabatan</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Unit Kerja</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Sertifikasi</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Aksi</th>
                    </tr>
                  ) : activeTab === 5 ? (
                    <tr className="bg-zinc-50 border-b border-zinc-200">
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Nama</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">NIK</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Jabatan</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Unit Kerja</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Pendidikan Terakhir</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Aksi</th>
                    </tr>
                  ) : (
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
                  )}
                </thead>
                <tbody>
                  {displayData.map((e, i) => (
                    <tr key={e.id || i} className="border-b border-zinc-100 hover:bg-zinc-50">
                      <td className="px-4 py-3 font-medium text-zinc-900">{e.nama}</td>
                      <td className="px-4 py-3">{e.nik}</td>
                      {activeTab === 3 ? (
                        <>
                          <td className="px-4 py-3">{e.jabatan || '-'}</td>
                          <td className="px-4 py-3">{e.school_nama || '-'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[e.status_pegawai] || 'bg-zinc-100 text-zinc-700'}`}>{STATUS_LABELS[e.status_pegawai] || e.status_pegawai || '-'}</span>
                          </td>
                          <td className="px-4 py-3">{e.jenis_kelamin || '-'}</td>
                        </>
                      ) : activeTab === 4 ? (
                        <>
                          <td className="px-4 py-3">{e.nip || '-'}</td>
                          <td className="px-4 py-3">{e.jabatan || '-'}</td>
                          <td className="px-4 py-3">{e.school_nama || '-'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${e.sertifikasi === 'sudah' ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-700'}`}>{e.sertifikasi || '-'}</span>
                          </td>
                        </>
                      ) : activeTab === 5 ? (
                        <>
                          <td className="px-4 py-3">{e.jabatan || '-'}</td>
                          <td className="px-4 py-3">{e.school_nama || '-'}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{e.pendidikan_terakhir || '-'}</span>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3">{e.nip || '-'}</td>
                          <td className="px-4 py-3">{e.jabatan || '-'}</td>
                          <td className="px-4 py-3">{e.school_nama || '-'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[e.status_pegawai] || 'bg-zinc-100 text-zinc-700'}`}>{STATUS_LABELS[e.status_pegawai] || e.status_pegawai || '-'}</span>
                          </td>
                          <td className="px-4 py-3">{e.jenis_kelamin || '-'}</td>
                        </>
                      )}
                      <td className="px-4 py-3">
                        <button onClick={() => openEdit(e)} className="text-blue-600 hover:underline text-xs">Edit</button>
                      </td>
                    </tr>
                  ))}
                  {displayData.length === 0 && (
                    <tr><td colSpan={activeTab === 3 ? 7 : activeTab === 4 ? 7 : activeTab === 5 ? 6 : 8} className="px-4 py-8 text-center text-sm text-zinc-400">Tidak ada data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 5 && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4">
            <h3 className="font-semibold text-zinc-900 mb-3">Ringkasan Pendidikan Terakhir</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PENDIDIKAN_OPTIONS.map(k => {
                const c = (aktif || []).filter(e => e.pendidikan_terakhir === k).length
                return (
                  <div key={k} className="border border-zinc-200 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-blue-700">{c}</p>
                    <p className="text-xs text-zinc-500">{k}</p>
                  </div>
                )
              })}
              <div className="border border-zinc-200 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-zinc-400">{(aktif || []).filter(e => !e.pendidikan_terakhir).length}</p>
                <p className="text-xs text-zinc-500">Belum diisi</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 6 && (
          <div className="space-y-4">
            {(() => {
              const now = new Date()
              const nowStr = now.toISOString().split('T')[0]
              const withBup = (employees || []).filter(e => e.tanggal_bup)
              const sudahBup = withBup.filter(e => e.tanggal_bup <= nowStr)
              const nonaktif = (employees || []).filter(e => e.is_active === 0)
              const akanPensiun = withBup.filter(e => e.tanggal_bup > nowStr).sort((a, b) => a.tanggal_bup.localeCompare(b.tanggal_bup))
              const sudahPensiun = sudahBup.filter(e => e.is_active !== 0).sort((a, b) => b.tanggal_bup.localeCompare(a.tanggal_bup))
              return (
                <>
                  <div className="flex items-center justify-between">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
                      <div className="bg-white border border-zinc-200 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-blue-700">{withBup.length}</p>
                        <p className="text-xs text-zinc-500">Total dengan BUP</p>
                      </div>
                      <div className="bg-white border border-zinc-200 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-amber-700">{akanPensiun.length}</p>
                        <p className="text-xs text-zinc-500">Akan Pensiun</p>
                      </div>
                      <div className="bg-white border border-zinc-200 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-red-700">{sudahBup.length}</p>
                        <p className="text-xs text-zinc-500">Sudah BUP</p>
                      </div>
                      <div className="bg-white border border-zinc-200 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-green-700">{akanPensiun.filter(e => {
                          const bup = new Date(e.tanggal_bup)
                          const diff = (bup.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
                          return diff <= 12
                        }).length}</p>
                        <p className="text-xs text-zinc-500">Pensiun &lt; 1 Thn</p>
                      </div>
                    </div>
                    {role === 'admin_kecamatan' && (
                      <button
                        onClick={async () => {
                          if (!confirm('Nonaktifkan semua pegawai yang sudah melewati BUP?')) return
                          setCleanupLoading(true)
                          setCleanupResult(null)
                          try {
                            const res = await fetch('/api/employees/cleanup-pensiun', { method: 'POST' })
                            const data = await res.json()
                            if (!res.ok) throw new Error(data.error || 'Gagal')
                            setCleanupResult(data.message || `${data.nonaktifkan} pegawai dinonaktifkan`)
                            setRefreshKey(k => k + 1)
                          } catch (err: any) {
                            setCleanupResult('Gagal: ' + err.message)
                          } finally {
                            setCleanupLoading(false)
                          }
                        }}
                        disabled={cleanupLoading}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium flex items-center gap-2 disabled:opacity-50 shrink-0"
                      >
                        {cleanupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        {cleanupLoading ? 'Memproses...' : 'Nonaktifkan Pensiun'}
                      </button>
                    )}
                  </div>
                  {cleanupResult && (
                    <div className={`px-4 py-3 rounded-xl text-sm ${cleanupResult.startsWith('Gagal') ? 'bg-danger-soft text-danger' : 'bg-success-soft text-green-700'}`}>
                      {cleanupResult}
                    </div>
                  )}
                  {nonaktif.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                      <div className="px-4 py-3 bg-red-50 border-b border-zinc-200">
                        <h3 className="font-semibold text-red-700 text-sm">Nonaktif ({nonaktif.length})</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-zinc-50 border-b border-zinc-200">
                              <th className="text-left px-4 py-3 font-semibold text-zinc-700">Nama</th>
                              <th className="text-left px-4 py-3 font-semibold text-zinc-700">Jabatan</th>
                              <th className="text-left px-4 py-3 font-semibold text-zinc-700">Unit Kerja</th>
                              <th className="text-left px-4 py-3 font-semibold text-zinc-700">Tanggal Lahir</th>
                              <th className="text-left px-4 py-3 font-semibold text-zinc-700">BUP</th>
                            </tr>
                          </thead>
                          <tbody>
                            {nonaktif.map((e, i) => (
                              <tr key={e.id || i} className="border-b border-zinc-100 text-zinc-400">
                                <td className="px-4 py-3 font-medium">{e.nama}</td>
                                <td className="px-4 py-3">{e.jabatan || '-'}</td>
                                <td className="px-4 py-3">{e.school_nama || '-'}</td>
                                <td className="px-4 py-3">{e.tanggal_lahir || '-'}</td>
                                <td className="px-4 py-3">{e.tanggal_bup}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-zinc-50 border-b border-zinc-200">
                            <th className="text-left px-4 py-3 font-semibold text-zinc-700">Nama</th>
                            <th className="text-left px-4 py-3 font-semibold text-zinc-700">Jabatan</th>
                            <th className="text-left px-4 py-3 font-semibold text-zinc-700">Unit Kerja</th>
                            <th className="text-left px-4 py-3 font-semibold text-zinc-700">Tanggal Lahir</th>
                            <th className="text-left px-4 py-3 font-semibold text-zinc-700">BUP</th>
                            <th className="text-left px-4 py-3 font-semibold text-zinc-700">Sisa Waktu</th>
                          </tr>
                        </thead>
                        <tbody>
                          {akanPensiun.map((e, i) => {
                            const diffMonths = Math.round((new Date(e.tanggal_bup).getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.44))
                            const tahun = Math.floor(diffMonths / 12)
                            const bulan = diffMonths % 12
                            return (
                              <tr key={e.id || i} className="border-b border-zinc-100 hover:bg-zinc-50">
                      <td className="px-4 py-3 font-medium text-blue-600 cursor-pointer hover:underline" onClick={() => openEdit(e)}>{e.nama}</td>
                                <td className="px-4 py-3">{e.jabatan || '-'}</td>
                                <td className="px-4 py-3">{e.school_nama || '-'}</td>
                                <td className="px-4 py-3">{e.tanggal_lahir || '-'}</td>
                                <td className="px-4 py-3">{e.tanggal_bup}</td>
                                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${diffMonths <= 12 ? 'bg-red-100 text-red-700' : diffMonths <= 36 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{tahun} thn {bulan} bln</span></td>
                              </tr>
                            )
                          })}
                          {sudahPensiun.map((e, i) => (
                            <tr key={e.id || i} className="border-b border-zinc-100 hover:bg-zinc-50 text-zinc-400">
                              <td className="px-4 py-3 font-medium">{e.nama}</td>
                              <td className="px-4 py-3">{e.jabatan || '-'}</td>
                              <td className="px-4 py-3">{e.school_nama || '-'}</td>
                              <td className="px-4 py-3">{e.tanggal_lahir || '-'}</td>
                              <td className="px-4 py-3">{e.tanggal_bup}</td>
                              <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Pensiun</span></td>
                            </tr>
                          ))}
                          {akanPensiun.length === 0 && sudahPensiun.length === 0 && (
                            <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-zinc-400">Tidak ada data BUP</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={closeDetail}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
              <h3 className="font-semibold text-zinc-900">Edit Pegawai</h3>
              <button onClick={closeDetail} className="text-zinc-400 hover:text-zinc-600 text-xl leading-none">&times;</button>
            </div>
            <div className="px-6 py-4 space-y-3 text-sm">
              <Field label="Nama" value={form.nama} onChange={v => setForm({ ...form, nama: v })} />
              <Field label="NIK" value={form.nik} onChange={v => setForm({ ...form, nik: v })} />
              <Field label="NIP" value={form.nip || ''} onChange={v => setForm({ ...form, nip: v })} />
              <Field label="NUPTK" value={form.nuptk || ''} onChange={v => setForm({ ...form, nuptk: v })} />
              <Select label="Jenis Kelamin" value={form.jenis_kelamin || ''} onChange={v => setForm({ ...form, jenis_kelamin: v })} options={['', 'laki-laki', 'perempuan']} />
              <Field label="Tempat Lahir" value={form.tempat_lahir || ''} onChange={v => setForm({ ...form, tempat_lahir: v })} />
              <Field label="Tanggal Lahir" value={form.tanggal_lahir || ''} onChange={v => setForm({ ...form, tanggal_lahir: v })} />
              <Field label="Jabatan" value={form.jabatan || ''} onChange={v => setForm({ ...form, jabatan: v })} />
              <Select label="Status Pegawai" value={form.status_pegawai || ''} onChange={v => setForm({ ...form, status_pegawai: v })} options={['', ...STATUS_KEYS]} labels={{ '': '', ...STATUS_LABELS }} />
              <Field label="Pangkat/Golongan" value={form.pangkat_golongan || ''} onChange={v => setForm({ ...form, pangkat_golongan: v })} />
              <Select label="Pendidikan Terakhir" value={form.pendidikan_terakhir || ''} onChange={v => setForm({ ...form, pendidikan_terakhir: v })} options={['', ...PENDIDIKAN_OPTIONS]} />
              <Select label="Sertifikasi" value={form.sertifikasi || ''} onChange={v => setForm({ ...form, sertifikasi: v })} options={['', 'sudah', 'belum']} />
              <Field label="TMT Kerja" value={form.tmt_kerja || ''} onChange={v => setForm({ ...form, tmt_kerja: v })} />
              <Field label="Email" value={form.email || ''} onChange={v => setForm({ ...form, email: v })} />
              <Field label="No HP" value={form.no_hp || ''} onChange={v => setForm({ ...form, no_hp: v })} />
              <Select label="Unit Kerja" value={form.sekolah_id || ''} onChange={v => setForm({ ...form, sekolah_id: v })} options={['', ...schools.map(s => s.id)]} labels={{ '': 'Pilih Sekolah...', ...Object.fromEntries(schools.map(s => [s.id, s.nama])) }} />
              <Select label="Status Aktif" value={form.is_active === 0 ? '0' : '1'} onChange={v => setForm({ ...form, is_active: v === '0' ? 0 : 1 })} options={['1', '0']} labels={{ '1': 'Aktif', '0': 'Nonaktif' }} />
            </div>

            <div className="border-t border-zinc-200 px-6 py-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-zinc-500" />
                <h4 className="font-semibold text-zinc-900 text-sm">Arsip Dokumen</h4>
              </div>
              <p className="text-xs text-zinc-400">Dokumen pegawai dikelola di menu <a href="/arsip-digital" className="text-blue-600 hover:underline">Arsip Digital</a>.</p>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-200">
              <div className="flex items-center gap-2">
                {role === 'admin_kecamatan' && selected.is_active !== 0 && (
                  <button
                    onClick={async () => {
                      if (!confirm(`Nonaktifkan ${selected.nama}?`)) return
                      setSaving(true)
                      try {
                        const res = await fetch(`/api/employees/${selected.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ is_active: 0 }),
                        })
                        if (!res.ok) throw new Error('Gagal')
                        closeDetail()
                        setRefreshKey(k => k + 1)
                      } catch (err: any) {
                        alert('Gagal: ' + err.message)
                      } finally {
                        setSaving(false)
                      }
                    }}
                    disabled={saving}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {saving ? 'Memproses...' : 'Nonaktifkan'}
                  </button>
                )}
                {role === 'admin_kecamatan' && selected.is_active === 0 && (
                  <button
                    onClick={async () => {
                      setSaving(true)
                      try {
                        const res = await fetch(`/api/employees/${selected.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ is_active: 1 }),
                        })
                        if (!res.ok) throw new Error('Gagal')
                        closeDetail()
                        setRefreshKey(k => k + 1)
                      } catch (err: any) {
                        alert('Gagal: ' + err.message)
                      } finally {
                        setSaving(false)
                      }
                    }}
                    disabled={saving}
                    className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {saving ? 'Memproses...' : 'Aktifkan'}
                  </button>
                )}
                <button onClick={closeDetail} className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900">Batal</button>
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShellTopbar>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-start gap-4">
      <span className="w-36 shrink-0 text-zinc-500 pt-2">{label}</span>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} className="flex-1 px-3 py-1.5 border border-zinc-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  )
}

function Select({ label, value, onChange, options, labels }: { label: string; value: string; onChange: (v: string) => void; options: string[]; labels?: Record<string, string> }) {
  return (
    <div className="flex items-start gap-4">
      <span className="w-36 shrink-0 text-zinc-500 pt-2">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} className="flex-1 px-3 py-1.5 border border-zinc-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
        {options.map(o => <option key={o} value={o}>{(labels && labels[o]) || o || 'Pilih...'}</option>)}
      </select>
    </div>
  )
}
