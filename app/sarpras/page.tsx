'use client'

import { useState, useEffect } from 'react'
import AppShellTopbar from '@/components/layout/AppShellTopbar'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useData, fetchJson } from '@/lib/useData'
import { PackageOpen, Loader2, Plus, Pencil, Trash2 } from 'lucide-react'
import { usePermissions } from '@/lib/usePermissions'

type TabKey = 'tanah' | 'bangunan' | 'ruang' | 'sarana' | 'buku'

interface FieldDef {
  key: string
  label: string
  type: 'text' | 'number' | 'select' | 'checkbox'
  options?: string[]
  required?: boolean
}

const TABS: { key: TabKey; label: string; icon?: string }[] = [
  { key: 'tanah', label: 'Tanah' },
  { key: 'bangunan', label: 'Bangunan' },
  { key: 'ruang', label: 'Ruang' },
  { key: 'sarana', label: 'Sarana' },
  { key: 'buku', label: 'Buku' },
]

const TABLE_FIELDS: Record<TabKey, FieldDef[]> = {
  tanah: [
    { key: 'nama_tanah', label: 'Nama Tanah', type: 'text', required: true },
    { key: 'nomor_sertifikat', label: 'No Sertifikat', type: 'text' },
    { key: 'jenis_lahan', label: 'Jenis Lahan', type: 'select', options: ['induk', 'sekat'] },
    { key: 'panjang', label: 'Panjang (m)', type: 'number' },
    { key: 'lebar', label: 'Lebar (m)', type: 'number' },
    { key: 'luas', label: 'Luas (m²)', type: 'number' },
    { key: 'status_kepemilikan', label: 'Status Kepemilikan', type: 'select', options: ['milik_sendiri', 'sewa', 'pinjam', 'bukan_milik'] },
    { key: 'pemilik', label: 'Pemilik', type: 'text' },
    { key: 'luas_siap_bangun', label: 'Luas Siap Bangun (m²)', type: 'number' },
  ],
  bangunan: [
    { key: 'nama_gedung', label: 'Nama Gedung', type: 'text', required: true },
    { key: 'jenis_prasarana', label: 'Jenis Prasarana', type: 'text' },
    { key: 'jumlah_lantai', label: 'Jumlah Lantai', type: 'number' },
    { key: 'panjang', label: 'Panjang (m)', type: 'number' },
    { key: 'lebar', label: 'Lebar (m)', type: 'number' },
    { key: 'luas_tapak', label: 'Luas Tapak (m²)', type: 'number' },
    { key: 'tahun_dibangun', label: 'Tahun Dibangun', type: 'number' },
    { key: 'tahun_renovasi', label: 'Tahun Renovasi', type: 'number' },
    { key: 'nilai_perolehan', label: 'Nilai Perolehan', type: 'number' },
    { key: 'kondisi_pondasi', label: 'Kerusakan Pondasi (%)', type: 'number' },
    { key: 'kondisi_kolom', label: 'Kerusakan Kolom (%)', type: 'number' },
    { key: 'kondisi_balok', label: 'Kerusakan Balok (%)', type: 'number' },
    { key: 'kondisi_pelat_lantai', label: 'Kerusakan Pelat Lantai (%)', type: 'number' },
    { key: 'kondisi_atap', label: 'Kerusakan Atap (%)', type: 'number' },
    { key: 'keterangan', label: 'Keterangan', type: 'text' },
  ],
  ruang: [
    { key: 'kode_ruang', label: 'Kode Ruang', type: 'text' },
    { key: 'nama_ruang', label: 'Nama Ruang', type: 'text', required: true },
    { key: 'bangunan_id', label: 'Bangunan ID', type: 'text' },
    { key: 'lantai_ke', label: 'Lantai Ke-', type: 'number' },
    { key: 'panjang', label: 'Panjang (m)', type: 'number' },
    { key: 'lebar', label: 'Lebar (m)', type: 'number' },
    { key: 'kapasitas_siswa', label: 'Kapasitas Siswa', type: 'number' },
    { key: 'jenis_ruang', label: 'Jenis Ruang', type: 'select', options: ['umum', 'wc', 'dapur', 'kantin'] },
    { key: 'peruntukan_wc', label: 'Peruntukan WC', type: 'select', options: ['', 'guru_l', 'guru_p', 'siswa_l', 'siswa_p', 'difabel'] },
    { key: 'kondisi_non_struktur', label: 'Kondisi Non-Struktur', type: 'text' },
  ],
  sarana: [
    { key: 'nama_sarana', label: 'Nama Sarana', type: 'text', required: true },
    { key: 'jenis', label: 'Jenis', type: 'select', options: ['alat', 'ape'] },
    { key: 'jumlah', label: 'Jumlah', type: 'number' },
    { key: 'kondisi', label: 'Kondisi', type: 'select', options: ['baik', 'rusak'] },
    { key: 'ruang_id', label: 'Ruang ID', type: 'text' },
  ],
  buku: [
    { key: 'jenis_buku', label: 'Jenis Buku', type: 'select', options: ['teks_pelajaran', 'panduan_guru', 'pengayaan', 'fiksi', 'non_fiksi'], required: true },
    { key: 'jumlah_judul', label: 'Jumlah Judul', type: 'number' },
    { key: 'jumlah_eksemplar', label: 'Jumlah Eksemplar', type: 'number' },
  ],
}

