'use client'

import { useState, useEffect, useCallback } from 'react'
import { safeFetch } from '@/lib/safe-fetch'
import {
  Award, Search, ChevronLeft, ChevronRight, SlidersHorizontal,
  AlertCircle, FileText, CheckCircle2, UserCheck, DollarSign,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CertificationRow {
  id: string
  teacher_id: string
  teacher_nama: string
  teacher_nik: string
  school_nama: string
  jenis_sertifikasi: string
  nomor_sertifikat?: string
  tahun_sertifikasi?: number
  penerbit?: string
  status: string
  file_url?: string
  catatan?: string
  created_at: number
}

interface Pagination {
  total: number
  page: number
  limit: number
  total_pages: number
}

const STAGES = [
  { key: 'submission', label: 'Pengajuan', icon: FileText, color: 'text-blue-600 bg-blue-100' },
  { key: 'verification', label: 'Verifikasi', icon: Search, color: 'text-purple-600 bg-purple-100' },
  { key: 'validation', label: 'Validasi', icon: CheckCircle2, color: 'text-indigo-600 bg-indigo-100' },
  { key: 'approval', label: 'Persetujuan', icon: UserCheck, color: 'text-orange-600 bg-orange-100' },
  { key: 'disbursement', label: 'Pencairan', icon: DollarSign, color: 'text-green-600 bg-green-100' },
]

const STATUS_LABELS: Record<string, string> = {
  submission: 'Pengajuan',
  verification: 'Verifikasi',
  validation: 'Validasi',
  approval: 'Persetujuan',
  disbursement: 'Pencairan',
  completed: 'Selesai',
  rejected: 'Ditolak',
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    submission: 'bg-blue-50 text-blue-700',
    verification: 'bg-purple-50 text-purple-700',
    validation: 'bg-indigo-50 text-indigo-700',
    approval: 'bg-orange-50 text-orange-700',
    disbursement: 'bg-green-50 text-green-700',
    completed: 'bg-emerald-50 text-emerald-700',
    rejected: 'bg-red-50 text-red-700',
  }
  return colors[status] || 'bg-slate-100 text-slate-600'
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

export default function CertificationClient() {
  const [certifications, setCertifications] = useState<CertificationRow[]>([])
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, total_pages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const fetchCertifications = useCallback(async (page: number = 1) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '20')
      if (search) params.set('q', search)
      if (statusFilter) params.set('status', statusFilter)

      const result = await safeFetch<{ certifications: CertificationRow[]; pagination: Pagination }>(`/api/v2/certification?${params}`)
      setCertifications(result.certifications || [])
      setPagination(result.pagination)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCertifications(1)
  }, [fetchCertifications])

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchCertifications(1)
    }, 400)
    return () => clearTimeout(timeout)
  }, [search, fetchCertifications])

  const stageCounts: Record<string, number> = {}
  certifications.forEach(c => {
    const s = c.status || 'submission'
    stageCounts[s] = (stageCounts[s] || 0) + 1
  })

  const bottleneck = STAGES.reduce((max, stage) =>
    (stageCounts[stage.key] || 0) > (stageCounts[max.key] || 0) ? stage : max
  , STAGES[0])

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Monitoring Sertifikasi</h1>
          <p className="page-subtitle">Pipeline sertifikasi guru Kecamatan Lemahabang</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge bg-primary/10 text-primary">
            {pagination.total} Sertifikasi
          </span>
        </div>
      </div>

      {error && (
        <div className="card p-12 text-center mb-6">
          <AlertCircle className="w-12 h-12 text-danger mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Gagal Memuat Data</h2>
          <p className="text-slate-500 text-sm">{error}</p>
          <button onClick={() => fetchCertifications(1)} className="btn btn-primary mt-4">Coba Lagi</button>
        </div>
      )}

      {!error && (
        <>
          <div className="card p-5 mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Pipeline Sertifikasi</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {STAGES.map(stage => {
                const count = stageCounts[stage.key] || 0
                const Icon = stage.icon
                const isBottleneck = bottleneck.key === stage.key && count > 0
                return (
                  <div
                    key={stage.key}
                    className={cn(
                      "p-4 rounded-xl border-2 text-center transition-all",
                      isBottleneck
                        ? "border-danger bg-red-50"
                        : "border-slate-200 bg-slate-50"
                    )}
                  >
                    <div className={cn("p-2 rounded-lg w-fit mx-auto mb-2", stage.color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className={cn("text-2xl font-bold", isBottleneck && "text-danger")}>
                      {loading ? '-' : count}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{stage.label}</div>
                    {isBottleneck && (
                      <div className="text-[10px] text-danger font-medium mt-1">Hambatan!</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="card mb-6">
            <div className="p-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama guru..."
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
                  <option value="submission">Pengajuan</option>
                  <option value="verification">Verifikasi</option>
                  <option value="validation">Validasi</option>
                  <option value="approval">Persetujuan</option>
                  <option value="disbursement">Pencairan</option>
                  <option value="completed">Selesai</option>
                  <option value="rejected">Ditolak</option>
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
          ) : certifications.length === 0 ? (
            <div className="card p-12 text-center">
              <Award className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-slate-500 mb-2">Tidak Ada Data Sertifikasi</h2>
              <p className="text-slate-400 text-sm">
                {search || statusFilter ? 'Tidak ditemukan sertifikasi dengan filter yang dipilih' : 'Belum ada data sertifikasi yang tersedia'}
              </p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Guru</th>
                      <th>Jenis Sertifikasi</th>
                      <th>Tahun</th>
                      <th>Penerbit</th>
                      <th>Status</th>
                      <th>Sekolah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certifications.map(cert => (
                      <tr key={cert.id} className="hover:bg-slate-50">
                        <td>
                          <div className="font-medium text-slate-800">{cert.teacher_nama}</div>
                          <div className="text-xs font-mono text-slate-400">{cert.teacher_nik}</div>
                        </td>
                        <td className="text-sm text-slate-600">{cert.jenis_sertifikasi}</td>
                        <td className="text-sm text-slate-600">{cert.tahun_sertifikasi || '-'}</td>
                        <td className="text-sm text-slate-600">{cert.penerbit || '-'}</td>
                        <td>
                          <span className={cn("badge text-[11px]", getStatusColor(cert.status))}>
                            {STATUS_LABELS[cert.status] || cert.status}
                          </span>
                        </td>
                        <td className="text-sm text-slate-500 max-w-[180px] truncate">
                          {cert.school_nama || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={pagination.page} totalPages={pagination.total_pages} onChange={fetchCertifications} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
