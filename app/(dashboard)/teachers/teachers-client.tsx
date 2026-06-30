'use client'

import { useState, useEffect, useCallback } from 'react'
import { safeFetch } from '@/lib/safe-fetch'
import {
  Users, Award, Clock, AlertCircle, Search, ChevronLeft, ChevronRight,
  SlidersHorizontal, FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import TeacherDetailModal from './teacher-detail-modal'

interface TeacherRow {
  id: string
  nama: string
  nik: string
  nip?: string
  nuptk?: string
  jabatan?: string
  status_pegawai?: string
  sertifikasi?: string
  pendidikan_terakhir?: string
  tmt_kerja?: string
  tanggal_bup?: string
  school_nama?: string
  sekolah_id: string
}

interface Pagination {
  total: number
  page: number
  limit: number
  total_pages: number
}

function getStatusPegawaiColor(status: string | undefined) {
  const colors: Record<string, string> = {
    pns: 'bg-blue-50 text-blue-700',
    pppk: 'bg-green-50 text-green-700',
    honorer: 'bg-yellow-50 text-yellow-700',
    non_asn: 'bg-purple-50 text-purple-700',
  }
  return colors[status || ''] || 'bg-slate-100 text-slate-600'
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

function DistributionBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-500 w-24 flex-shrink-0">{label}</span>
      <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-slate-600 w-10 text-right">{value}</span>
      <span className="text-xs text-slate-400 w-10">{pct.toFixed(0)}%</span>
    </div>
  )
}

