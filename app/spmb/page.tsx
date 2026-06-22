'use client'

import { useState } from 'react'
import AppShellTopbar from '@/components/layout/AppShellTopbar'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useData, fetchJson } from '@/lib/useData'
import { Pencil, Plus, Loader2, Trash2 } from 'lucide-react'

const TABS = [
  { key: 'daya_tampung', label: 'Daya Tampung' },
  { key: 'jumlah_pendaftar', label: 'Data Pendaftar' },
  { key: 'jumlah_diterima', label: 'Data Diterima' },
  { key: 'jalur_domisili', label: 'Jalur Domisili' },
  { key: 'jalur_afirmasi', label: 'Jalur Afirmasi' },
  { key: 'jalur_mutasi', label: 'Jalur Mutasi' },
  { key: 'rekap_usia', label: 'Rekap Usia' },
  { key: 'kekurangan_kelebihan_kuota', label: 'Kekurangan/Kelebihan Kuota' },
]

interface ColDef { key: string; label: string }

const TAB_COLUMNS: Record<string, ColDef[]> = {
  daya_tampung: [
    { key: 'school_nama', label: 'Sekolah' },
    { key: 'daya_tampung', label: 'Daya Tampung' },
  ],
  jumlah_pendaftar: [
    { key: 'school_nama', label: 'Sekolah' },
    { key: 'l', label: 'L' },
    { key: 'p', label: 'P' },
    { key: 'jumlah_pendaftar', label: 'Jumlah' },
  ],
  jumlah_diterima: [
    { key: 'school_nama', label: 'Sekolah' },
    { key: 'l', label: 'L' },
    { key: 'p', label: 'P' },
    { key: 'jumlah_diterima', label: 'Jumlah' },
  ],
  jalur_domisili: [
    { key: 'school_nama', label: 'Sekolah' },
    { key: 'l', label: 'L' },
    { key: 'p', label: 'P' },
    { key: 'jalur_domisili', label: 'Jumlah' },
  ],
  jalur_afirmasi: [
    { key: 'school_nama', label: 'Sekolah' },
    { key: 'l', label: 'L' },
    { key: 'p', label: 'P' },
    { key: 'jalur_afirmasi', label: 'Jumlah' },
  ],
  jalur_mutasi: [
    { key: 'school_nama', label: 'Sekolah' },
    { key: 'l', label: 'L' },
    { key: 'p', label: 'P' },
    { key: 'jalur_mutasi', label: 'Jumlah' },
  ],
  rekap_usia: [
    { key: 'school_nama', label: 'Sekolah' },
    { key: 'l', label: 'L (Usia)' },
    { key: 'p', label: 'P (Usia)' },
  ],
  kekurangan_kelebihan_kuota: [
    { key: 'school_nama', label: 'Sekolah' },
    { key: 'daya_tampung', label: 'Daya Tampung' },
    { key: 'jumlah_diterima', label: 'Jumlah Diterima' },
    { key: 'kekurangan_kelebihan_kuota', label: 'Kekurangan/Kelebihan' },
  ],
}

function renderUsia(json?: string | null): string {
  if (!json) return '-'
  try {
    const obj = JSON.parse(json)
    return Object.entries(obj).map(([u, c]) => `${u} th: ${c}`).join(', ')
  } catch {
    return json
  }
}

function cellValue(row: any, tabKey: string): (string | number)[] {
  switch (tabKey) {
    case 'daya_tampung':
      return [row.school_nama, row.daya_tampung ?? 0]
    case 'jumlah_pendaftar':
      return [row.school_nama, row.jumlah_pendaftar_l ?? 0, row.jumlah_pendaftar_p ?? 0, row.jumlah_pendaftar ?? 0]
    case 'jumlah_diterima':
      return [row.school_nama, row.jumlah_diterima_l ?? 0, row.jumlah_diterima_p ?? 0, row.jumlah_diterima ?? 0]
    case 'jalur_domisili':
      return [row.school_nama, row.jalur_domisili_l ?? 0, row.jalur_domisili_p ?? 0, row.jalur_domisili ?? 0]
    case 'jalur_afirmasi':
      return [row.school_nama, row.jalur_afirmasi_l ?? 0, row.jalur_afirmasi_p ?? 0, row.jalur_afirmasi ?? 0]
    case 'jalur_mutasi':
      return [row.school_nama, row.jalur_mutasi_l ?? 0, row.jalur_mutasi_p ?? 0, row.jalur_mutasi ?? 0]
    case 'rekap_usia':
      return [row.school_nama, renderUsia(row.rekap_usia_l), renderUsia(row.rekap_usia_p)]
    case 'kekurangan_kelebihan_kuota':
      return [row.school_nama, row.daya_tampung ?? 0, row.jumlah_diterima ?? 0, row.kekurangan_kelebihan_kuota ?? 0]
    default:
      return [row.school_nama]
  }
}

