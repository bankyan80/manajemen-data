'use client'

import { useState } from 'react'
import AppShellTopbar from '@/components/layout/AppShellTopbar'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useData, fetchJson } from '@/lib/useData'
import { PackageOpen, CheckCircle2, AlertCircle, Loader2, Plus, ArrowLeft, Pencil, Trash2 } from 'lucide-react'

type TabKey = 'tanah' | 'bangunan' | 'ruang' | 'sarana' | 'buku'

interface FieldDef {
  key: string
  label: string
  type: 'text' | 'number' | 'select' | 'checkbox'
  options?: string[]
  required?: boolean
}

const TABS: { key: TabKey; label: string }[] = [
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
  tanah: ['Nama Tanah', 'No Sertifikat', 'Jenis', 'Luas', 'Kepemilikan', 'Pemilik'],
  bangunan: ['Nama Gedung', 'Lantai', 'Luas Tapak', 'Tahun', 'Kondisi Atap'],
  ruang: ['Kode', 'Nama Ruang', 'Lantai', 'Kapasitas', 'Jenis'],
  sarana: ['Nama Sarana', 'Jenis', 'Jumlah', 'Kondisi'],
  buku: ['Jenis Buku', 'Jumlah Judul', 'Jumlah Eksemplar'],
}

function cellValue(row: any, tab: TabKey): string[] {
  switch (tab) {
    case 'tanah': return [row.nama_tanah, row.nomor_sertifikat || '-', row.jenis_lahan, `${row.luas || 0} m²`, row.status_kepemilikan, row.pemilik || '-']
    case 'bangunan': return [row.nama_gedung, `${row.jumlah_lantai}`, `${row.luas_tapak || 0} m²`, `${row.tahun_dibangun || '-'}`, `${row.kondisi_atap || 0}%`]
    case 'ruang': return [row.kode_ruang || '-', row.nama_ruang, `Lt.${row.lantai_ke}`, `${row.kapasitas_siswa || 0}`, row.jenis_ruang]
    case 'sarana': return [row.nama_sarana, row.jenis, `${row.jumlah || 0}`, row.kondisi]
    case 'buku': return [row.jenis_buku, `${row.jumlah_judul || 0}`, `${row.jumlah_eksemplar || 0}`]
  }
}

