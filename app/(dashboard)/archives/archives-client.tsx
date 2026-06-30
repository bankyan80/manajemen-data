'use client'

import { useState, useEffect, useCallback } from 'react'
import { safeFetch } from '@/lib/safe-fetch'
import {
  Archive, Search, ChevronLeft, ChevronRight, SlidersHorizontal,
  AlertCircle, FileText, Download, Eye, Upload,
  File, Image, FileSpreadsheet,
} from 'lucide-react'
import { cn, formatDate, formatBytes } from '@/lib/utils'

interface ArchiveRow {
  id: string
  category: string
  document_type: string
  file_name: string
  file_type: string
  file_size: number
  file_url?: string
  deskripsi?: string
  uploaded_by?: string
  uploaded_at: number
  school_nama?: string
}

interface Pagination {
  total: number
  page: number
  limit: number
  total_pages: number
}

const CATEGORIES = [
  { key: 'akreditasi', label: 'Akreditasi', icon: Award },
  { key: 'bos', label: 'BOS', icon: DollarSign },
  { key: 'dokumen_guru', label: 'Dokumen Guru', icon: Users },
  { key: 'profil_sekolah', label: 'Profil Sekolah', icon: School },
  { key: 'laporan_infrastruktur', label: 'Laporan Infrastruktur', icon: Building2 },
]

function getFileIcon(mimeType: string) {
  if (mimeType.includes('pdf')) return FileText
  if (mimeType.includes('image')) return Image
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return FileSpreadsheet
  return File
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

export default function ArchivesClient() {
  const [archives, setArchives] = useState<ArchiveRow[]>([])
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, total_pages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const fetchArchives = useCallback(async (page: number = 1) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '20')
      if (search) params.set('q', search)
      if (categoryFilter) params.set('category', categoryFilter)

      const result = await safeFetch<{ data: ArchiveRow[]; pagination: Pagination }>(`/api/v2/archives?${params}`)
      setArchives(result.data || [])
      setPagination(result.pagination)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }, [search, categoryFilter])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchArchives(1)
  }, [categoryFilter, fetchArchives])

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchArchives(1)
    }, 400)
    return () => clearTimeout(timeout)
  }, [search, fetchArchives])

  const handleUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        alert(`Unggah "${file.name}" — fitur upload akan diimplementasikan di tahap berikutnya`)
      }
    }
    input.click()
  }

  const categoryCounts: Record<string, number> = {}
  archives.forEach(a => {
    const c = a.category || 'lainnya'
    categoryCounts[c] = (categoryCounts[c] || 0) + 1
  })

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Arsip Digital</h1>
          <p className="page-subtitle">Dokumen digital sekolah Kecamatan Lemahabang</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleUpload} className="btn btn-primary flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Unggah Dokumen
          </button>
        </div>
      </div>

      {error && (
        <div className="card p-12 text-center mb-6">
          <AlertCircle className="w-12 h-12 text-danger mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Gagal Memuat Data</h2>
          <p className="text-slate-500 text-sm">{error}</p>
          <button onClick={() => fetchArchives(1)} className="btn btn-primary mt-4">Coba Lagi</button>
        </div>
      )}

      {!error && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon
              const count = categoryCounts[cat.key] || 0
              return (
                <button
                  key={cat.key}
                  onClick={() => {
                    setSelectedCategory(selectedCategory === cat.key ? null : cat.key)
                    setCategoryFilter(selectedCategory === cat.key ? '' : cat.key)
                  }}
                  className={cn(
                    "card p-4 text-center cursor-pointer transition-all hover:shadow-md",
                    selectedCategory === cat.key && "ring-2 ring-primary"
                  )}
                >
                  <div className="p-2 rounded-lg bg-primary/10 w-fit mx-auto mb-2">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-xs font-medium text-slate-700">{cat.label}</div>
                  <div className="text-xs text-slate-400 mt-1">{count} dokumen</div>
                </button>
              )
            })}
          </div>

          <div className="card mb-6">
            <div className="p-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama dokumen..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="input pl-9"
                />
              </div>
              <div className="relative w-full sm:w-48">
                <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="input pl-9 select"
                >
                  <option value="">Semua Kategori</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat.key} value={cat.key}>{cat.label}</option>
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
          ) : archives.length === 0 ? (
            <div className="card p-12 text-center">
              <Archive className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-slate-500 mb-2">Tidak Ada Dokumen</h2>
              <p className="text-slate-400 text-sm">
                {search || categoryFilter ? 'Tidak ditemukan dokumen dengan filter yang dipilih' : 'Belum ada dokumen yang diunggah'}
              </p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Nama Dokumen</th>
                      <th>Kategori</th>
                      <th>Tipe</th>
                      <th>Ukuran</th>
                      <th>Tanggal Upload</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {archives.map(doc => {
                      const FileIcon = getFileIcon(doc.file_type)
                      return (
                        <tr key={doc.id} className="hover:bg-slate-50">
                          <td>
                            <div className="flex items-center gap-2">
                              <FileIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                              <div>
                                <div className="font-medium text-slate-800">{doc.file_name}</div>
                                {doc.deskripsi && (
                                  <div className="text-xs text-slate-400 truncate max-w-[250px]">
                                    {doc.deskripsi}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-slate-100 text-slate-600 text-[11px]">
                              {doc.category?.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="text-sm text-slate-500 font-mono">{doc.file_type?.split('/')[1] || doc.file_type}</td>
                          <td className="text-sm text-slate-500">{formatBytes(doc.file_size)}</td>
                          <td className="text-sm text-slate-500">{formatDate(doc.uploaded_at)}</td>
                          <td>
                            <div className="flex items-center gap-1">
                              {doc.file_url && (
                                <a
                                  href={doc.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-primary"
                                >
                                  <Eye className="w-4 h-4" />
                                </a>
                              )}
                              {doc.file_url && (
                                <a
                                  href={doc.file_url}
                                  download
                                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-primary"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination page={pagination.page} totalPages={pagination.total_pages} onChange={fetchArchives} />
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Award(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  )
}

function DollarSign(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  )
}

function Users(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <path d="M20 8v6" />
      <path d="M23 11h-6" />
    </svg>
  )
}

function School(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5a3 3 0 003 3h6a3 3 0 003-3v-5" />
    </svg>
  )
}

function Building2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18" />
      <path d="M6 12H4a2 2 0 00-2 2v6a2 2 0 002 2h2" />
      <path d="M18 12h2a2 2 0 012 2v6a2 2 0 01-2 2h-2" />
      <path d="M8 7h.01M12 7h.01M16 7h.01M10 18h4" />
    </svg>
  )
}