const TABLE_COLUMNS: Record<TabKey, string[]> = {
  tanah: ['Sekolah', 'Nama Tanah', 'No Sertifikat', 'Jenis', 'Luas', 'Kepemilikan', 'Pemilik'],
  bangunan: ['Sekolah', 'Nama Gedung', 'Lantai', 'Luas Tapak', 'Tahun', 'Kondisi Atap'],
  ruang: ['Sekolah', 'Kode', 'Nama Ruang', 'Lantai', 'Kapasitas', 'Jenis'],
  sarana: ['Sekolah', 'Nama Sarana', 'Jenis', 'Jumlah', 'Kondisi'],
  buku: ['Sekolah', 'Jenis Buku', 'Jumlah Judul', 'Jumlah Eksemplar'],
}

function cellValue(row: any, sekolahNama: string, tab: TabKey): string[] {
  const prefix = [sekolahNama]
  switch (tab) {
    case 'tanah': return [...prefix, row.nama_tanah, row.nomor_sertifikat || '-', row.jenis_lahan, `${row.luas || 0} m²`, row.status_kepemilikan, row.pemilik || '-']
    case 'bangunan': return [...prefix, row.nama_gedung, `${row.jumlah_lantai}`, `${row.luas_tapak || 0} m²`, `${row.tahun_dibangun || '-'}`, `${row.kondisi_atap || 0}%`]
    case 'ruang': return [...prefix, row.kode_ruang || '-', row.nama_ruang, `Lt.${row.lantai_ke}`, `${row.kapasitas_siswa || 0}`, row.jenis_ruang]
    case 'sarana': return [...prefix, row.nama_sarana, row.jenis, `${row.jumlah || 0}`, row.kondisi]
    case 'buku': return [...prefix, row.jenis_buku, `${row.jumlah_judul || 0}`, `${row.jumlah_eksemplar || 0}`]
  }
}