function generateTahunPelajaran(start: number, count: number): string[] {
  return Array.from({ length: count }, (_, i) => {
    const awal = start + i
    const akhir = awal + 1
    return `${awal}/${akhir}`
  })
}

const ALL_TAHUN = generateTahunPelajaran(2026, 10)

const GENDER_FIELDS: { key: string; label: string; lKey: string; pKey: string }[] = [
  { key: 'jumlah_pendaftar', label: 'Pendaftar', lKey: 'jumlah_pendaftar_l', pKey: 'jumlah_pendaftar_p' },
  { key: 'jumlah_diterima', label: 'Diterima', lKey: 'jumlah_diterima_l', pKey: 'jumlah_diterima_p' },
  { key: 'jalur_domisili', label: 'Domisili', lKey: 'jalur_domisili_l', pKey: 'jalur_domisili_p' },
  { key: 'jalur_afirmasi', label: 'Afirmasi', lKey: 'jalur_afirmasi_l', pKey: 'jalur_afirmasi_p' },
  { key: 'jalur_mutasi', label: 'Mutasi', lKey: 'jalur_mutasi_l', pKey: 'jalur_mutasi_p' },
]

export default function SpmbPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const [editing, setEditing] = useState<string | null>(null)
  const [editRow, setEditRow] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)
  const [tahunPelajaran, setTahunPelajaran] = useState('2026/2027')

  const { data: ppdbData } = useData<{ data: any[] }>(`ppdb-${tahunPelajaran}-${refreshKey}`, () => fetchJson(`/api/ppdb?tahun_pelajaran=${encodeURIComponent(tahunPelajaran)}`))

  if (status === 'loading') return <div className="p-8 text-center text-text-muted">Memuat...</div>
  if (!session) { router.push('/login'); return null }

  const role = session.user?.role
  const isOperator = role === 'operator_sekolah'
  const rows = ppdbData?.data || []
  const activeTabKey = TABS[activeTab].key

  const openAdd = () => {
    setEditing('new')
    setEditRow({ tahun_pelajaran: tahunPelajaran })
  }

  const openEdit = (row: any) => {
    setEditing(row.id)
    setEditRow({ ...row })
  }

  const closeForm = () => { setEditing(null); setEditRow(null) }

  const handleSave = async () => {
    if (!editRow) return
    setSaving(true)
    try {
      const body = { ...editRow }
      delete body.id; delete body.created_at; delete body.updated_at; delete body.school_nama; delete body.school_npsn

      if (editing === 'new') {
        const res = await fetch('/api/ppdb', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        if (!res.ok) throw new Error('Gagal menyimpan')
      } else {
        const res = await fetch('/api/ppdb', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing, ...body }) })
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

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus data ini?')) return
    try {
      const res = await fetch(`/api/ppdb?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal menghapus')
      setRefreshKey(k => k + 1)
    } catch (err: any) {
      alert('Gagal: ' + err.message)
    }
  }

  const tab = TABS[activeTab]
  const columns = TAB_COLUMNS[tab.key] || []

  function upd(field: string, val: any) {
    setEditRow({ ...editRow, [field]: val === '' ? '' : Number(val) })
  }

  function renderLpInput(lKey: string, pKey: string, lVal: any, pVal: any) {
    return (
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2">
          <span className="text-xs font-semibold text-text-muted w-4">L</span>
          <input type="number" value={lVal ?? ''} onChange={e => upd(lKey, e.target.value)} className="w-full px-3 py-1.5 border border-border rounded-lg bg-white text-sm" />
        </div>
        <div className="flex-1 flex items-center gap-2">
          <span className="text-xs font-semibold text-text-muted w-4">P</span>
          <input type="number" value={pVal ?? ''} onChange={e => upd(pKey, e.target.value)} className="w-full px-3 py-1.5 border border-border rounded-lg bg-white text-sm" />
        </div>
      </div>
    )
  }

  return (
    <AppShellTopbar>
      <div className="container-page space-y-6">
        <div className="page-header">
          <h1>SPMB / PPDB</h1>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-text-muted">Tahun Pelajaran</label>
          <select value={tahunPelajaran} onChange={e => setTahunPelajaran(e.target.value)} className="max-w-48 px-3 py-2 rounded-[10px] border border-border bg-white text-sm">
            {ALL_TAHUN.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="flex flex-wrap gap-1 bg-zinc-100 p-1 rounded-lg">
          {TABS.map((t, i) => (
            <button key={t.key} onClick={() => setActiveTab(i)} className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${activeTab === i ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text-main'}`}>{t.label}</button>
          ))}
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-text-main">{tab.label}</h3>
            {isOperator && (
              <button onClick={openAdd} className="btn-primary btn-sm flex items-center gap-1"><Plus className="w-3.5 h-3.5" />Tambah</button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-border">
                  {columns.map(col => <th key={col.key} className="text-left px-4 py-3 font-semibold text-text-muted">{col.label}</th>)}
                  {isOperator && <th className="text-left px-4 py-3 font-semibold text-text-muted">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={10} className="px-4 py-8 text-center text-sm text-text-muted">Belum ada data PPDB</td></tr>
                ) : rows.map((row: any) => (
                  <tr key={row.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                    {cellValue(row, activeTabKey).map((v, i) => <td key={i} className="px-4 py-3 text-text-main">{v}</td>)}
                    {isOperator && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(row)} className="text-primary-light hover:text-primary"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(row.id)} className="text-danger hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {editing && editRow && (
          <div className="modal-overlay" onClick={closeForm}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h3 className="font-semibold text-text-main">{editing === 'new' ? 'Tambah' : 'Edit'} Data PPDB</h3>
                <button onClick={closeForm} className="text-text-muted hover:text-text-main text-xl leading-none">&times;</button>
              </div>
              <div className="px-6 py-4 space-y-4 text-sm max-h-[60vh] overflow-y-auto">
                <div className="flex items-start gap-4">
                  <span className="w-36 shrink-0 text-text-muted pt-2">Tahun Pelajaran</span>
                  <input type="text" value={editRow.tahun_pelajaran || ''} onChange={e => setEditRow({ ...editRow, tahun_pelajaran: e.target.value })} className="flex-1 px-3 py-1.5 border border-border rounded-lg bg-white text-sm" />
                </div>
                <div className="flex items-start gap-4">
                  <span className="w-36 shrink-0 text-text-muted pt-2">Daya Tampung</span>
                  <input type="number" value={editRow.daya_tampung ?? ''} onChange={e => upd('daya_tampung', e.target.value)} className="flex-1 px-3 py-1.5 border border-border rounded-lg bg-white text-sm" />
                </div>
                {GENDER_FIELDS.map(f => (
                  <div key={f.key} className="flex items-start gap-4">
                    <span className="w-36 shrink-0 text-text-muted pt-2">{f.label}</span>
                    {renderLpInput(f.lKey, f.pKey, editRow[f.lKey], editRow[f.pKey])}
                  </div>
                ))}
                <div className="flex items-start gap-4">
                  <span className="w-36 shrink-0 text-text-muted pt-2">Rekap Usia L (JSON)</span>
                  <textarea value={editRow.rekap_usia_l || ''} onChange={e => setEditRow({ ...editRow, rekap_usia_l: e.target.value })} className="flex-1 px-3 py-1.5 border border-border rounded-lg bg-white text-sm" rows={2} placeholder='{"6": 5, "7": 10}' />
                </div>
                <div className="flex items-start gap-4">
                  <span className="w-36 shrink-0 text-text-muted pt-2">Rekap Usia P (JSON)</span>
                  <textarea value={editRow.rekap_usia_p || ''} onChange={e => setEditRow({ ...editRow, rekap_usia_p: e.target.value })} className="flex-1 px-3 py-1.5 border border-border rounded-lg bg-white text-sm" rows={2} placeholder='{"6": 4, "7": 8}' />
                </div>
                <div className="flex items-start gap-4">
                  <span className="w-36 shrink-0 text-text-muted pt-2">Kekurangan/Kelebihan</span>
                  <input type="number" value={editRow.kekurangan_kelebihan_kuota ?? ''} onChange={e => upd('kekurangan_kelebihan_kuota', e.target.value)} className="flex-1 px-3 py-1.5 border border-border rounded-lg bg-white text-sm" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
                <button onClick={closeForm} className="btn-ghost btn-sm">Batal</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary btn-sm flex items-center gap-2">
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
