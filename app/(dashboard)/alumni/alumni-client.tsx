'use client'

import { useState, useEffect, useCallback } from 'react'
import { safeFetch } from '@/lib/safe-fetch'
import { GraduationCap, Save, X, Loader2, Plus } from 'lucide-react'

export default function AlumniClient() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tahunFilter, setTahunFilter] = useState('')
  const [tahunList, setTahunList] = useState<string[]>([])
  const [saving, setSaving] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Record<string, Record<string, number>>>({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState({ tahun_lulus: '', nama: '', nisn: '', nik: '', jenis_kelamin: 'laki-laki', kelas: '', tujuan: '' })
  const [addSaving, setAddSaving] = useState(false)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('limit', '5000')
      if (tahunFilter) params.set('tahun_lulus', tahunFilter)
      const result = await safeFetch<any>(`/api/v2/alumni?${params}`)
      setItems(result.data || [])
      if (result.tahun_list) setTahunList(result.tahun_list)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [tahunFilter])

  useEffect(() => { fetchItems() }, [fetchItems])

  const schools = new Map<string, { nama: string; total: number; smp_negeri: number; smp_swasta: number; pondok: number; tidak_melanjutkan: number }>()
  for (const r of items) {
    const key = r.school_id
    if (!schools.has(key)) {
      schools.set(key, { nama: r.school_nama || key, total: 0, smp_negeri: 0, smp_swasta: 0, pondok: 0, tidak_melanjutkan: 0 })
    }
    const s = schools.get(key)!
    s.total++
    if (r.tujuan === 'smp_negeri') s.smp_negeri++
    else if (r.tujuan === 'smp_swasta') s.smp_swasta++
    else if (r.tujuan === 'pondok') s.pondok++
    else if (r.tujuan === 'tidak_melanjutkan') s.tidak_melanjutkan++
  }
  const sekolahList = Array.from(schools.entries()).map(([id, s]) => ({ id, ...s }))

  const openEdit = (schoolId: string) => {
    const s = schools.get(schoolId)
    if (!s) return
    setEditForm(prev => ({ ...prev, [schoolId]: { smp_negeri: s.smp_negeri, smp_swasta: s.smp_swasta, pondok: s.pondok, tidak_melanjutkan: s.tidak_melanjutkan } }))
  }

  const handleSave = async (schoolId: string) => {
    const form = editForm[schoolId]
    if (!form || !tahunFilter) return
    const sum = form.smp_negeri + form.smp_swasta + form.pondok + form.tidak_melanjutkan
    const s = schools.get(schoolId)
    if (sum > (s?.total || 0)) { alert(`Jumlah distribusi (${sum}) melebihi total lulusan (${s?.total || 0})`); return }
    setSaving(schoolId)
    try {
      await safeFetch('/api/v2/alumni/tujuan', {
        method: 'PUT',
        body: JSON.stringify({ school_id: schoolId, tahun_lulus: tahunFilter, distribusi: form }),
      })
      fetchItems()
    } catch (err: unknown) { alert(err instanceof Error ? err.message : 'Gagal menyimpan') }
    finally { setSaving(null) }
  }

  const handleAddAlumni = async () => {
    if (!addForm.tahun_lulus || !addForm.nama || !addForm.kelas) { alert('Tahun lulus, nama, dan kelas wajib'); return }
    setAddSaving(true)
    try {
      await safeFetch('/api/v2/alumni', { method: 'POST', body: JSON.stringify(addForm) })
      setShowAddForm(false)
      setAddForm({ tahun_lulus: '', nama: '', nisn: '', nik: '', jenis_kelamin: 'laki-laki', kelas: '', tujuan: '' })
      setTahunFilter(addForm.tahun_lulus)
      fetchItems()
    } catch (err: unknown) { alert(err instanceof Error ? err.message : 'Gagal menambah') }
    finally { setAddSaving(false) }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Rekap Kelanjutan Lulusan</h1>
          <p className="page-subtitle">Data lulusan peserta didik per sekolah</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge bg-primary/10 text-primary">{items.length} Lulusan</span>
          <button onClick={() => setShowAddForm(true)} className="btn btn-primary btn-sm flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Tambah Alumni</button>
        </div>
      </div>

      {showAddForm && (
        <div className="card p-4 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div><label className="block text-xs text-slate-500 mb-1">Tahun Lulus</label><input type="text" value={addForm.tahun_lulus} onChange={e => setAddForm(f => ({ ...f, tahun_lulus: e.target.value }))} className="input text-sm" placeholder="2025/2026" /></div>
            <div><label className="block text-xs text-slate-500 mb-1">Nama</label><input value={addForm.nama} onChange={e => setAddForm(f => ({ ...f, nama: e.target.value }))} className="input text-sm" placeholder="Nama siswa" /></div>
            <div><label className="block text-xs text-slate-500 mb-1">NISN</label><input value={addForm.nisn} onChange={e => setAddForm(f => ({ ...f, nisn: e.target.value }))} className="input text-sm" /></div>
            <div><label className="block text-xs text-slate-500 mb-1">NIK</label><input value={addForm.nik} onChange={e => setAddForm(f => ({ ...f, nik: e.target.value }))} className="input text-sm" /></div>
            <div><label className="block text-xs text-slate-500 mb-1">JK</label><select value={addForm.jenis_kelamin} onChange={e => setAddForm(f => ({ ...f, jenis_kelamin: e.target.value }))} className="input select text-sm"><option value="laki-laki">Laki-laki</option><option value="perempuan">Perempuan</option></select></div>
            <div><label className="block text-xs text-slate-500 mb-1">Kelas</label><input value={addForm.kelas} onChange={e => setAddForm(f => ({ ...f, kelas: e.target.value }))} className="input text-sm" placeholder="Kelas VI" /></div>
            <div><label className="block text-xs text-slate-500 mb-1">Tujuan</label><select value={addForm.tujuan} onChange={e => setAddForm(f => ({ ...f, tujuan: e.target.value }))} className="input select text-sm"><option value="">-</option><option value="smp_negeri">SMP Negeri</option><option value="smp_swasta">SMP Swasta</option><option value="pondok">Pondok Pesantren</option><option value="tidak_melanjutkan">Tidak Melanjutkan</option></select></div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleAddAlumni} disabled={addSaving} className="btn btn-primary btn-sm flex items-center gap-1">{addSaving ? 'Menyimpan...' : 'Simpan'}</button>
            <button onClick={() => setShowAddForm(false)} className="btn btn-ghost btn-sm">Batal</button>
          </div>
        </div>
      )}

      <div className="card mb-6">
        <div className="p-4">
          <div className="relative w-full sm:w-64">
            <select value={tahunFilter} onChange={e => setTahunFilter(e.target.value)} className="input select text-sm">
              <option value="">Pilih Tahun Lulus</option>
              {tahunList.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-12 skeleton w-full" />)}</div>
      ) : !tahunFilter ? (
        <div className="card p-12 text-center text-slate-400 text-sm">
          <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-50" />
          Pilih tahun lulus untuk melihat rekap
        </div>
      ) : sekolahList.length === 0 ? (
        <div className="card p-12 text-center text-slate-400 text-sm">
          <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-50" />
          Belum ada data alumni untuk tahun {tahunFilter}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th className="w-10">No</th>
                  <th>Nama Sekolah</th>
                  <th className="text-center">Jumlah Lulusan</th>
                  <th className="text-center">SMP Negeri</th>
                  <th className="text-center">SMP Swasta</th>
                  <th className="text-center">Pondok Pesantren</th>
                  <th className="text-center">Tidak Melanjutkan</th>
                  <th className="w-20">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {sekolahList.map((s, i) => {
                  const editing = editForm[s.id]
                  const form = editing || { smp_negeri: 0, smp_swasta: 0, pondok: 0, tidak_melanjutkan: 0 }
                  return (
                    <tr key={s.id}>
                      <td className="text-center text-sm text-slate-500">{i + 1}</td>
                      <td className="font-medium text-slate-800 text-sm">{s.nama}</td>
                      <td className="text-center font-semibold text-slate-800">{s.total}</td>
                      <td className="text-center">
                        {editing ? (
                          <input type="number" min="0" className="input text-xs py-1 px-2 w-16 text-center" value={form.smp_negeri} onChange={e => setEditForm(prev => ({ ...prev, [s.id]: { ...prev[s.id], smp_negeri: Number(e.target.value) } }))} />
                        ) : (
                          <span className="text-sm text-slate-600">{s.smp_negeri || 0}</span>
                        )}
                      </td>
                      <td className="text-center">
                        {editing ? (
                          <input type="number" min="0" className="input text-xs py-1 px-2 w-16 text-center" value={form.smp_swasta} onChange={e => setEditForm(prev => ({ ...prev, [s.id]: { ...prev[s.id], smp_swasta: Number(e.target.value) } }))} />
                        ) : (
                          <span className="text-sm text-slate-600">{s.smp_swasta || 0}</span>
                        )}
                      </td>
                      <td className="text-center">
                        {editing ? (
                          <input type="number" min="0" className="input text-xs py-1 px-2 w-16 text-center" value={form.pondok} onChange={e => setEditForm(prev => ({ ...prev, [s.id]: { ...prev[s.id], pondok: Number(e.target.value) } }))} />
                        ) : (
                          <span className="text-sm text-slate-600">{s.pondok || 0}</span>
                        )}
                      </td>
                      <td className="text-center">
                        {editing ? (
                          <input type="number" min="0" className="input text-xs py-1 px-2 w-16 text-center" value={form.tidak_melanjutkan} onChange={e => setEditForm(prev => ({ ...prev, [s.id]: { ...prev[s.id], tidak_melanjutkan: Number(e.target.value) } }))} />
                        ) : (
                          <span className="text-sm text-slate-600">{s.tidak_melanjutkan || 0}</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          {editing ? (
                            <>
                              <button onClick={() => handleSave(s.id)} disabled={saving === s.id} className="p-1.5 rounded-lg hover:bg-green-50 text-green-600" title="Simpan">
                                {saving === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                              </button>
                              <button onClick={() => setEditForm(prev => { const n = { ...prev }; delete n[s.id]; return n })} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400" title="Batal">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <button onClick={() => openEdit(s.id)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-500 text-xs">Isi</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
