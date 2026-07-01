'use client'

import { useState, useEffect, useCallback } from 'react'
import { safeFetch } from '@/lib/safe-fetch'
import { useSort } from '@/lib/use-sort'
import {
  Building2, Search, ChevronLeft, ChevronRight, SlidersHorizontal,
  AlertCircle, FlaskConical, BookOpen, DoorOpen, Pencil, Save, X,
  ArrowUp, ArrowDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface InfraItem {
  id: string
  school_id: string
  school_nama: string
  school_npsn: string
  sekolah_jenjang?: string
  jenis: string
  nama: string
  jumlah: number
  kondisi: string
}

interface Summary {
  total_ruang_kelas: number
  ruang_kelas_baik: number
  ruang_kelas_rusak: number
  total_lab: number
  lab_baik: number
  lab_rusak: number
  total_perpustakaan: number
  perpustakaan_baik: number
  perpustakaan_rusak: number
  total_wc: number
  wc_baik: number
  wc_rusak: number
}

interface Pagination {
  total: number
  page: number
  limit: number
  total_pages: number
}

const KONDISI_BADGES: Record<string, string> = {
  baik: 'bg-green-50 text-green-700 border-green-200',
  sedang: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  rusak_ringan: 'bg-orange-50 text-orange-700 border-orange-200',
  rusak_berat: 'bg-red-50 text-red-700 border-red-200',
}

const KONDISI_LABELS: Record<string, string> = {
  baik: 'Baik',
  sedang: 'Sedang',
  rusak_ringan: 'Rusak Ringan',
  rusak_berat: 'Rusak Berat',
}

const JENIS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  ruang_kelas: DoorOpen,
  laboratorium: FlaskConical,
  perpustakaan: BookOpen,
  wc: DoorOpen,
  lainnya: Building2,
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <span className="text-sm text-slate-500">Halaman {page} dari {totalPages}</span>
      <div className="flex gap-1">
        <button disabled={page <= 1} onClick={() => onChange(page - 1)} className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button disabled={page >= totalPages} onClick={() => onChange(page + 1)} className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function SummaryCard({ label, total, baik, rusak, icon: Icon }: {
  label: string; total: number; baik: number; rusak: number; icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 rounded-xl bg-primary/10">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <span className="text-2xl font-bold text-slate-800">{total}</span>
      </div>
      <div className="text-sm font-medium text-slate-700 mb-2">{label}</div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-green-600 font-medium">Baik</span>
          <span className="text-slate-600">{baik}</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 rounded-full" style={{ width: `${total > 0 ? (baik / total) * 100 : 0}%` }} />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-red-600 font-medium">Rusak</span>
          <span className="text-slate-600">{rusak}</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-red-500 rounded-full" style={{ width: `${total > 0 ? (rusak / total) * 100 : 0}%` }} />
        </div>
      </div>
    </div>
  )
}

export default function InfrastructureClient() {
  const [items, setItems] = useState<InfraItem[]>([])
  const [summary, setSummary] = useState<Summary>({
    total_ruang_kelas: 0, ruang_kelas_baik: 0, ruang_kelas_rusak: 0,
    total_lab: 0, lab_baik: 0, lab_rusak: 0,
    total_perpustakaan: 0, perpustakaan_baik: 0, perpustakaan_rusak: 0,
    total_wc: 0, wc_baik: 0, wc_rusak: 0,
  })
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, total_pages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [jenisFilter, setJenisFilter] = useState('')
  const [kondisiFilter, setKondisiFilter] = useState('')
  const [selectedItem, setSelectedItem] = useState<InfraItem | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({ nama: '', jenis: '', jumlah: 0, kondisi: '' })
  const [editError, setEditError] = useState<string | null>(null)
  const { sorted: sortedItems, sort, toggle } = useSort(items, 'school_nama')

  const openDetail = (item: InfraItem) => {
    setSelectedItem(item)
    setEditForm({ nama: item.nama, jenis: item.jenis, jumlah: item.jumlah, kondisi: item.kondisi })
    setEditing(false)
    setEditError(null)
  }

  const handleSave = async () => {
    if (!selectedItem) return
    setSaving(true)
    setEditError(null)
    try {
      const result = await safeFetch<any>(`/api/v2/infrastructure/${selectedItem.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          nama_ruang: editForm.nama,
          jenis_ruang: editForm.jenis,
          kapasitas_siswa: editForm.jumlah,
          kondisi_non_struktur: editForm.kondisi,
        }),
      })
      if (result) {
        setEditing(false)
        setSelectedItem({ ...selectedItem, nama: editForm.nama, jenis: editForm.jenis, jumlah: editForm.jumlah, kondisi: editForm.kondisi })
        fetchItems(Math.ceil((pagination.page * pagination.limit - (pagination.limit - 1)) / pagination.limit))
      }
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const fetchItems = useCallback(async (page: number = 1) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '20')
      if (search) params.set('q', search)
      if (jenisFilter) params.set('jenis', jenisFilter)
      if (kondisiFilter) params.set('kondisi', kondisiFilter)

      const result = await safeFetch<{ items: InfraItem[]; pagination: Pagination; summary: Summary }>(`/api/v2/infrastructure?${params}`)
      setItems(result.items || [])
      setSummary(result.summary)
      setPagination(result.pagination)
      if (result.summary) setSummary(result.summary)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }, [search, jenisFilter, kondisiFilter])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchItems(1)
  }, [jenisFilter, kondisiFilter, fetchItems])

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchItems(1)
    }, 400)
    return () => clearTimeout(timeout)
  }, [search, fetchItems])

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Infrastruktur</h1>
          <p className="page-subtitle">Monitoring sarana dan prasarana sekolah Kecamatan Lemahabang</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge bg-primary/10 text-primary">
            {pagination.total} Item
          </span>
        </div>
      </div>

      {error && (
        <div className="card p-12 text-center mb-6">
          <AlertCircle className="w-12 h-12 text-danger mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Gagal Memuat Data</h2>
          <p className="text-slate-500 text-sm">{error}</p>
          <button onClick={() => fetchItems(1)} className="btn btn-primary mt-4">Coba Lagi</button>
        </div>
      )}

      {!error && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <SummaryCard label="Ruang Kelas" total={summary.total_ruang_kelas} baik={summary.ruang_kelas_baik} rusak={summary.ruang_kelas_rusak} icon={DoorOpen} />
            <SummaryCard label="Laboratorium" total={summary.total_lab} baik={summary.lab_baik} rusak={summary.lab_rusak} icon={FlaskConical} />
            <SummaryCard label="Perpustakaan" total={summary.total_perpustakaan} baik={summary.perpustakaan_baik} rusak={summary.perpustakaan_rusak} icon={BookOpen} />
            <SummaryCard label="WC / Toilet" total={summary.total_wc} baik={summary.wc_baik} rusak={summary.wc_rusak} icon={DoorOpen} />
          </div>

          <div className="card mb-6">
            <div className="p-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari sekolah atau nama ruang..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="input pl-9"
                />
              </div>
              <div className="relative w-full sm:w-44">
                <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={jenisFilter}
                  onChange={e => setJenisFilter(e.target.value)}
                  className="input pl-9 select"
                >
                  <option value="">Semua Jenis</option>
                  <option value="ruang_kelas">Ruang Kelas</option>
                  <option value="laboratorium">Laboratorium</option>
                  <option value="perpustakaan">Perpustakaan</option>
                  <option value="wc">WC</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>
              <div className="relative w-full sm:w-44">
                <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={kondisiFilter}
                  onChange={e => setKondisiFilter(e.target.value)}
                  className="input pl-9 select"
                >
                  <option value="">Semua Kondisi</option>
                  <option value="baik">Baik</option>
                  <option value="sedang">Sedang</option>
                  <option value="rusak_ringan">Rusak Ringan</option>
                  <option value="rusak_berat">Rusak Berat</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="card overflow-hidden">
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-14 skeleton w-full" />
                ))}
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="card p-12 text-center">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-slate-500 mb-2">Tidak Ada Data Infrastruktur</h2>
              <p className="text-slate-400 text-sm">
                {search || jenisFilter || kondisiFilter ? 'Tidak ditemukan dengan filter yang dipilih' : 'Belum ada data infrastruktur yang tersedia'}
              </p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table-base">
                  <thead>
                    <tr>
                      {[
                        { key: 'school_nama', label: 'Sekolah' },
                        { key: 'jenis', label: 'Jenis' },
                        { key: 'nama', label: 'Nama Ruang' },
                        { key: 'jumlah', label: 'Jumlah' },
                        { key: 'kondisi', label: 'Kondisi' },
                      ].map(col => (
                        <th key={col.key} className="cursor-pointer select-none" onClick={() => toggle(col.key)}>
                          <div className="flex items-center gap-1">
                            {col.label}
                            {sort.key === col.key ? (
                              sort.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                            ) : <ArrowUp className="w-3 h-3 opacity-0" />}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedItems.map(item => {
                      const Icon = JENIS_ICONS[item.jenis] || Building2
                      return (
                        <tr
                          key={item.id}
                          className="cursor-pointer hover:bg-slate-50"
                          onClick={() => openDetail(item)}
                        >
                          <td>
                            <div className="font-medium text-slate-800">{item.school_nama}</div>
                            <div className="text-xs font-mono text-slate-400">{item.school_npsn}</div>
                          </td>
                          <td>
                            <div className="flex items-center gap-1.5">
                              <Icon className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-sm text-slate-600 capitalize">
                                {item.jenis?.replace(/_/g, ' ')}
                              </span>
                            </div>
                          </td>
                          <td className="text-sm text-slate-600">{item.nama}</td>
                          <td className="text-sm text-slate-600 font-semibold">{item.jumlah}</td>
                          <td>
                            <span className={cn("badge text-[11px] border", KONDISI_BADGES[item.kondisi] || 'bg-slate-100 text-slate-600')}>
                              {KONDISI_LABELS[item.kondisi] || item.kondisi}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination page={pagination.page} totalPages={pagination.total_pages} onChange={fetchItems} />
            </div>
          )}

          {selectedItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setSelectedItem(null); setEditing(false) }}>
              <div className="card max-w-lg w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">Detail Infrastruktur</h3>
                  {!editing ? (
                    <button onClick={() => setEditing(true)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
                      <Pencil className="w-4 h-4" />
                    </button>
                  ) : (
                    <button onClick={() => { setEditing(false); setEditForm({ nama: selectedItem.nama, jenis: selectedItem.jenis, jumlah: selectedItem.jumlah, kondisi: selectedItem.kondisi }) }} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {editError && (
                  <div className="p-3 mb-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {editError}
                  </div>
                )}

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-slate-500">Sekolah</span>
                    <span className="font-medium text-slate-700">{selectedItem.school_nama}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-slate-500">NPSN</span>
                    <span className="font-mono text-slate-600">{selectedItem.school_npsn}</span>
                  </div>

                  {editing ? (
                    <>
                      <div className="py-2 border-b">
                        <label className="block text-xs text-slate-500 mb-1">Jenis</label>
                        <select value={editForm.jenis} onChange={e => setEditForm(f => ({ ...f, jenis: e.target.value }))} className="input select text-sm">
                          <option value="ruang_kelas">Ruang Kelas</option>
                          <option value="laboratorium">Laboratorium</option>
                          <option value="perpustakaan">Perpustakaan</option>
                          <option value="wc">WC</option>
                          <option value="guru">Ruang Guru</option>
                          <option value="kepala_sekolah">Ruang Kepala Sekolah</option>
                          <option value="tata_usaha">Ruang Tata Usaha</option>
                          <option value="ibadah">Ruang Ibadah</option>
                          <option value="UKS">UKS</option>
                          <option value="gudang">Gudang</option>
                          <option value="lainnya">Lainnya</option>
                        </select>
                      </div>
                      <div className="py-2 border-b">
                        <label className="block text-xs text-slate-500 mb-1">Nama Ruang</label>
                        <input type="text" value={editForm.nama} onChange={e => setEditForm(f => ({ ...f, nama: e.target.value }))} className="input text-sm" />
                      </div>
                      <div className="py-2 border-b">
                        <label className="block text-xs text-slate-500 mb-1">Jumlah / Kapasitas</label>
                        <input type="number" value={editForm.jumlah} onChange={e => setEditForm(f => ({ ...f, jumlah: Number(e.target.value) }))} className="input text-sm" min="0" />
                      </div>
                      <div className="py-2">
                        <label className="block text-xs text-slate-500 mb-1">Kondisi</label>
                        <select value={editForm.kondisi} onChange={e => setEditForm(f => ({ ...f, kondisi: e.target.value }))} className="input select text-sm">
                          <option value="baik">Baik</option>
                          <option value="sedang">Sedang</option>
                          <option value="rusak_ringan">Rusak Ringan</option>
                          <option value="rusak_berat">Rusak Berat</option>
                        </select>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-slate-500">Jenis</span>
                        <span className="capitalize text-slate-700">{selectedItem.jenis?.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-slate-500">Nama Ruang</span>
                        <span className="font-medium text-slate-700">{selectedItem.nama}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-slate-500">Jumlah / Kapasitas</span>
                        <span className="font-semibold text-slate-700">{selectedItem.jumlah}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-slate-500">Kondisi</span>
                        <span className={cn("badge", KONDISI_BADGES[selectedItem.kondisi] || 'bg-slate-100 text-slate-600')}>
                          {KONDISI_LABELS[selectedItem.kondisi] || selectedItem.kondisi}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-2 mt-6">
                  {editing ? (
                    <>
                      <button onClick={() => { setEditing(false); setEditForm({ nama: selectedItem.nama, jenis: selectedItem.jenis, jumlah: selectedItem.jumlah, kondisi: selectedItem.kondisi }) }} className="btn btn-ghost flex-1">
                        Batal
                      </button>
                      <button onClick={handleSave} disabled={saving} className="btn btn-primary flex-1 flex items-center justify-center gap-2">
                        {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? 'Menyimpan...' : 'Simpan'}
                      </button>
                    </>
                  ) : (
                    <button onClick={() => { setSelectedItem(null); setEditing(false) }} className="btn btn-primary w-full">
                      Tutup
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
