'use client'

import { useState, useEffect, useCallback } from 'react'
import { safeFetch } from '@/lib/safe-fetch'
import { Search, GraduationCap, ChevronLeft, ChevronRight } from 'lucide-react'

export default function AlumniClient() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tahunFilter, setTahunFilter] = useState('')
  const [tahunList, setTahunList] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchItems = useCallback(async (p: number = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(p))
      params.set('limit', '20')
      if (search) params.set('q', search)
      if (tahunFilter) params.set('tahun_lulus', tahunFilter)
      const result = await safeFetch<any>(`/api/v2/alumni?${params}`)
      setItems(result.data || [])
      setTotalPages(result.total_pages || 1)
      if (result.tahun_list) setTahunList(result.tahun_list)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [search, tahunFilter])

  useEffect(() => { fetchItems(page) }, [page, fetchItems])

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchItems(1) }, 400)
    return () => clearTimeout(t)
  }, [search, tahunFilter, fetchItems])

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Alumni</h1>
          <p className="page-subtitle">Data lulusan peserta didik</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge bg-primary/10 text-primary">{items.length} Item</span>
        </div>
      </div>

      <div className="card mb-6">
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Cari nama, NISN, atau NIK..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
          </div>
          <div className="relative w-full sm:w-44">
            <select value={tahunFilter} onChange={e => setTahunFilter(e.target.value)} className="input select text-sm">
              <option value="">Semua Tahun</option>
              {tahunList.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-12 skeleton w-full" />)}</div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center text-slate-400 text-sm">
          <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-50" />
          Belum ada data alumni
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Tahun Lulus</th>
                  <th>Nama</th>
                  <th>NISN</th>
                  <th>NIK</th>
                  <th>JK</th>
                  <th>Kelas</th>
                  <th>Tempat Lahir</th>
                  <th>Tanggal Lahir</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r: any) => (
                  <tr key={r.id}>
                    <td><span className="badge bg-slate-100 text-slate-600 text-[11px]">{r.tahun_lulus}</span></td>
                    <td className="font-medium text-slate-800 text-sm">{r.nama}</td>
                    <td className="text-sm text-slate-600">{r.nisn || '-'}</td>
                    <td className="text-sm text-slate-600">{r.nik || '-'}</td>
                    <td className="text-sm text-slate-600">{r.jenis_kelamin === 'laki-laki' ? 'L' : 'P'}</td>
                    <td className="text-sm text-slate-600">{r.kelas}</td>
                    <td className="text-sm text-slate-600">{r.tempat_lahir || '-'}</td>
                    <td className="text-sm text-slate-600">{r.tanggal_lahir || '-'}</td>
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
