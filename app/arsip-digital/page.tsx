'use client'

import { useState, useCallback, useEffect } from 'react'
import AppShellTopbar from '@/components/layout/AppShellTopbar'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useData, fetchJson } from '@/lib/useData'
import { Search, Download, Eye, Edit3, Trash2, Upload, X, FileText, FileImage, FileSpreadsheet, FileArchive, Plus, Loader2, Link } from 'lucide-react'

const TABS = ['Dokumen Pegawai', 'Dokumen Sekolah', 'Dokumen Persuratan', 'Dokumen Lainnya', 'Riwayat Upload']
const MODULE_MAP: Record<string, string> = { 'Dokumen Pegawai': 'pegawai', 'Dokumen Sekolah': 'sekolah', 'Dokumen Persuratan': 'surat', 'Dokumen Lainnya': 'lainnya', 'Riwayat Upload': '' }

const JENIS_PEGAWAI = [
  'KTP', 'KK', 'NPWP', 'BPJS', 'SK CPNS', 'SK PNS', 'SK Pangkat',
  'SK Jabatan', 'SK Berkala', 'Karpeg', 'Taspen', 'Kartu ASN',
  'Ijazah', 'Sertifikat', 'Dokumen Lainnya',
]

const FILE_ICONS: Record<string, any> = {
  'application/pdf': FileText,
  'image/jpeg': FileImage,
  'image/png': FileImage,
  'application/msword': FileText,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': FileText,
  'application/vnd.ms-excel': FileSpreadsheet,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': FileSpreadsheet,
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function ArsipDigitalPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(0)
  const [search, setSearch] = useState('')
  const [filterJenis, setFilterJenis] = useState('')
  const [filterTahun, setFilterTahun] = useState('')
  const [page, setPage] = useState(1)
  const [showUpload, setShowUpload] = useState(false)
  const [showImportLink, setShowImportLink] = useState(false)
  const [uploadForm, setUploadForm] = useState({ module_type: 'pegawai', category: '', document_type: '', employee_id: '', school_id: '', deskripsi: '' })
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [importLinks, setImportLinks] = useState('')
  const [importForm, setImportForm] = useState({ module_type: 'pegawai', category: '', document_type: '', employee_id: '', school_id: '', deskripsi: '', auto_map: false })
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ summary?: { total: number; success: number; failed: number }; results?: any[] } | null>(null)
  const [previewDoc, setPreviewDoc] = useState<any | null>(null)
  const [editDoc, setEditDoc] = useState<any | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [employees, setEmployees] = useState<any[]>([])
  const [schools, setSchools] = useState<any[]>([])
  const limit = 20

  useEffect(() => { fetchJson<any[]>('/api/employees').then(setEmployees).catch(() => {}) }, [])
  useEffect(() => { fetchJson<any[]>('/api/schools').then(setSchools).catch(() => {}) }, [])

  const moduleType = activeTab < 4 ? MODULE_MAP[TABS[activeTab]] : ''

  const { data: arsipData, loading, error, mutate } = useData<any>(
    `arsip-${moduleType}-${filterJenis}-${filterTahun}-${search}-${page}-${refreshKey}`,
    () => {
      const p = new URLSearchParams()
      if (moduleType) p.set('module_type', moduleType)
      if (filterJenis) p.set('document_type', filterJenis)
      if (filterTahun) p.set('tahun', filterTahun)
      if (search) p.set('q', search)
      p.set('page', String(page))
      p.set('limit', String(limit))
      return fetchJson(`/api/arsip-digital?${p.toString()}`)
    }
  )

  const handleSearch = useCallback((val: string) => { setSearch(val); setPage(1) }, [])
  const changeTab = (i: number) => { setActiveTab(i); setPage(1); setFilterJenis(''); setFilterTahun('') }

  if (status === 'loading') return <div className="p-8 text-center text-zinc-500">Memuat...</div>
  if (!session) { router.push('/login'); return null }

  const role = (session?.user as any)?.role
  const rows = arsipData?.data || []
  const stats = arsipData?.stats
  const pagination = arsipData?.pagination
  const isPegawai = moduleType === 'pegawai' || (!moduleType && activeTab < 4)

  const handleUpload = async () => {
    if (!uploadFile || !uploadForm.category || !uploadForm.document_type) return alert('Lengkapi form upload')
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('file', uploadFile)
      fd.append('module_type', uploadForm.module_type)
      fd.append('category', uploadForm.category)
      fd.append('document_type', uploadForm.document_type)
      if (uploadForm.employee_id) fd.append('employee_id', uploadForm.employee_id)
      if (uploadForm.school_id) fd.append('school_id', uploadForm.school_id)
      if (uploadForm.deskripsi) fd.append('deskripsi', uploadForm.deskripsi)
      const res = await fetch('/api/arsip-digital', { method: 'POST', body: fd })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Gagal upload') }
      setShowUpload(false)
      setUploadFile(null)
      setUploadForm({ module_type: 'pegawai', category: '', document_type: '', employee_id: '', school_id: '', deskripsi: '' })
      setRefreshKey(k => k + 1)
    } catch (err: any) {
      alert('Gagal: ' + err.message)
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus arsip ini?')) return
    try {
      const res = await fetch(`/api/arsip-digital/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal hapus')
      setRefreshKey(k => k + 1)
    } catch (err: any) { alert('Gagal: ' + err.message) }
  }

  const handleEditSave = async () => {
    if (!editDoc) return
    try {
      const res = await fetch(`/api/arsip-digital/${editDoc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: editDoc.category, document_type: editDoc.document_type, deskripsi: editDoc.deskripsi }),
      })
      if (!res.ok) throw new Error('Gagal update')
      setEditDoc(null)
      setRefreshKey(k => k + 1)
    } catch (err: any) { alert('Gagal: ' + err.message) }
  }

  const previewFile = (doc: any) => {
    setPreviewDoc(doc)
  }

  const downloadFile = (doc: any) => {
    if (doc.storage === 'blob' && doc.file_url) {
      window.open(doc.file_url, '_blank')
    } else if (doc.storage === 'drive' && doc.drive_url) {
      window.open(doc.drive_url, '_blank')
    } else {
      window.open(`/api/arsip-digital/${doc.id}/file`, '_blank')
    }
  }

  const isImage = (type: string) => type.startsWith('image/')
  const isPdf = (type: string) => type === 'application/pdf'

  return (
    <AppShellTopbar>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">Arsip Digital</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => { setShowImportLink(true); setImportResult(null); setImportLinks('') }} className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg text-sm hover:bg-blue-50 flex items-center gap-2">
              <Link className="w-4 h-4" /> Import Link
            </button>
            <button onClick={() => setShowUpload(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2">
              <Upload className="w-4 h-4" /> Upload Arsip
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total Arsip', value: stats?.totalArsip ?? '-', color: 'text-blue-700' },
            { label: 'Dok. Pegawai', value: stats?.totalPegawai ?? '-', color: 'text-indigo-700' },
            { label: 'Dok. Sekolah', value: stats?.totalSekolah ?? '-', color: 'text-emerald-700' },
            { label: 'Dok. Persuratan', value: stats?.totalSurat ?? '-', color: 'text-amber-700' },
            { label: 'Dok. Lainnya', value: stats?.totalLainnya ?? '-', color: 'text-purple-700' },
            { label: 'Storage', value: stats?.totalBytes ? formatBytes(stats.totalBytes) : '-', color: 'text-cyan-700' },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4 text-center">
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              <p className="text-xs text-zinc-500 mt-1">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 bg-zinc-100 p-1 rounded-lg">
          {TABS.map((tab, i) => (
            <button key={i} onClick={() => changeTab(i)} className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${activeTab === i ? 'bg-white text-blue-700 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}>{tab}</button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="text-xs text-zinc-500 mb-1 block">Cari Dokumen</label>
              <input value={search} onChange={e => handleSearch(e.target.value)} placeholder="Cari nama file, jenis dokumen..." className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm" />
            </div>
            {isPegawai && (
              <div className="min-w-[140px]">
                <label className="text-xs text-zinc-500 mb-1 block">Jenis Dokumen</label>
                <select value={filterJenis} onChange={e => { setFilterJenis(e.target.value); setPage(1) }} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
                  <option value="">Semua Jenis</option>
                  {JENIS_PEGAWAI.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>
            )}
            <div className="min-w-[120px]">
              <label className="text-xs text-zinc-500 mb-1 block">Tahun Upload</label>
              <select value={filterTahun} onChange={e => { setFilterTahun(e.target.value); setPage(1) }} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
                <option value="">Semua Tahun</option>
                {Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i)).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <button onClick={() => { setSearch(''); setFilterJenis(''); setFilterTahun(''); setPage(1) }} className="px-3 py-2 border border-zinc-300 rounded-lg text-sm text-zinc-600 hover:bg-zinc-50">Reset</button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4 animate-pulse">
                  {Array.from({ length: 7 }).map((_, j) => <div key={j} className="h-4 bg-zinc-200 rounded flex-1" />)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 font-medium">Gagal memuat data</p>
            <p className="text-red-500 text-sm mt-1">{error}</p>
            <button onClick={() => { setRefreshKey(k => k + 1) }} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Coba Lagi</button>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm whitespace-nowrap">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 sticky top-0 z-10">
                    <th className="px-3 py-3 text-left font-semibold text-zinc-700 w-10">No</th>
                    <th className="px-3 py-3 text-left font-semibold text-zinc-700">NIP</th>
                    <th className="px-3 py-3 text-left font-semibold text-zinc-700 min-w-[140px]">Nama Pegawai</th>
                    <th className="px-3 py-3 text-left font-semibold text-zinc-700">Jenis Dokumen</th>
                    <th className="px-3 py-3 text-left font-semibold text-zinc-700 min-w-[180px]">Nama File</th>
                    <th className="px-3 py-3 text-right font-semibold text-zinc-700">Ukuran</th>
                    <th className="px-3 py-3 text-left font-semibold text-zinc-700">Tgl Upload</th>
                    <th className="px-3 py-3 text-center font-semibold text-zinc-700">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-zinc-400">
                        {search || filterJenis || filterTahun ? 'Tidak ada arsip yang cocok' : 'Belum ada arsip digital'}
                      </td>
                    </tr>
                  ) : rows.map((row: any, idx: number) => {
                    const IconComp = FILE_ICONS[row.file_type] || FileArchive
                    return (
                      <tr key={row.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                        <td className="px-3 py-2.5 text-zinc-500">{(page - 1) * limit + idx + 1}</td>
                        <td className="px-3 py-2.5 font-mono text-xs text-zinc-600">{row.pegawai_nip || '-'}</td>
                        <td className="px-3 py-2.5 font-medium text-zinc-900">{row.pegawai_nama || row.school_nama || '-'}</td>
                        <td className="px-3 py-2.5">
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{row.document_type}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <IconComp className="w-4 h-4 text-zinc-400 shrink-0" />
                            <span className="text-zinc-700 truncate max-w-[200px] block">{row.file_name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right text-zinc-600">{formatBytes(row.file_size)}</td>
                        <td className="px-3 py-2.5 text-zinc-500 text-xs">{formatDate(row.uploaded_at)}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => previewFile(row)} className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600" title="Lihat"><Eye className="w-4 h-4" /></button>
                            <button onClick={() => downloadFile(row)} className="p-1.5 rounded-lg hover:bg-green-100 text-green-600" title="Download"><Download className="w-4 h-4" /></button>
                            <button onClick={() => setEditDoc({ ...row })} className="p-1.5 rounded-lg hover:bg-amber-100 text-amber-600" title="Edit"><Edit3 className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(row.id)} className="p-1.5 rounded-lg hover:bg-red-100 text-red-600" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {pagination && pagination.total_pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200 bg-zinc-50">
                <p className="text-xs text-zinc-500">Halaman {pagination.page} dari {pagination.total_pages}</p>
                <div className="flex gap-1">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border border-zinc-300 rounded text-xs bg-white disabled:opacity-40 hover:bg-zinc-50">Prev</button>
                  {Array.from({ length: Math.min(pagination.total_pages, 5) }).map((_, i) => {
                    const pn = pagination.total_pages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= pagination.total_pages - 2 ? pagination.total_pages - 4 + i : page - 2 + i
                    return <button key={pn} onClick={() => setPage(pn)} className={`px-3 py-1.5 border border-zinc-300 rounded text-xs ${pn === page ? 'bg-blue-600 text-white' : 'bg-white hover:bg-zinc-50'}`}>{pn}</button>
                  })}
                  <button disabled={page >= pagination.total_pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border border-zinc-300 rounded text-xs bg-white disabled:opacity-40 hover:bg-zinc-50">Next</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Upload Modal */}
        {/* Import Link Modal */}
        {showImportLink && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowImportLink(false)}>
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-lg font-bold text-zinc-900">Import Link Google Drive</h2>
                <button onClick={() => setShowImportLink(false)} className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500">&times;</button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
                  <p className="font-medium mb-1">Cara penggunaan:</p>
                  <ol className="list-decimal list-inside text-xs space-y-0.5 text-blue-700">
                    <li>Buka Google Drive dan salin link file yang ingin diimpor</li>
                    <li>Paste link (satu link per baris) di kolom di bawah</li>
                    <li>Pilih kategori, jenis dokumen, dan pegawai (untuk dok. pegawai)</li>
                    <li>Klik "Import" — sistem akan mengambil metadata file dari Drive</li>
                  </ol>
                </div>

                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Link Google Drive <span className="text-red-500">*</span></label>
                  <textarea
                    value={importLinks}
                    onChange={e => setImportLinks(e.target.value)}
                    placeholder={`https://drive.google.com/file/d/ABC123/view\nhttps://drive.google.com/open?id=XYZ789`}
                    rows={6}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm font-mono"
                  />
                  {importLinks.trim() && (
                    <p className="text-xs text-zinc-500 mt-1">
                      {importLinks.trim().split('\n').filter(Boolean).length} link terdeteksi
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Kategori Arsip</label>
                    <select value={importForm.module_type} onChange={e => setImportForm({ ...importForm, module_type: e.target.value, category: '', document_type: '' })} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
                      <option value="pegawai">Dokumen Pegawai</option>
                      <option value="sekolah">Dokumen Sekolah</option>
                      <option value="surat">Dokumen Persuratan</option>
                      <option value="lainnya">Dokumen Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Kategori Dokumen</label>
                    <select value={importForm.category} onChange={e => setImportForm({ ...importForm, category: e.target.value })} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
                      <option value="">Pilih Kategori</option>
                      {importForm.module_type === 'pegawai' && JENIS_PEGAWAI.map(j => (
                        <option key={j} value={j}>{j}</option>
                      ))}
                      {importForm.module_type === 'sekolah' && ['Akreditasi', 'Data Pokok', 'SK Pendirian', 'SK Izin', 'Sertifikat Tanah', 'Izin Mendirikan', 'RAPBS', 'Lainnya'].map(j => (
                        <option key={j} value={j}>{j}</option>
                      ))}
                      {importForm.module_type === 'surat' && ['Surat Masuk', 'Surat Keluar', 'SK', 'Nota Dinas', 'Surat Tugas', 'Lainnya'].map(j => (
                        <option key={j} value={j}>{j}</option>
                      ))}
                      {importForm.module_type === 'lainnya' && ['Laporan', 'Dokumentasi', 'Referensi', 'Lainnya'].map(j => (
                        <option key={j} value={j}>{j}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Jenis Dokumen <span className="text-red-500">*</span></label>
                    <input value={importForm.document_type} onChange={e => setImportForm({ ...importForm, document_type: e.target.value })} placeholder="Contoh: KTP, Ijazah..." className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm" />
                  </div>
                  {importForm.module_type === 'pegawai' && (
                    <div>
                      <label className="text-xs text-zinc-500 mb-1 block">Pegawai</label>
                      <select value={importForm.employee_id} onChange={e => setImportForm({ ...importForm, employee_id: e.target.value })} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
                        <option value="">Pilih Pegawai</option>
                        {employees.map((e: any) => <option key={e.id} value={e.id}>{e.nama} - {e.nip || e.nik}</option>)}
                      </select>
                    </div>
                  )}
                </div>

                {importForm.module_type === 'pegawai' && (
                  <div className="flex items-center gap-3 bg-zinc-50 rounded-xl px-4 py-3 border border-zinc-200">
                    <input
                      type="checkbox"
                      id="auto_map"
                      checked={importForm.auto_map}
                      onChange={e => setImportForm({ ...importForm, auto_map: e.target.checked })}
                      className="w-4 h-4 rounded border-zinc-300 text-blue-600"
                    />
                    <label htmlFor="auto_map" className="text-sm text-zinc-700">
                      <span className="font-medium">Auto-map folder ke pegawai</span>
                      <p className="text-xs text-zinc-400">Cocokkan nama sub-folder dengan nama pegawai & deteksi jenis dokumen dari nama file</p>
                    </label>
                  </div>
                )}

                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Deskripsi (opsional)</label>
                  <input value={importForm.deskripsi} onChange={e => setImportForm({ ...importForm, deskripsi: e.target.value })} placeholder="Keterangan tambahan untuk semua file..." className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm" />
                </div>

                {/* Import Result */}
                {importResult && (
                  <div className={`rounded-xl p-4 border ${importResult.summary?.failed ? 'border-amber-200 bg-amber-50' : 'border-green-200 bg-green-50'}`}>
                    <p className="font-semibold text-sm mb-2">
                      {importResult.summary?.success === importResult.summary?.total ? 'Semua berhasil diimport' : `Import selesai`}
                      <span className="font-normal ml-2">
                        ({importResult.summary?.success} berhasil{importResult.summary?.failed ? `, ${importResult.summary.failed} gagal` : ''} dari {importResult.summary?.total})
                      </span>
                    </p>
                    {importResult.results && (
                      <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                        {importResult.results.slice(0, 20).map((r: any, i: number) => (
                          <div key={i} className={`text-xs ${r.success ? 'text-emerald-700' : 'text-red-600'}`}>
                            <span>{r.success ? '✓' : '✗'}</span>
                            <span className="ml-1">{r.file_name || r.url.substring(0, 50)}</span>
                            {r.employee_match && <span className="ml-2 text-zinc-400">→ pegawai terdeteksi</span>}
                            {r.doc_type && <span className="ml-1 text-zinc-400">({r.doc_type})</span>}
                            {!r.success && <span className="ml-1 text-red-500">— {r.error}</span>}
                          </div>
                        ))}
                        {importResult.results.length > 20 && (
                          <p className="text-xs text-zinc-400">...dan {importResult.results.length - 20} lainnya</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2 border-t border-zinc-200">
                  <button onClick={() => setShowImportLink(false)} className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900">Tutup</button>
                  <button
                    onClick={async () => {
                      const linkList = importLinks.trim().split('\n').filter(Boolean)
                      if (linkList.length === 0) return alert('Paste minimal 1 link Google Drive')
                      if (!importForm.category || !importForm.document_type) return alert('Pilih kategori dan jenis dokumen')
                      setImporting(true)
                      setImportResult(null)
                      try {
                        const res = await fetch('/api/arsip-digital/import-links', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            links: linkList,
                            module_type: importForm.module_type,
                            category: importForm.category,
                            document_type: importForm.document_type,
                            employee_id: importForm.employee_id || undefined,
                            deskripsi: importForm.deskripsi || undefined,
                            auto_map: importForm.auto_map,
                          }),
                        })
                        const data = await res.json()
                        if (!res.ok) throw new Error(data.error || 'Gagal import')
                        setImportResult(data)
                        setRefreshKey(k => k + 1)
                      } catch (err: any) {
                        alert('Gagal: ' + err.message)
                      } finally { setImporting(false) }
                    }}
                    disabled={importing || !importLinks.trim()}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {importing && <Loader2 className="w-4 h-4 animate-spin" />}
                    {importing ? 'Mengimport...' : 'Import'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showUpload && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowUpload(false)}>
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-lg font-bold text-zinc-900">Upload Arsip Baru</h2>
                <button onClick={() => setShowUpload(false)} className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500">&times;</button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Kategori Arsip</label>
                  <select value={uploadForm.module_type} onChange={e => setUploadForm({ ...uploadForm, module_type: e.target.value, category: '', document_type: '' })} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
                    <option value="pegawai">Dokumen Pegawai</option>
                    <option value="sekolah">Dokumen Sekolah</option>
                    <option value="surat">Dokumen Persuratan</option>
                    <option value="lainnya">Dokumen Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Kategori Dokumen</label>
                  <select value={uploadForm.category} onChange={e => setUploadForm({ ...uploadForm, category: e.target.value })} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
                    <option value="">Pilih Kategori</option>
                    {uploadForm.module_type === 'pegawai' && JENIS_PEGAWAI.map(j => (
                      <option key={j} value={j}>{j}</option>
                    ))}
                    {uploadForm.module_type === 'sekolah' && ['Akreditasi', 'Data Pokok', 'SK Pendirian', 'SK Izin', 'Sertifikat Tanah', 'Izin Mendirikan', 'RAPBS', 'Lainnya'].map(j => (
                      <option key={j} value={j}>{j}</option>
                    ))}
                    {uploadForm.module_type === 'surat' && ['Surat Masuk', 'Surat Keluar', 'SK', 'Nota Dinas', 'Surat Tugas', 'Lainnya'].map(j => (
                      <option key={j} value={j}>{j}</option>
                    ))}
                    {uploadForm.module_type === 'lainnya' && ['Laporan', 'Dokumentasi', 'Referensi', 'Lainnya'].map(j => (
                      <option key={j} value={j}>{j}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Jenis Dokumen</label>
                  <input value={uploadForm.document_type} onChange={e => setUploadForm({ ...uploadForm, document_type: e.target.value })} placeholder="Contoh: KTP, Ijazah, SK CPNS..." className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm" />
                </div>
                {uploadForm.module_type === 'pegawai' && (
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Pegawai (opsional)</label>
                    <select value={uploadForm.employee_id} onChange={e => setUploadForm({ ...uploadForm, employee_id: e.target.value })} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
                      <option value="">Pilih Pegawai</option>
                      {employees.map((e: any) => <option key={e.id} value={e.id}>{e.nama} - {e.nip || e.nik}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Deskripsi (opsional)</label>
                  <input value={uploadForm.deskripsi} onChange={e => setUploadForm({ ...uploadForm, deskripsi: e.target.value })} placeholder="Keterangan tambahan..." className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">File (max 20 MB, PDF/JPG/PNG/DOC/DOCX/XLS/XLSX)</label>
                  <input type="file" onChange={e => setUploadFile(e.target.files?.[0] || null)} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200" />
                  {uploadFile && (
                    <p className="text-xs text-green-600 mt-1">{uploadFile.name} ({formatBytes(uploadFile.size)})</p>
                  )}
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setShowUpload(false)} className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900">Batal</button>
                  <button onClick={handleUpload} disabled={saving || !uploadFile} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {saving ? 'Mengupload...' : 'Upload'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {previewDoc && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setPreviewDoc(null)}>
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-lg font-bold text-zinc-900">{previewDoc.file_name}</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">{previewDoc.document_type} • {formatBytes(previewDoc.file_size)}</p>
                </div>
                <button onClick={() => setPreviewDoc(null)} className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500">&times;</button>
              </div>
              <div className="p-6">
                {isImage(previewDoc.file_type) ? (
                  <img src={previewDoc.storage === 'blob' ? previewDoc.file_url : `/api/arsip-digital/${previewDoc.id}/file`} alt={previewDoc.file_name} className="max-w-full max-h-[70vh] mx-auto rounded-lg" />
                ) : isPdf(previewDoc.file_type) ? (
                  <iframe src={`/api/arsip-digital/${previewDoc.id}/file`} className="w-full h-[70vh] rounded-lg border border-zinc-200" />
                ) : (
                  <div className="text-center py-12">
                    <FileArchive className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
                    <p className="text-zinc-500">Preview tidak tersedia untuk file ini</p>
                    <button onClick={() => downloadFile(previewDoc)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 inline-flex items-center gap-2">
                      <Download className="w-4 h-4" /> Download File
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editDoc && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setEditDoc(null)}>
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
              <div className="border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-zinc-900">Edit Metadata</h2>
                <button onClick={() => setEditDoc(null)} className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500">&times;</button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Kategori</label>
                  <input value={editDoc.category} onChange={e => setEditDoc({ ...editDoc, category: e.target.value })} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Jenis Dokumen</label>
                  <input value={editDoc.document_type} onChange={e => setEditDoc({ ...editDoc, document_type: e.target.value })} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Deskripsi</label>
                  <textarea value={editDoc.deskripsi || ''} onChange={e => setEditDoc({ ...editDoc, deskripsi: e.target.value })} rows={3} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm" />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setEditDoc(null)} className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900">Batal</button>
                  <button onClick={handleEditSave} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShellTopbar>
  )
}
