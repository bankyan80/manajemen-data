'use client'

import { useState, useEffect, useCallback } from 'react'
import { safeFetch } from '@/lib/safe-fetch'
import { useRouter } from 'next/navigation'
import {
  School, Search, ChevronLeft, ChevronRight, MapPin,
  Users, GraduationCap, AlertCircle, SlidersHorizontal,
} from 'lucide-react'
import { HEALTH_GRADE } from '@/constants'
import { cn } from '@/lib/utils'

interface SchoolRow {
  id: string
  nama: string
  npsn: string
  jenjang: 'sd' | 'tk' | 'kb'
  status: string
  alamat: string
  desa: string
  kecamatan: string
  health_score: number | null
  is_active: number | boolean
  teacherCount: number
  studentCount: number
}

interface Pagination {
  total: number
  page: number
  limit: number
  total_pages: number
}

function getHealthGrade(score: number | null) {
  if (score === null || score === undefined) return { label: 'N/A', color: 'text-slate-400 bg-slate-50 border-slate-200' }
  const grades = [HEALTH_GRADE.EXCELLENT, HEALTH_GRADE.GOOD, HEALTH_GRADE.MODERATE, HEALTH_GRADE.WARNING, HEALTH_GRADE.CRITICAL]
  for (const g of grades) {
    if (score >= g.min) return g
  }
  return HEALTH_GRADE.CRITICAL
}

function getHealthBarColor(score: number | null) {
  if (score === null) return 'bg-slate-200'
  if (score >= 90) return 'bg-green-500'
  if (score >= 75) return 'bg-blue-500'
  if (score >= 60) return 'bg-yellow-500'
  if (score >= 40) return 'bg-orange-500'
  return 'bg-red-500'
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

export default function SchoolsClient() {
  const router = useRouter()
  const [schools, setSchools] = useState<SchoolRow[]>([])
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, total_pages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [jenjang, setJenjang] = useState('')

  const fetchSchools = useCallback(async (page: number = 1) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '20')
      if (search) params.set('q', search)
      if (jenjang) params.set('jenjang', jenjang)

      const result = await safeFetch<{ schools: SchoolRow[]; pagination: Pagination }>(`/api/v2/schools?${params}`)
      setSchools(result.schools || [])
      setPagination(result.pagination)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }, [search, jenjang])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSchools(1)
  }, [fetchSchools])

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchSchools(1)
    }, 400)
    return () => clearTimeout(timeout)
  }, [search, fetchSchools])

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">School Digital Twin</h1>
          <p className="page-subtitle">Digital twin seluruh sekolah di Kecamatan Lemahabang</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge bg-primary/10 text-primary">
            {pagination.total} Sekolah
          </span>
        </div>
      </div>

      <div className="card mb-6">
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama sekolah atau NPSN..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-9"
            />
          </div>
          <div className="relative w-full sm:w-48">
            <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={jenjang}
              onChange={e => setJenjang(e.target.value)}
              className="input pl-9 select"
            >
              <option value="">Semua Jenjang</option>
              <option value="sd">SD</option>
              <option value="tk">TK</option>
              <option value="kb">KB</option>
            </select>
          </div>
        </div>
      </div>

      {error ? (
        <div className="card p-12 text-center">
          <AlertCircle className="w-12 h-12 text-danger mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Gagal Memuat Data</h2>
          <p className="text-slate-500 text-sm">{error}</p>
          <button onClick={() => fetchSchools(1)} className="btn btn-primary mt-4">Coba Lagi</button>
        </div>
      ) : loading ? (
        <div className="card overflow-hidden">
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-14 skeleton w-full" />
            ))}
          </div>
        </div>
      ) : schools.length === 0 ? (
        <div className="card p-12 text-center">
          <School className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-500 mb-2">Tidak Ada Data Sekolah</h2>
          <p className="text-slate-400 text-sm">
            {search ? 'Tidak ditemukan sekolah dengan kata kunci tersebut' : 'Belum ada data sekolah yang tersedia'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Sekolah</th>
                  <th>NPSN</th>
                  <th>Jenjang</th>
                  <th>Status</th>
                  <th>Guru</th>
                  <th>Siswa</th>
                  <th>Health Score</th>
                </tr>
              </thead>
              <tbody>
                {schools.map(school => {
                  const health = getHealthGrade(school.health_score)
                  return (
                    <tr
                      key={school.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/schools/${school.id}`)}
                    >
                      <td>
                        <div className="font-medium text-slate-800">{school.nama}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {school.desa}, {school.kecamatan}
                        </div>
                      </td>
                      <td className="text-slate-600 font-mono text-sm">{school.npsn}</td>
                      <td>
                        <span className={cn(
                          "badge",
                          school.jenjang === 'sd' && "bg-blue-50 text-blue-700",
                          school.jenjang === 'tk' && "bg-purple-50 text-purple-700",
                          school.jenjang === 'kb' && "bg-pink-50 text-pink-700",
                        )}>
                          {school.jenjang.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className={cn(
                          "badge",
                          school.status === 'negeri' ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"
                        )}>
                          {school.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {school.teacherCount}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                          {school.studentCount}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={cn("h-full rounded-full transition-all", getHealthBarColor(school.health_score))}
                              style={{ width: `${school.health_score || 0}%` }}
                            />
                          </div>
                          <span className={cn("badge text-[11px]", health.color)}>
                            {health.label}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={pagination.page} totalPages={pagination.total_pages} onChange={fetchSchools} />
        </div>
      )}
    </div>
  )
}