export default function SarprasPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [refreshKey, setRefreshKey] = useState(0)
  const [editing, setEditing] = useState<string | null>(null)
  const [editRow, setEditRow] = useState<any | null>(null)
  const [editTab, setEditTab] = useState<TabKey>('tanah')
  const [activeSarprasTab, setActiveSarprasTab] = useState<TabKey>('tanah')
  const [saving, setSaving] = useState(false)
  const [filterSekolah, setFilterSekolah] = useState('')

  const { data: allSchools } = useData<any[]>('schools', () => fetchJson('/api/schools'))
  const { data: tanahData } = useData<any[]>(`tanah-${refreshKey}`, () => fetchJson(`/api/sarpras/tanah`))
  const { data: bangunanData } = useData<any[]>(`bangunan-${refreshKey}`, () => fetchJson(`/api/sarpras/bangunan`))
  const { data: ruangData } = useData<any[]>(`ruang-${refreshKey}`, () => fetchJson(`/api/sarpras/ruang`))
  const { data: saranaData } = useData<any[]>(`sarana-${refreshKey}`, () => fetchJson(`/api/sarpras/sarana`))
  const { data: bukuData } = useData<any[]>(`buku-${refreshKey}`, () => fetchJson(`/api/sarpras/buku`))

  const ALL_DATA: Record<TabKey, any[]> = {
    tanah: tanahData || [],
    bangunan: bangunanData || [],
    ruang: ruangData || [],
    sarana: saranaData || [],
    buku: bukuData || [],
  }

  if (status === 'loading') return <div className="p-8 text-center text-zinc-500">Memuat...</div>

  const { can } = usePermissions()
  useEffect(() => {
    if (can('sarpras') === false) router.push('/dashboard')
  }, [can, router])
  if (!session) { router.push('/login'); return null }

  const role = session.user?.role
  const userSchoolId = session.user?.sekolah_id
  const isOperator = role === 'operator_sekolah'

  const sekolahMap = new Map((allSchools || []).map((s: any) => [s.id, s.nama]))

  const sekolahList = (allSchools || []).filter(s => !isOperator || s.id === userSchoolId)

  const openAdd = (tab: TabKey) => {
    setEditTab(tab)
    setEditing('new')
    setEditRow({})
  }

  const openEdit = (tab: TabKey, row: any) => {
    setEditTab(tab)
    setEditing(row.id)
    setEditRow({ ...row })
  }

  const closeForm = () => { setEditing(null); setEditRow(null) }

  const handleSave = async () => {
    if (!editRow) return
    setSaving(true)
    try {
      const body = { ...editRow }
      delete body.id; delete body.created_at; delete body.updated_at
      if (isOperator) body.school_id = userSchoolId

      if (editing === 'new') {
        const res = await fetch(`/api/sarpras/${editTab}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        if (!res.ok) throw new Error('Gagal menyimpan')
      } else {
        const res = await fetch(`/api/sarpras/${editTab}/${editing}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
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

  const handleDelete = async (tab: TabKey, id: string) => {
    if (!confirm('Hapus data ini?')) return
    try {
      const res = await fetch(`/api/sarpras/${tab}/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal menghapus')
      setRefreshKey(k => k + 1)
    } catch (err: any) {
      alert('Gagal: ' + err.message)
    }
  }

  const renderFormField = (f: FieldDef) => {
    const val = editRow?.[f.key] ?? ''
    if (f.type === 'select') {
      return (
        <select value={val} onChange={e => setEditRow({ ...editRow, [f.key]: e.target.value })} className="flex-1 px-3 py-1.5 border border-zinc-300 rounded-lg bg-white text-sm">
          {f.options?.map(o => <option key={o} value={o}>{o || 'Pilih...'}</option>)}
        </select>
      )
    }
    if (f.type === 'checkbox') {
      return <input type="checkbox" checked={!!val} onChange={e => setEditRow({ ...editRow, [f.key]: e.target.checked })} className="mt-2 w-4 h-4" />
    }
    return (
      <input type={f.type} value={val} onChange={e => setEditRow({ ...editRow, [f.key]: f.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value })} className="flex-1 px-3 py-1.5 border border-zinc-300 rounded-lg bg-white text-sm" />
    )
  }

  return (
    <AppShellTopbar>
      <div className="container-page space-y-6">
        <div className="page-header">
          <h1>Sarana Prasarana</h1>
        </div>

        {/* School filter for admin */}
        {!isOperator && (
          <div className="flex items-center gap-4">
            <select value={filterSekolah} onChange={e => setFilterSekolah(e.target.value)} className="max-w-xs px-3 py-2 rounded-[10px] border border-border bg-white text-sm">
              <option value="">Semua Sekolah</option>
              {sekolahList.map((s: any) => (
                <option key={s.id} value={s.id}>{s.nama} ({s.npsn})</option>
              ))}
            </select>
            <span className="text-sm text-text-muted">{sekolahList.length} sekolah</span>
          </div>
        )}

        {/* Tab navigation */}
        <div className="flex flex-wrap gap-1 bg-zinc-100 p-1 rounded-lg">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveSarprasTab(tab.key)}
              className={`px-4 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${activeSarprasTab === tab.key ? 'bg-white text-blue-700 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Selected category table */}
        {TABS.filter(t => t.key === activeSarprasTab).map(tab => {
          const data = (ALL_DATA[tab.key] || []).filter((d: any) => {
            if (isOperator) return d.school_id === userSchoolId
            if (filterSekolah) return d.school_id === filterSekolah
            return true
          })

          return (
            <div key={tab.key} className="card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="font-semibold text-text-main">{tab.label}</h3>
                {isOperator && (
                  <button onClick={() => openAdd(tab.key)} className="btn-primary btn-sm flex items-center gap-1"><Plus className="w-3.5 h-3.5" />Tambah</button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-border">
                      {TABLE_COLUMNS[tab.key].map(col => <th key={col} className="text-left px-4 py-3 font-semibold text-text-muted">{col}</th>)}
                      {isOperator && <th className="text-left px-4 py-3 font-semibold text-text-muted">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {data.length === 0 ? (
                      <tr><td colSpan={10} className="px-4 py-8 text-center text-sm text-text-muted">Belum ada data {tab.label.toLowerCase()}</td></tr>
                    ) : data.map((row: any) => {
                      const sekolahNama = sekolahMap.get(row.school_id) || 'Unknown'
                      return (
                        <tr key={row.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                          {cellValue(row, sekolahNama, tab.key).map((v, i) => <td key={i} className="px-4 py-3 text-text-main">{v}</td>)}
                          {isOperator && (
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button onClick={() => openEdit(tab.key, row)} className="text-primary-light hover:text-primary"><Pencil className="w-4 h-4" /></button>
                                <button onClick={() => handleDelete(tab.key, row.id)} className="text-danger hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}

        {/* Fallback */}
        {role !== 'admin_kecamatan' && role !== 'operator_sekolah' && (
          <div className="card p-12 text-center">
            <PackageOpen className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
            <h3 className="font-semibold text-text-main mb-2">Belum Ada Data Sarpras</h3>
            <p className="text-sm text-text-muted max-w-md mx-auto">Data sarana dan prasarana sekolah/lembaga belum diinput.</p>
          </div>
        )}

        {/* Modal */}
        {editing && editRow && (
          <div className="modal-overlay" onClick={closeForm}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h3 className="font-semibold text-text-main">{editing === 'new' ? 'Tambah' : 'Edit'} {TABS.find(t => t.key === editTab)?.label}</h3>
                <button onClick={closeForm} className="text-text-muted hover:text-text-main text-xl leading-none">&times;</button>
              </div>
              <div className="px-6 py-4 space-y-4 text-sm max-h-[60vh] overflow-y-auto">
                {(TABLE_FIELDS[editTab] || []).map(f => (
                  <div key={f.key} className="flex items-start gap-4">
                    <span className="w-36 shrink-0 text-text-muted pt-2">{f.label}{f.required ? ' *' : ''}</span>
                    {renderFormField(f)}
                  </div>
                ))}
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