export default function TeachersClient() {
  const [teachers, setTeachers] = useState<TeacherRow[]>([])
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, total_pages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null)

  const fetchTeachers = useCallback(async (page: number = 1) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '20')
      if (search) params.set('q', search)
      if (statusFilter) params.set('status_pegawai', statusFilter)

      const result = await safeFetch<{ data: TeacherRow[]; pagination: Pagination }>(`/api/v2/teachers?${params}`)
      setTeachers(result.data || [])
      setPagination(result.pagination)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTeachers(1)
  }, [statusFilter, fetchTeachers])

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchTeachers(1)
    }, 400)
    return () => clearTimeout(timeout)
  }, [search, fetchTeachers])

  const totalTeachers = pagination.total
  const certified = teachers.filter(t => t.sertifikasi === 'sudah' || t.sertifikasi === 'ada').length
  const pendingCert = teachers.filter(t => t.sertifikasi === 'proses' || t.sertifikasi === 'belum').length
  const retiringSoon = teachers.filter(t => {
    if (!t.tanggal_bup) return false
    const bup = new Date(t.tanggal_bup)
    const now = new Date()
    const diffMonths = (bup.getFullYear() - now.getFullYear()) * 12 + (bup.getMonth() - now.getMonth())
    return diffMonths >= 0 && diffMonths <= 12
  }).length

  const statusCounts: Record<string, number> = {}
  teachers.forEach(t => {
    const s = t.status_pegawai || 'unknown'
    statusCounts[s] = (statusCounts[s] || 0) + 1
  })

  const certCount = teachers.filter(t => t.sertifikasi === 'sudah' || t.sertifikasi === 'ada').length
  const noCertCount = teachers.filter(t => !t.sertifikasi || t.sertifikasi === 'belum' || t.sertifikasi === 'tidak').length

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Guru & Tendik Analytics</h1>
          <p className="page-subtitle">Analisis data guru dan tenaga kependidikan Kecamatan Lemahabang</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge bg-primary/10 text-primary">
            {pagination.total} Guru & Tendik
          </span>
        </div>
      </div>

      {error && (
        <div className="card p-12 text-center mb-6">
          <AlertCircle className="w-12 h-12 text-danger mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Gagal Memuat Data</h2>
          <p className="text-slate-500 text-sm">{error}</p>
          <button onClick={() => fetchTeachers(1)} className="btn btn-primary mt-4">Coba Lagi</button>
        </div>
      )}

      {!error && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="kpi-value text-primary">{loading ? '-' : totalTeachers.toLocaleString()}</div>
                <div className="kpi-label mt-1">Total Guru & Tendik</div>
              </div>
              <div className="p-3 rounded-xl bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="kpi-value text-success">{loading ? '-' : certified}</div>
                <div className="kpi-label mt-1">Tersertifikasi</div>
              </div>
              <div className="p-3 rounded-xl bg-green-50">
                <Award className="w-5 h-5 text-success" />
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="kpi-value text-warning">{loading ? '-' : pendingCert}</div>
                <div className="kpi-label mt-1">Sertifikasi Tertunda</div>
              </div>
              <div className="p-3 rounded-xl bg-yellow-50">
                <FileText className="w-5 h-5 text-warning" />
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="kpi-value text-danger">{loading ? '-' : retiringSoon}</div>
                <div className="kpi-label mt-1">Akan Pensiun (&le;12 bln)</div>
              </div>
              <div className="p-3 rounded-xl bg-red-50">
                <Clock className="w-5 h-5 text-danger" />
              </div>
            </div>
          </div>
        </div>
      )}

      {!error && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Status Kepegawaian</h3>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="skeleton h-6 w-full" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <DistributionBar
                    key={status}
                    label={status.replace(/_/g, ' ')}
                    value={count}
                    total={teachers.length}
                    color={
                      status === 'pns' ? 'bg-blue-500' :
                      status === 'pppk' ? 'bg-green-500' :
                      status === 'honorer' ? 'bg-yellow-500' :
                      'bg-purple-500'
                    }
                  />
                ))}
              </div>
            )}
          </div>
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Sertifikasi</h3>
            {loading ? (
              <div className="space-y-2">
                {[1, 2].map(i => <div key={i} className="skeleton h-6 w-full" />)}
              </div>
            ) : (
              <div className="space-y-3">
                <DistributionBar label="Tersertifikasi" value={certCount} total={teachers.length} color="bg-green-500" />
                <DistributionBar label="Belum Sertifikasi" value={noCertCount} total={teachers.length} color="bg-slate-400" />
              </div>
            )}
          </div>
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Ringkasan</h3>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton h-4 w-full" />)}
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total halaman</span>
                  <span className="font-semibold">{pagination.total_pages}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Rata-rata per halaman</span>
                  <span className="font-semibold">{pagination.limit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sertifikasi rate</span>
                  <span className="font-semibold">
                    {teachers.length > 0 ? ((certCount / teachers.length) * 100).toFixed(0) : 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Akan pensiun</span>
                  <span className="font-semibold text-danger">{retiringSoon}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!error && (
        <>
          <div className="card mb-6">
            <div className="p-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama, NIK, atau NIP..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="input pl-9"
                />
              </div>
              <div className="relative w-full sm:w-48">
                <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="input pl-9 select"
                >
                  <option value="">Semua Status</option>
                  <option value="pns">PNS</option>
                  <option value="pppk">PPPK</option>
                  <option value="honorer">Honorer</option>
                  <option value="non_asn">Non ASN</option>
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
          ) : teachers.length === 0 ? (
            <div className="card p-12 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-slate-500 mb-2">Tidak Ada Data Guru</h2>
              <p className="text-slate-400 text-sm">
                {search || statusFilter ? 'Tidak ditemukan guru dengan filter yang dipilih' : 'Belum ada data guru yang tersedia'}
              </p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Nama</th>
                      <th>NIK</th>
                      <th>Jabatan</th>
                      <th>Status Pegawai</th>
                      <th>Sertifikasi</th>
                      <th>Sekolah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.map(t => (
                      <tr
                        key={t.id}
                        className="cursor-pointer"
                        onClick={() => setSelectedTeacherId(t.id)}
                      >
                        <td>
                          <div className="font-medium text-slate-800">{t.nama}</div>
                        </td>
                        <td className="font-mono text-sm text-slate-500">{t.nik}</td>
                        <td className="text-sm text-slate-600">{t.jabatan || '-'}</td>
                        <td>
                          <span className={cn("badge text-[11px]", getStatusPegawaiColor(t.status_pegawai))}>
                            {t.status_pegawai?.replace(/_/g, ' ') || '-'}
                          </span>
                        </td>
                        <td>
                          {t.sertifikasi === 'sudah' || t.sertifikasi === 'ada' ? (
                            <span className="badge bg-green-50 text-green-700 text-[11px] flex items-center gap-1">
                              <Award className="w-3 h-3" />
                              Tersertifikasi
                            </span>
                          ) : t.sertifikasi === 'proses' ? (
                            <span className="badge bg-yellow-50 text-yellow-700 text-[11px]">
                              Dalam Proses
                            </span>
                          ) : (
                            <span className="badge bg-slate-100 text-slate-500 text-[11px]">
                              Belum
                            </span>
                          )}
                        </td>
                        <td className="text-sm text-slate-500 max-w-[200px] truncate">
                          {t.school_nama || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={pagination.page} totalPages={pagination.total_pages} onChange={fetchTeachers} />
            </div>
          )}
        </>
      )}

      {selectedTeacherId && (
        <TeacherDetailModal
          teacherId={selectedTeacherId}
          onClose={() => setSelectedTeacherId(null)}
        />
      )}
    </div>
  )
}
