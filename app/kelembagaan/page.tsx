'use client'

import { useState, useCallback, useEffect } from 'react'
import AppShellTopbar from '@/components/layout/AppShellTopbar'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useData, fetchJson } from '@/lib/useData'
import { Loader2 } from 'lucide-react'


export default function KelembagaanPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [filterJenjang, setFilterJenjang] = useState('')
  const [selected, setSelected] = useState<any | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>({})
  const [refreshKey, setRefreshKey] = useState(0)
  const { data: schools, loading } = useData<any[]>(`schools-all-${refreshKey}`, () => fetchJson('/api/schools'))
  const closeDetail = () => { setSelected(null); setEditing(false); setForm({}) }

  const startEdit = () => { setForm({ ...selected }); setEditing(true) }

  const handleSave = useCallback(async () => {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch(`/api/schools/${selected.id}`, {
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
            <option value="tk">TK</option>
            <option value="kb">KB</option>
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
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.jenjang === 'sd' ? 'bg-blue-100 text-blue-700' : d.jenjang === 'tk' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'}`}>{d.jenjang?.toUpperCase()}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.status === 'negeri' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{d.status?.toUpperCase()}</span>
                    </td>
                    <td className="px-4 py-3">{d.alamat || '-'}</td>
                    <td className="px-4 py-3">{d.desa || '-'}</td>
                    <td className="px-4 py-3">{d.kecamatan || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setSelected(d)} className="text-blue-600 hover:underline text-xs">Detail</button>
                        <button onClick={() => { setSelected(d); setForm({ ...d }); setEditing(true) }} className="text-blue-600 hover:underline text-xs">Edit</button>
                      </div>
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
              <h3 className="font-semibold text-zinc-900">{editing ? 'Edit Lembaga' : 'Detail Lembaga'}</h3>
              <button onClick={closeDetail} className="text-zinc-400 hover:text-zinc-600 text-xl leading-none">&times;</button>
            </div>
            <div className="px-6 py-4 space-y-3 text-sm">
              {editing ? (
                <>
                  <Field label="Nama" value={form.nama} onChange={v => setForm({ ...form, nama: v })} />
                  <Field label="NPSN" value={form.npsn} onChange={v => setForm({ ...form, npsn: v })} />
                  <Select label="Jenjang" value={form.jenjang} onChange={v => setForm({ ...form, jenjang: v })} options={['sd', 'tk', 'kb']} labels={{ sd: 'SD', tk: 'TK', kb: 'KB' }} />
                  <Select label="Status" value={form.status} onChange={v => setForm({ ...form, status: v })} options={['negeri', 'swasta']} labels={{ negeri: 'Negeri', swasta: 'Swasta' }} />
                  <Field label="Alamat" value={form.alamat} onChange={v => setForm({ ...form, alamat: v })} />
                  <Field label="Desa" value={form.desa} onChange={v => setForm({ ...form, desa: v })} />
                  <Field label="Kecamatan" value={form.kecamatan} onChange={v => setForm({ ...form, kecamatan: v })} />
                  <Field label="Latitude" value={form.latitude != null ? String(form.latitude) : ''} onChange={v => setForm({ ...form, latitude: v ? parseFloat(v) : null })} />
                  <Field label="Longitude" value={form.longitude != null ? String(form.longitude) : ''} onChange={v => setForm({ ...form, longitude: v ? parseFloat(v) : null })} />
                </>
              ) : (
                <>
                  <Row label="Nama" value={selected.nama} />
                  <Row label="NPSN" value={selected.npsn} />
                  <Row label="Jenjang" value={selected.jenjang?.toUpperCase()} />
                  <Row label="Status" value={selected.status?.toUpperCase()} />
                  <Row label="Alamat" value={selected.alamat || '-'} />
                  <Row label="Desa" value={selected.desa || '-'} />
                  <Row label="Kecamatan" value={selected.kecamatan || '-'} />
                  <Row label="Latitude" value={selected.latitude != null ? String(selected.latitude) : '-'} />
                  <Row label="Longitude" value={selected.longitude != null ? String(selected.longitude) : '-'} />
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
        {options.map(o => <option key={o} value={o}>{(labels && labels[o]) || o}</option>)}
      </select>
    </div>
  )
}
