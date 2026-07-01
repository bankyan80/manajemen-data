'use client'

import { useState, useEffect, useCallback } from 'react'
import { safeFetch } from '@/lib/safe-fetch'
import { useSort } from '@/lib/use-sort'
import {
  Award, Search, ChevronLeft, ChevronRight, SlidersHorizontal,
  AlertCircle, CheckCircle2, MinusCircle, ArrowUp, ArrowDown,
} from 'lucide-react'

interface EmployeeCert {
  id: string
  nama: string
  nik: string
  nip?: string
  nuptk?: string
  jabatan: string
  sertifikasi: string
  school_nama: string
  school_npsn: string
  sekolah_jenjang: string
}

interface PerSekolah {
  sekolah_id: string
  school_nama: string
  sekolah_jenjang: string
  total: number
  sudah: number
}

interface Summary {
  total: number
  totalSudah: number
  totalTidakAda: number
  persenSudah: number
}

interface Pagination {
  total: number
  page: number
  limit: number
  total_pages: number
}

const FILTERS = [
  { value: '', label: 'Semua' },
  { value: 'sudah', label: 'Sudah Sertifikasi' },
  { value: 'tidak_ada', label: 'Tidak Ada (Tendik)' },
]

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

export default function CertificationClient() {
  const [employees, setEmployees] = useState<EmployeeCert[]>([])
  const [summary, setSummary] = useState<Summary>({ total: 0, totalSudah: 0, totalTidakAda: 0, persenSudah: 0 })
  const [perSekolah, setPerSekolah] = useState<PerSekolah[]>([])
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, total_pages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')
  const { sorted: sortedEmployees, sort, toggle } = useSort(employees, 'nama')

  const fetchData = useCallback(async (page: number = 1) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '20')
      if (search) params.set('q', search)
      if (filter) params.set('sertifikasi', filter)

      const result = await safeFetch<{ employees: EmployeeCert[]; summary: Summary; perSekolah: PerSekolah[]; pagination: Pagination }>(`/api/v2/certification?${params}`)
      setEmployees(result.employees || [])
      setSummary(result.summary || { total: 0, totalSudah: 0, totalTidakAda: 0, persenSudah: 0 })
      setPerSekolah(result.perSekolah || [])
      setPagination(result.pagination)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }, [search, filter])

  useEffect(() => { fetchData(1) }, [fetchData])

  useEffect(() => {
    const timeout = setTimeout(() => fetchData(1), 400)
    return () => clearTimeout(timeout)
  }, [search, fetchData])

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Monitoring Sertifikasi</h1>
          <p className="page-subtitle">Status sertifikasi guru dan tenaga kependidikan Kecamatan Lemahabang</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge bg-primary/10 text-primary">
            {pagination.total} Pegawai
          </span>
        </div>
      </div>

      {error && (
        <div className="card p-12 text-center mb-6">
          <AlertCircle className="w-12 h-12 text-danger mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Gagal Memuat Data</h2>
          <p className="text-slate-500 text-sm">{error}</p>
          <button onClick={() => fetchData(1)} className="btn btn-primary mt-4">Coba Lagi</button>
        </div>
      )}

      {!error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="card p-5">
              <div className="text-xs text-slate-500">Total Pegawai</div>
              <div className="text-2xl font-bold text-slate-800">{summary.total}</div>
            </div>
            <div className="card p-5 border-l-4 border-l-green-500">
              <div className="text-xs text-slate-500">Sudah Sertifikasi</div>
              <div className="text-2xl font-bold text-green-700">{summary.totalSudah}</div>
            </div>
            <div className="card p-5 border-l-4 border-l-slate-300">
              <div className="text-xs text-slate-500">Tidak Ada (Tendik)</div>
              <div className="text-2xl font-bold text-slate-500">{summary.totalTidakAda}</div>
            </div>
            <div className="card p-5">
              <div className="text-xs text-slate-500">Capaian Sertifikasi</div>
              <div className="text-2xl font-bold text-primary">{summary.persenSudah}%</div>
              <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${summary.persenSudah}%` }} />
              </div>
            </div>
          </div>

          <div className="card p-5 mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Rekapitulasi per Sekolah</h3>
            {perSekolah.length === 0 ? (
              <p className="text-sm text-slate-400">Tidak ada data</p>
            ) : (
              <div className="overflow-x-auto max-h-60 overflow-y-auto">
                <table className="table-base text-xs">
                  <thead>
                    <tr>
                      <th>Sekolah</th>
                      <th>Jenjang</th>
                      <th>Total</th>
                      <th>Sudah</th>
                      <th>Tidak Ada</th>
                      <th>Capaian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {perSekolah.map(s => {
                      const belumAda = s.total - s.sudah
                      const persen = s.total > 0 ? Math.round((s.sudah / s.total) * 100) : 0
                      return (
                        <tr key={s.sekolah_id}>
                          <td className="font-medium max-w-[180px] truncate">{s.school_nama}</td>
                          <td className="uppercase">{s.sekolah_jenjang}</td>
                          <td>{s.total}</td>
                          <td className="text-green-600">{s.sudah}</td>
                          <td className="text-slate-400">{belumAda}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${persen}%` }} />
                              </div>
                              <span className="text-slate-500">{persen}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card mb-6">
            <div className="p-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama / NIK / NUPTK..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="input pl-9"
                />
              </div>
              <div className="relative w-full sm:w-48">
                <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                  className="input pl-9 select"
                >
                  {FILTERS.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
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
          ) : employees.length === 0 ? (
            <div className="card p-12 text-center">
              <Award className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-slate-500 mb-2">Tidak Ada Data</h2>
              <p className="text-slate-400 text-sm">
                {search || filter ? 'Tidak ditemukan dengan filter yang dipilih' : 'Belum ada data pegawai'}
              </p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table-base">
                  <thead>
                    <tr>
                      {[
                        { key: 'nama', label: 'Nama' },
                        { key: 'nik', label: 'NIK / NUPTK' },
                        { key: 'jabatan', label: 'Jabatan' },
                        { key: 'sertifikasi', label: 'Sertifikasi' },
                        { key: 'school_nama', label: 'Sekolah' },
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
                    {sortedEmployees.map(emp => (
                      <tr key={emp.id} className="hover:bg-slate-50">
                        <td>
                          <div className="font-medium text-slate-800">{emp.nama}</div>
                        </td>
                        <td>
                          <div className="text-xs font-mono text-slate-400">{emp.nik}</div>
                          {emp.nuptk && <div className="text-xs font-mono text-slate-400">NUPTK: {emp.nuptk}</div>}
                        </td>
                        <td className="text-sm text-slate-600">{emp.jabatan}</td>
                        <td>
                          {emp.sertifikasi === 'sudah' ? (
                            <span className="badge bg-green-50 text-green-700 border border-green-200 flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3" /> Sudah Sertifikasi
                            </span>
                          ) : (
                            <span className="badge bg-slate-50 text-slate-500 border border-slate-200 flex items-center gap-1 w-fit">
                              <MinusCircle className="w-3 h-3" /> Tidak Ada
                            </span>
                          )}
                        </td>
                        <td className="text-sm text-slate-500 max-w-[180px] truncate">
                          {emp.school_nama || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={pagination.page} totalPages={pagination.total_pages} onChange={fetchData} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