export default function SarprasPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [refreshKey, setRefreshKey] = useState(0)
  const [detailSekolah, setDetailSekolah] = useState<any | null>(null)
  const [subTab, setSubTab] = useState<TabKey>('tanah')
  const [editing, setEditing] = useState<string | null>(null)
  const [editRow, setEditRow] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)

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
  if (!session) { router.push('/login'); return null }

  const role = session.user?.role
  const userSchoolId = session.user?.sekolah_id

  const isOperator = role === 'operator_sekolah'
  const sekolahList = (allSchools || []).filter(s => !isOperator || s.id === userSchoolId)
  const currentData = ALL_DATA[subTab] || []

  const openAdd = () => {
    setEditing('new')
    setEditRow({})
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
      delete body.id; delete body.created_at; delete body.updated_at
      if (isOperator) body.school_id = userSchoolId

      if (editing === 'new') {
        const res = await fetch(`/api/sarpras/${subTab}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        if (!res.ok) throw new Error('Gagal menyimpan')
      } else {
        const res = await fetch(`/api/sarpras/${subTab}/${editing}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
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
      const res = await fetch(`/api/sarpras/${subTab}/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal menghapus')
      setRefreshKey(k => k + 1)
    } catch (err: any) {
      alert('Gagal: ' + err.message)
    }
  }

  const sekolahHasData = (schoolId: string) => {
    return ['tanah', 'bangunan', 'ruang', 'sarana', 'buku'].some(t => (ALL_DATA[t as TabKey] || []).some((d: any) => d.school_id === schoolId))
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

  const currentFields = TABLE_FIELDS[subTab] || []

  return (
    <AppShellTopbar>
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-zinc-900">Sarana Prasarana</h1>

        {/* Admin: daftar sekolah */}
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
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {sekolahList.map(s => {
                    const ada = sekolahHasData(s.id)
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

        {/* Detail / Operator view */}
        {(role === 'admin_kecamatan' && detailSekolah) || isOperator ? (
          <>
            {/* Header */}
            {detailSekolah && (
              <div className="flex items-center gap-3">
                <button onClick={() => setDetailSekolah(null)} className="text-zinc-500 hover:text-zinc-800"><ArrowLeft className="w-5 h-5" /></button>
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900">{detailSekolah.nama}</h2>
                  <p className="text-sm text-zinc-500">NPSN: {detailSekolah.npsn} &middot; {detailSekolah.jenjang}</p>
                </div>
              </div>
            )}

            {/* Sub-tabs */}
            <div className="flex gap-1 bg-zinc-100 p-1 rounded-lg w-fit flex-wrap">
              {TABS.map(t => (
                <button key={t.key} onClick={() => setSubTab(t.key)} className={`px-4 py-2 rounded-md text-sm font-medium ${subTab === t.key ? 'bg-white text-blue-700 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}>{t.label}</button>
              ))}
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {TABS.map(t => {
                const count = (ALL_DATA[t.key] || []).filter((d: any) => !isOperator || d.school_id === (detailSekolah?.id || userSchoolId)).length
                return (
                  <div key={t.key} className="bg-white border border-zinc-200 rounded-xl p-4 text-center cursor-pointer hover:shadow-sm" onClick={() => setSubTab(t.key)}>
                    <p className={`text-2xl font-bold ${subTab === t.key ? 'text-blue-700' : 'text-zinc-600'}`}>{count}</p>
                    <p className="text-xs text-zinc-500">{t.label}</p>
                  </div>
                )
              })}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200">
                <h3 className="font-semibold text-zinc-900">{TABS.find(t => t.key === subTab)?.label}</h3>
                {role === 'operator_sekolah' && (
                  <button onClick={openAdd} className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 flex items-center gap-1"><Plus className="w-4 h-4" />Tambah</button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200">
                      {TABLE_COLUMNS[subTab].map(col => <th key={col} className="text-left px-4 py-3 font-semibold text-zinc-700">{col}</th>)}
                      {role === 'operator_sekolah' && <th className="text-left px-4 py-3 font-semibold text-zinc-700">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.filter((d: any) => {
                      if (isOperator) return d.school_id === userSchoolId
                      if (detailSekolah) return d.school_id === detailSekolah.id
                      return true
                    }).map((row: any) => (
                      <tr key={row.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                        {cellValue(row, subTab).map((v, i) => <td key={i} className="px-4 py-3">{v}</td>)}
                        {role === 'operator_sekolah' && (
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button onClick={() => openEdit(row)} className="text-blue-600 hover:text-blue-800"><Pencil className="w-4 h-4" /></button>
                              <button onClick={() => handleDelete(row.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                    {currentData.length === 0 && (
                      <tr><td colSpan={10} className="px-4 py-8 text-center text-sm text-zinc-400">Belum ada data</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}

        {/* Fallback */}
        {role !== 'admin_kecamatan' && role !== 'operator_sekolah' && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-12 text-center">
            <PackageOpen className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
            <h3 className="font-semibold text-zinc-900 mb-2">Belum Ada Data Sarpras</h3>
            <p className="text-sm text-zinc-500 max-w-md mx-auto">Data sarana dan prasarana sekolah/lembaga belum diinput.</p>
          </div>
        )}

        {/* Modal */}
        {editing && editRow && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={closeForm}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
                <h3 className="font-semibold text-zinc-900">{editing === 'new' ? 'Tambah' : 'Edit'} {TABS.find(t => t.key === subTab)?.label}</h3>
                <button onClick={closeForm} className="text-zinc-400 hover:text-zinc-600 text-xl leading-none">&times;</button>
              </div>
              <div className="px-6 py-4 space-y-4 text-sm max-h-[60vh] overflow-y-auto">
                {currentFields.map(f => (
                  <div key={f.key} className="flex items-start gap-4">
                    <span className="w-36 shrink-0 text-zinc-500 pt-2">{f.label}{f.required ? ' *' : ''}</span>
                    {renderFormField(f)}
                  </div>
                ))}
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
