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

const TAB_COLUMNS: Record<string, { key: string; label: string }[]> = {
  daya_tampung: [
    { key: 'school_nama', label: 'Sekolah' },
    { key: 'daya_tampung', label: 'Daya Tampung' },
  ],
  jumlah_pendaftar: [
    { key: 'school_nama', label: 'Sekolah' },
    { key: 'jumlah_pendaftar', label: 'Jumlah Pendaftar' },
  ],
  jumlah_diterima: [
    { key: 'school_nama', label: 'Sekolah' },
    { key: 'jumlah_diterima', label: 'Jumlah Diterima' },
  ],
  jalur_domisili: [
    { key: 'school_nama', label: 'Sekolah' },
    { key: 'jalur_domisili', label: 'Jalur Domisili' },
  ],
  jalur_afirmasi: [
    { key: 'school_nama', label: 'Sekolah' },
    { key: 'jalur_afirmasi', label: 'Jalur Afirmasi' },
  ],
  jalur_mutasi: [
    { key: 'school_nama', label: 'Sekolah' },
    { key: 'jalur_mutasi', label: 'Jalur Mutasi' },
  ],
  rekap_usia: [
    { key: 'school_nama', label: 'Sekolah' },
    { key: 'rekap_usia', label: 'Rekap Usia' },
  ],
  kekurangan_kelebihan_kuota: [
    { key: 'school_nama', label: 'Sekolah' },
    { key: 'daya_tampung', label: 'Daya Tampung' },
    { key: 'jumlah_diterima', label: 'Jumlah Diterima' },
    { key: 'kekurangan_kelebihan_kuota', label: 'Kekurangan/Kelebihan' },
  ],
}

function cellValue(row: any, tabKey: string): (string | number)[] {
  switch (tabKey) {
    case 'daya_tampung':
      return [row.school_nama, row.daya_tampung ?? 0]
    case 'jumlah_pendaftar':
      return [row.school_nama, row.jumlah_pendaftar ?? 0]
    case 'jumlah_diterima':
      return [row.school_nama, row.jumlah_diterima ?? 0]
    case 'jalur_domisili':
      return [row.school_nama, row.jalur_domisili ?? 0]
    case 'jalur_afirmasi':
      return [row.school_nama, row.jalur_afirmasi ?? 0]
    case 'jalur_mutasi':
      return [row.school_nama, row.jalur_mutasi ?? 0]
    case 'rekap_usia': {
      const usia = row.rekap_usia ? (() => { try { return JSON.parse(row.rekap_usia) } catch { return row.rekap_usia } })() : null
      return [row.school_nama, usia ? Object.entries(usia).map(([u, c]) => `${u} th: ${c}`).join(', ') : '-']
    }
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

export default function SpmbPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const [editing, setEditing] = useState<string | null>(null)
  const [editRow, setEditRow] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)
  const [tahunPelajaran, setTahunPelajaran] = useState('2026/2027')

  const { data: ppdbData } = useData<any[]>(`ppdb-${tahunPelajaran}-${refreshKey}`, () => fetchJson(`/api/ppdb?tahun_pelajaran=${encodeURIComponent(tahunPelajaran)}`))

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

  return (
    <AppShellTopbar>
      <div className="container-page space-y-6">
        <div className="page-header">
          <h1>SPMB / PPDB</h1>
        </div>

        {/* Tahun Pelajaran filter */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-text-muted">Tahun Pelajaran</label>
          <select value={tahunPelajaran} onChange={e => setTahunPelajaran(e.target.value)} className="max-w-48 px-3 py-2 rounded-[10px] border border-border bg-white text-sm">
            {ALL_TAHUN.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 bg-zinc-100 p-1 rounded-lg">
          {TABS.map((t, i) => (
            <button key={t.key} onClick={() => setActiveTab(i)} className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${activeTab === i ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text-main'}`}>{t.label}</button>
          ))}
        </div>

        {/* Table */}
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
                  <input type="number" value={editRow.daya_tampung ?? ''} onChange={e => setEditRow({ ...editRow, daya_tampung: e.target.value === '' ? '' : Number(e.target.value) })} className="flex-1 px-3 py-1.5 border border-border rounded-lg bg-white text-sm" />
                </div>
                <div className="flex items-start gap-4">
                  <span className="w-36 shrink-0 text-text-muted pt-2">Jumlah Pendaftar</span>
                  <input type="number" value={editRow.jumlah_pendaftar ?? ''} onChange={e => setEditRow({ ...editRow, jumlah_pendaftar: e.target.value === '' ? '' : Number(e.target.value) })} className="flex-1 px-3 py-1.5 border border-border rounded-lg bg-white text-sm" />
                </div>
                <div className="flex items-start gap-4">
                  <span className="w-36 shrink-0 text-text-muted pt-2">Jumlah Diterima</span>
                  <input type="number" value={editRow.jumlah_diterima ?? ''} onChange={e => setEditRow({ ...editRow, jumlah_diterima: e.target.value === '' ? '' : Number(e.target.value) })} className="flex-1 px-3 py-1.5 border border-border rounded-lg bg-white text-sm" />
                </div>
                <div className="flex items-start gap-4">
                  <span className="w-36 shrink-0 text-text-muted pt-2">Jalur Domisili</span>
                  <input type="number" value={editRow.jalur_domisili ?? ''} onChange={e => setEditRow({ ...editRow, jalur_domisili: e.target.value === '' ? '' : Number(e.target.value) })} className="flex-1 px-3 py-1.5 border border-border rounded-lg bg-white text-sm" />
                </div>
                <div className="flex items-start gap-4">
                  <span className="w-36 shrink-0 text-text-muted pt-2">Jalur Afirmasi</span>
                  <input type="number" value={editRow.jalur_afirmasi ?? ''} onChange={e => setEditRow({ ...editRow, jalur_afirmasi: e.target.value === '' ? '' : Number(e.target.value) })} className="flex-1 px-3 py-1.5 border border-border rounded-lg bg-white text-sm" />
                </div>
                <div className="flex items-start gap-4">
                  <span className="w-36 shrink-0 text-text-muted pt-2">Jalur Mutasi</span>
                  <input type="number" value={editRow.jalur_mutasi ?? ''} onChange={e => setEditRow({ ...editRow, jalur_mutasi: e.target.value === '' ? '' : Number(e.target.value) })} className="flex-1 px-3 py-1.5 border border-border rounded-lg bg-white text-sm" />
                </div>
                <div className="flex items-start gap-4">
                  <span className="w-36 shrink-0 text-text-muted pt-2">Rekap Usia (JSON)</span>
                  <textarea value={editRow.rekap_usia || ''} onChange={e => setEditRow({ ...editRow, rekap_usia: e.target.value })} className="flex-1 px-3 py-1.5 border border-border rounded-lg bg-white text-sm" rows={3} placeholder='{"6": 10, "7": 15}' />
                </div>
                <div className="flex items-start gap-4">
                  <span className="w-36 shrink-0 text-text-muted pt-2">Kekurangan/Kelebihan</span>
                  <input type="number" value={editRow.kekurangan_kelebihan_kuota ?? ''} onChange={e => setEditRow({ ...editRow, kekurangan_kelebihan_kuota: e.target.value === '' ? '' : Number(e.target.value) })} className="flex-1 px-3 py-1.5 border border-border rounded-lg bg-white text-sm" />
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
