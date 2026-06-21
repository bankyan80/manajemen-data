'use client'

import { useState } from 'react'
import AppShellTopbar from '@/components/layout/AppShellTopbar'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useData, fetchJson } from '@/lib/useData'
import { PackageOpen, CheckCircle2, AlertCircle, Loader2, Plus, ArrowLeft } from 'lucide-react'

const TABS = ['Ruang Kelas', 'Perpustakaan', 'UKS', 'Toilet/WC', 'Meja Kursi', 'APE PAUD', 'Sanitasi', 'Rumah Dinas', 'Usulan Rehab']
const JENIS_LIST = ['Ruang Kelas', 'Perpustakaan', 'UKS', 'Toilet/WC', 'Meja Kursi', 'APE PAUD', 'Sanitasi', 'Rumah Dinas', 'Usulan Rehab']

export default function SarprasPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const [detailSekolah, setDetailSekolah] = useState<any | null>(null)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)

  const { data: sarpras } = useData<any[]>(`sarpras-${refreshKey}`, () => fetchJson('/api/sarpras'))
  const { data: allSchools } = useData<any[]>('schools', () => fetchJson('/api/schools'))

  if (status === 'loading') return <div className="p-8 text-center text-zinc-500">Memuat...</div>
  if (!session) { router.push('/login'); return null }

  const role = session.user?.role
  const userSchoolId = session.user?.sekolah_id

  const filtered = (sarpras || []).filter(s =>
    role === 'operator_sekolah' ? s.school_id === userSchoolId : true
  ).filter(s =>
    activeTab === 0 || s.jenis_sarpras === JENIS_LIST[activeTab - 1]
  )

  const openForm = (existing?: any) => {
    if (existing) {
      setForm({ ...existing })
      setEditing(existing.id)
    } else {
      setForm({ school_id: userSchoolId, tahun_pelajaran: '2025/2026', jenis_sarpras: JENIS_LIST[activeTab > 0 ? activeTab - 1 : 0], jumlah: 0, kondisi_baik: 0, rusak_ringan: 0, rusak_sedang: 0, rusak_berat: 0, kebutuhan: 0, keterangan: '' })
      setEditing('new')
    }
  }

  const closeForm = () => { setEditing(null); setForm({}) }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editing === 'new') {
        const res = await fetch('/api/sarpras', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
        if (!res.ok) throw new Error('Gagal menyimpan')
      } else {
        const res = await fetch(`/api/sarpras/${editing}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
        if (!res.ok) throw new Error('Gagal menyimpan')
      }
      closeForm()
      setRefreshKey(k => k + 1)
    } catch (err: any) {
      alert('Gagal: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const sekolahWithData = new Set((sarpras || []).map(s => s.school_id))
  const sekolahList = (allSchools || []).filter(s => role !== 'operator_sekolah' || s.id === userSchoolId)

  return (
    <AppShellTopbar>
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-zinc-900">Sarana Prasarana</h1>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 bg-zinc-100 p-1 rounded-lg">
          <button onClick={() => setActiveTab(0)} className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${activeTab === 0 ? 'bg-white text-blue-700 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}>Semua</button>
          {TABS.map((tab, i) => (
            <button key={i} onClick={() => setActiveTab(i + 1)} className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${activeTab === i + 1 ? 'bg-white text-blue-700 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}>{tab}</button>
          ))}
        </div>

        {/* Admin view */}
        {role === 'admin_kecamatan' && !detailSekolah && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200">
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">NPSN</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Nama Sekolah</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Jenjang</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Status Input</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Jenis Input</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {sekolahList.map(s => {
                    const ada = sekolahWithData.has(s.id)
                    const dataSekolah = (sarpras || []).filter(x => x.school_id === s.id)
                    const jenisDiisi = [...new Set(dataSekolah.map((x: any) => x.jenis_sarpras))]
                    return (
                      <tr key={s.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                        <td className="px-4 py-3">{s.npsn}</td>
                        <td className="px-4 py-3 font-medium text-zinc-900">{s.nama}</td>
                        <td className="px-4 py-3">{s.jenjang || '-'}</td>
                        <td className="px-4 py-3">
                          {ada ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3" />Sudah Input</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700"><AlertCircle className="w-3 h-3" />Belum Input</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-500">{jenisDiisi.length ? jenisDiisi.join(', ') : '-'}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => setDetailSekolah(s)} className="text-blue-600 hover:underline text-xs">Lihat Detail</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Admin detail view */}
        {role === 'admin_kecamatan' && detailSekolah && (
          <>
            <div className="flex items-center gap-3">
              <button onClick={() => setDetailSekolah(null)} className="text-zinc-500 hover:text-zinc-800"><ArrowLeft className="w-5 h-5" /></button>
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">{detailSekolah.nama}</h2>
                <p className="text-sm text-zinc-500">NPSN: {detailSekolah.npsn} &middot; {detailSekolah.jenjang}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200">
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Jenis</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Tahun</th>
                      <th className="text-center px-2 py-3 font-semibold text-zinc-700 text-xs">Jumlah</th>
                      <th className="text-center px-2 py-3 font-semibold text-zinc-700 text-xs">Baik</th>
                      <th className="text-center px-2 py-3 font-semibold text-zinc-700 text-xs">RR</th>
                      <th className="text-center px-2 py-3 font-semibold text-zinc-700 text-xs">RS</th>
                      <th className="text-center px-2 py-3 font-semibold text-zinc-700 text-xs">RB</th>
                      <th className="text-center px-2 py-3 font-semibold text-zinc-700 text-xs">Kebutuhan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.filter(s => s.school_id === detailSekolah.id).map((s: any, i: number) => (
                      <tr key={s.id || i} className="border-b border-zinc-100 hover:bg-zinc-50">
                        <td className="px-4 py-3 font-medium text-zinc-900">{s.jenis_sarpras}</td>
                        <td className="px-4 py-3">{s.tahun_pelajaran}</td>
                        <td className="text-center px-2 py-3">{s.jumlah}</td>
                        <td className="text-center px-2 py-3 text-green-700">{s.kondisi_baik}</td>
                        <td className="text-center px-2 py-3 text-amber-700">{s.rusak_ringan}</td>
                        <td className="text-center px-2 py-3 text-orange-700">{s.rusak_sedang}</td>
                        <td className="text-center px-2 py-3 text-red-700">{s.rusak_berat}</td>
                        <td className="text-center px-2 py-3">{s.kebutuhan}</td>
                      </tr>
                    ))}
                    {filtered.filter(s => s.school_id === detailSekolah.id).length === 0 && (
                      <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-zinc-400">Belum ada data sarpras untuk sekolah ini</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Operator view */}
        {role === 'operator_sekolah' && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white border border-zinc-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-blue-700">{JENIS_LIST.length}</p>
                <p className="text-xs text-zinc-500">Total Jenis</p>
              </div>
              <div className="bg-white border border-zinc-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-700">{(sarpras || []).filter(s => s.school_id === userSchoolId).length}</p>
                <p className="text-xs text-zinc-500">Sudah Diinput</p>
              </div>
              <div className="bg-white border border-zinc-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-amber-700">{JENIS_LIST.length - (sarpras || []).filter(s => s.school_id === userSchoolId).length}</p>
                <p className="text-xs text-zinc-500">Belum Diinput</p>
              </div>
              <div className="bg-white border border-zinc-200 rounded-xl p-4 text-center">
                <button onClick={() => openForm()} className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 flex items-center gap-1 mx-auto"><Plus className="w-4 h-4" />Tambah</button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200">
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Jenis</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Tahun</th>
                      <th className="text-center px-2 py-3 font-semibold text-zinc-700 text-xs">Jumlah</th>
                      <th className="text-center px-2 py-3 font-semibold text-zinc-700 text-xs">Baik</th>
                      <th className="text-center px-2 py-3 font-semibold text-zinc-700 text-xs">RR</th>
                      <th className="text-center px-2 py-3 font-semibold text-zinc-700 text-xs">RS</th>
                      <th className="text-center px-2 py-3 font-semibold text-zinc-700 text-xs">RB</th>
                      <th className="text-center px-2 py-3 font-semibold text-zinc-700 text-xs">Kebutuhan</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s: any, i: number) => (
                      <tr key={s.id || i} className="border-b border-zinc-100 hover:bg-zinc-50">
                        <td className="px-4 py-3 font-medium text-zinc-900">{s.jenis_sarpras}</td>
                        <td className="px-4 py-3">{s.tahun_pelajaran}</td>
                        <td className="text-center px-2 py-3">{s.jumlah}</td>
                        <td className="text-center px-2 py-3 text-green-700">{s.kondisi_baik}</td>
                        <td className="text-center px-2 py-3 text-amber-700">{s.rusak_ringan}</td>
                        <td className="text-center px-2 py-3 text-orange-700">{s.rusak_sedang}</td>
                        <td className="text-center px-2 py-3 text-red-700">{s.rusak_berat}</td>
                        <td className="text-center px-2 py-3">{s.kebutuhan}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => openForm(s)} className="text-blue-600 hover:underline text-xs">Edit</button>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={9} className="px-4 py-8 text-center text-sm text-zinc-400">Belum ada data sarpras untuk sekolah ini</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Empty state for non-admin non-operator fallback */}
        {role !== 'admin_kecamatan' && role !== 'operator_sekolah' && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-12 text-center">
            <PackageOpen className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
            <h3 className="font-semibold text-zinc-900 mb-2">Belum Ada Data Sarpras</h3>
            <p className="text-sm text-zinc-500 max-w-md mx-auto">Data sarana dan prasarana sekolah/lembaga belum diinput.</p>
          </div>
        )}

        {/* Edit/Add Modal */}
        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={closeForm}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
                <h3 className="font-semibold text-zinc-900">{editing === 'new' ? 'Tambah Data Sarpras' : 'Edit Data Sarpras'}</h3>
                <button onClick={closeForm} className="text-zinc-400 hover:text-zinc-600 text-xl leading-none">&times;</button>
              </div>
              <div className="px-6 py-4 space-y-4 text-sm">
                <div className="flex items-start gap-4">
                  <span className="w-32 shrink-0 text-zinc-500 pt-2">Jenis Sarpras</span>
                  <select value={form.jenis_sarpras || ''} onChange={v => setForm({ ...form, jenis_sarpras: v.target.value })} className="flex-1 px-3 py-1.5 border border-zinc-300 rounded-lg bg-white">
                    <option value="">Pilih...</option>
                    {JENIS_LIST.map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                </div>
                <div className="flex items-start gap-4">
                  <span className="w-32 shrink-0 text-zinc-500 pt-2">Tahun Pelajaran</span>
                  <input type="text" value={form.tahun_pelajaran || ''} onChange={e => setForm({ ...form, tahun_pelajaran: e.target.value })} className="flex-1 px-3 py-1.5 border border-zinc-300 rounded-lg bg-white" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {['jumlah','kondisi_baik','rusak_ringan','rusak_sedang','rusak_berat','kebutuhan'].map(f => (
                    <div key={f} className="flex flex-col gap-1">
                      <span className="text-zinc-500 text-xs capitalize">{f.replace(/_/g, ' ')}</span>
                      <input type="number" value={form[f] ?? ''} onChange={e => setForm({ ...form, [f]: parseInt(e.target.value) || 0 })} className="px-3 py-1.5 border border-zinc-300 rounded-lg bg-white" />
                    </div>
                  ))}
                </div>
                <div className="flex items-start gap-4">
                  <span className="w-32 shrink-0 text-zinc-500 pt-2">Keterangan</span>
                  <textarea value={form.keterangan || ''} onChange={e => setForm({ ...form, keterangan: e.target.value })} className="flex-1 px-3 py-1.5 border border-zinc-300 rounded-lg bg-white" rows={3} />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-200">
                <button onClick={closeForm} className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900">Batal</button>
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShellTopbar>
  )
}
