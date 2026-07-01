'use client'

import { useState, useEffect, useCallback } from 'react'
import { safeFetch } from '@/lib/safe-fetch'
import { Search, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'

export default function MutasiKeluarClient() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ tanggal: '', nama: '', nisn: '', nik: '', jenis_kelamin: 'laki-laki', kelas_kelompok: '', sekolah_tujuan: '', alasan: '', keterangan: '' })
  const [saving, setSaving] = useState(false)

  const fetchItems = useCallback(async (p: number = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(p))
      params.set('limit', '20')
      if (search) params.set('q', search)
      const result = await safeFetch<any>(`/api/kesiswaan/mutasi-keluar?${params}`)
      setItems(result.data || [])
      setTotalPages(result.total_pages || 1)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [search])

  useEffect(() => { fetchItems(page) }, [page, fetchItems])

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchItems(1) }, 400)
    return () => clearTimeout(t)
  }, [search, fetchItems])

  const handleAdd = async () => {
    if (!form.tanggal || !form.nama || !form.kelas_kelompok) { alert('Tanggal, Nama, dan Kelas wajib diisi'); return }
    setSaving(true)
    try {
      await safeFetch('/api/kesiswaan/mutasi-keluar', { method: 'POST', body: JSON.stringify(form) })
      setShowForm(false)
      setForm({ tanggal: '', nama: '', nisn: '', nik: '', jenis_kelamin: 'laki-laki', kelas_kelompok: '', sekolah_tujuan: '', alasan: '', keterangan: '' })
      fetchItems(1)
    } catch (err: unknown) { alert(err instanceof Error ? err.message : 'Gagal menambah') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string, nama: string) => {
    if (!confirm(`Yakin hapus mutasi keluar "${nama}"?`)) return
    try {
      await safeFetch(`/api/kesiswaan/mutasi-keluar/${id}`, { method: 'DELETE' })
      fetchItems(page)
    } catch (err: unknown) { alert(err instanceof Error ? err.message : 'Gagal hapus') }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Mutasi Keluar</h1>
          <p className="page-subtitle">Data siswa pindahan keluar</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge bg-primary/10 text-primary">{items.length} Item</span>
          <button onClick={() => setShowForm(true)} className="btn btn-primary btn-sm flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Tambah</button>
        </div>
      </div>

      <div className="card mb-6">
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Cari nama, NISN, atau NIK..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
          </div>
        </div>
      </div>

      {showForm && (
        <div className="card p-4 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div><label className="block text-xs text-slate-500 mb-1">Tanggal</label><input type="date" value={form.tanggal} onChange={e => setForm(f => ({ ...f, tanggal: e.target.value }))} className="input text-sm" /></div>
            <div><label className="block text-xs text-slate-500 mb-1">Nama</label><input value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} className="input text-sm" placeholder="Nama siswa" /></div>
            <div><label className="block text-xs text-slate-500 mb-1">NISN</label><input value={form.nisn} onChange={e => setForm(f => ({ ...f, nisn: e.target.value }))} className="input text-sm" /></div>
            <div><label className="block text-xs text-slate-500 mb-1">NIK</label><input value={form.nik} onChange={e => setForm(f => ({ ...f, nik: e.target.value }))} className="input text-sm" /></div>
            <div><label className="block text-xs text-slate-500 mb-1">JK</label><select value={form.jenis_kelamin} onChange={e => setForm(f => ({ ...f, jenis_kelamin: e.target.value }))} className="input select text-sm"><option value="laki-laki">Laki-laki</option><option value="perempuan">Perempuan</option></select></div>
            <div><label className="block text-xs text-slate-500 mb-1">Kelas</label><input value={form.kelas_kelompok} onChange={e => setForm(f => ({ ...f, kelas_kelompok: e.target.value }))} className="input text-sm" placeholder="Kelas I / II dll" /></div>
            <div><label className="block text-xs text-slate-500 mb-1">Sekolah Tujuan</label><input value={form.sekolah_tujuan} onChange={e => setForm(f => ({ ...f, sekolah_tujuan: e.target.value }))} className="input text-sm" /></div>
            <div><label className="block text-xs text-slate-500 mb-1">Alasan</label><input value={form.alasan} onChange={e => setForm(f => ({ ...f, alasan: e.target.value }))} className="input text-sm" /></div>
          </div>
          <div className="mt-3"><label className="block text-xs text-slate-500 mb-1">Keterangan</label><input value={form.keterangan} onChange={e => setForm(f => ({ ...f, keterangan: e.target.value }))} className="input text-sm" /></div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleAdd} disabled={saving} className="btn btn-primary btn-sm flex items-center gap-1">{saving ? 'Menyimpan...' : 'Simpan'}</button>
            <button onClick={() => setShowForm(false)} className="btn btn-ghost btn-sm">Batal</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-12 skeleton w-full" />)}</div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center text-slate-400 text-sm">Tidak ada data mutasi keluar</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Nama</th>
                  <th>NISN</th>
                  <th>NIK</th>
                  <th>JK</th>
                  <th>Kelas</th>
                  <th>Sekolah Tujuan</th>
                  <th>Alasan</th>
                  <th className="w-16">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r: any) => (
                  <tr key={r.id}>
                    <td className="text-sm text-slate-600">{r.tanggal}</td>
                    <td className="font-medium text-slate-800 text-sm">{r.nama}</td>
                    <td className="text-sm text-slate-600">{r.nisn || '-'}</td>
                    <td className="text-sm text-slate-600">{r.nik || '-'}</td>
                    <td className="text-sm text-slate-600">{r.jenis_kelamin === 'laki-laki' ? 'L' : 'P'}</td>
                    <td className="text-sm text-slate-600">{r.kelas_kelompok}</td>
                    <td className="text-sm text-slate-600">{r.sekolah_tujuan || '-'}</td>
                    <td className="text-sm text-slate-600">{r.alasan || '-'}</td>
                    <td>
                      <button onClick={() => handleDelete(r.id, r.nama)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-sm text-slate-500">Halaman {page} dari {totalPages}</span>
              <div className="flex gap-1">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
