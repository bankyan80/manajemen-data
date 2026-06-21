'use client'

import { useState, useCallback } from 'react'
import AppShellTopbar from '@/components/layout/AppShellTopbar'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useData, fetchJson } from '@/lib/useData'
import { Loader2 } from 'lucide-react'

const TABS = ['Data Kepala Sekolah', 'Data Guru', 'Data Tenaga Kependidikan', 'Status Pegawai', 'Sertifikasi', 'Pendidikan Terakhir', 'BUP/Pensiun']

export default function GtkPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(0)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<any | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [form, setForm] = useState<any>({})
  const { data: employees, loading, error } = useData<any[]>('employees', () => fetchJson('/api/employees'))
  const refresh = useData<any[]>('employees-r', () => fetchJson('/api/employees'))

  const openDetail = (e: any) => { setSelected(e); setEditing(false); setForm({}) }
  const closeDetail = () => { setSelected(null); setEditing(false); setForm({}) }

  const startEdit = () => { setForm({ ...selected }); setEditing(true) }

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
      setSelected({ ...selected, ...form })
      setEditing(false)
      refresh.data = null // bust cache
    } catch (err: any) {
      alert('Gagal menyimpan: ' + err.message)
    } finally {
      setSaving(false)
    }
  }, [selected, form])

  if (status === 'loading') return <div className="p-8 text-center text-zinc-500">Memuat...</div>
  if (!session) { router.push('/login'); return null }

  const filtered = (employees || []).filter(e =>
    (e.nama.toLowerCase().includes(search.toLowerCase()) ||
    e.nik.includes(search) ||
    (e.nip && e.nip.includes(search))) &&
    (!statusFilter || e.status_pegawai === statusFilter)
  )

  const dataKepsek = filtered.filter(e => e.jabatan?.toLowerCase().includes('kepala sekolah'))
  const dataGuru = filtered.filter(e => e.jabatan?.toLowerCase().includes('guru'))
  const dataTendik = filtered.filter(e => !e.jabatan?.toLowerCase().includes('guru') && !e.jabatan?.toLowerCase().includes('kepala'))

  const STATUS_LABELS: Record<string, string> = { pns: 'PNS', pppk: 'PPPK', pppk_paruh_waktu: 'PPPK Paruh Waktu', honorer: 'Honorer', gty: 'GTY', gtt: 'GTT' }
  const STATUS_COLORS: Record<string, string> = { pns: 'bg-green-100 text-green-700', pppk: 'bg-blue-100 text-blue-700', pppk_paruh_waktu: 'bg-indigo-100 text-indigo-700', honorer: 'bg-amber-100 text-amber-700', gty: 'bg-orange-100 text-orange-700', gtt: 'bg-red-100 text-red-700' }
  const STATUS_KEYS = ['pns', 'pppk', 'pppk_paruh_waktu', 'honorer', 'gty', 'gtt']

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
          {STATUS_KEYS.map(k => (
            <div key={k} className="bg-white border border-zinc-200 rounded-xl p-4 text-center">
              <p className={`text-2xl font-bold ${STATUS_COLORS[k].split(' ')[1]}`}>{filtered.filter(e => e.status_pegawai === k).length}</p>
              <p className="text-xs text-zinc-500">{STATUS_LABELS[k]}</p>
            </div>
          ))}
        </div>

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
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[e.status_pegawai] || 'bg-zinc-100 text-zinc-700'}`}>{STATUS_LABELS[e.status_pegawai] || e.status_pegawai || '-'}</span>
                    </td>
                    <td className="px-4 py-3">{e.jenis_kelamin || '-'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => openDetail(e)} className="text-blue-600 hover:underline text-xs">Detail</button>
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

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={closeDetail}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
              <h3 className="font-semibold text-zinc-900">{editing ? 'Edit Pegawai' : 'Detail Pegawai'}</h3>
              <button onClick={closeDetail} className="text-zinc-400 hover:text-zinc-600 text-xl leading-none">&times;</button>
            </div>
            <div className="px-6 py-4 space-y-3 text-sm">
              {editing ? (
                <>
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
                  <Field label="Pendidikan Terakhir" value={form.pendidikan_terakhir || ''} onChange={v => setForm({ ...form, pendidikan_terakhir: v })} />
                  <Select label="Sertifikasi" value={form.sertifikasi || ''} onChange={v => setForm({ ...form, sertifikasi: v })} options={['', 'sudah', 'belum']} />
                  <Field label="TMT Kerja" value={form.tmt_kerja || ''} onChange={v => setForm({ ...form, tmt_kerja: v })} />
                  <Field label="Email" value={form.email || ''} onChange={v => setForm({ ...form, email: v })} />
                  <Field label="No HP" value={form.no_hp || ''} onChange={v => setForm({ ...form, no_hp: v })} />
                </>
              ) : (
                <>
                  <Row label="Nama" value={selected.nama} />
                  <Row label="NIK" value={selected.nik} />
                  <Row label="NIP" value={selected.nip || '-'} />
                  <Row label="NUPTK" value={selected.nuptk || '-'} />
                  <Row label="Jenis Kelamin" value={selected.jenis_kelamin || '-'} />
                  <Row label="Tempat Lahir" value={selected.tempat_lahir || '-'} />
                  <Row label="Tanggal Lahir" value={selected.tanggal_lahir || '-'} />
                  <Row label="Jabatan" value={selected.jabatan || '-'} />
                  <Row label="Status Pegawai" value={selected.status_pegawai || '-'} />
                  <Row label="Pangkat/Golongan" value={selected.pangkat_golongan || '-'} />
                  <Row label="Pendidikan Terakhir" value={selected.pendidikan_terakhir || '-'} />
                  <Row label="Sertifikasi" value={selected.sertifikasi || '-'} />
                  <Row label="TMT Kerja" value={selected.tmt_kerja || '-'} />
                  <Row label="Email" value={selected.email || '-'} />
                  <Row label="No HP" value={selected.no_hp || '-'} />
                  <Row label="Unit Kerja" value={selected.school_nama || '-'} />
                </>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-200">
              {editing ? (
                <>
                  <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900">Batal</button>
                  <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {saving ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </>
              ) : (
                <button onClick={startEdit} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Edit</button>
              )}
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
