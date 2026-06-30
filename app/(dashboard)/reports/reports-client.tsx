'use client'

import { useState, useEffect } from 'react'
import {
  Calendar, FileSpreadsheet, BarChart3, Map, Award, AlertTriangle,
  Download, Eye, FileText, AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface School {
  id: string
  nama: string
  npsn: string
  jenjang: string
  status: string
  desa: string
}

interface GenerateResponse {
  success: boolean
  data: {
    type: string
    format: string
    school_id: string | null
    tahun_pelajaran: string | null
    generatedAt: string
    summary: {
      totalSchools: number
      totalStudents: number
      totalTeachers: number
      sdSchools: number
      tkSchools: number
      kbSchools: number
    }
    schools: School[]
    downloadUrl: string
  }
}

interface ReportHistory {
  id: string
  type: string
  format: string
  school_id: string | null
  school_nama: string | null
  tahun_pelajaran: string | null
  generatedAt: string
  summary: Record<string, unknown>
}

const REPORT_TYPES = [
  { key: 'monthly', label: 'Bulanan', description: 'Laporan bulanan data pokok pendidikan', icon: Calendar },
  { key: 'semester', label: 'Semester', description: 'Laporan semester ganjil/genap', icon: FileSpreadsheet },
  { key: 'annual', label: 'Tahunan', description: 'Laporan tahunan profil pendidikan', icon: BarChart3 },
  { key: 'gis', label: 'Peta GIS', description: 'Peta sebaran sekolah dan fasilitas', icon: Map },
  { key: 'certification', label: 'Sertifikasi', description: 'Rekapitulasi sertifikasi guru', icon: Award },
  { key: 'shortage', label: 'Kekurangan Guru', description: 'Analisis kekurangan guru per sekolah', icon: AlertTriangle },
]

const FORMATS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'excel', label: 'Excel (XLSX)' },
  { value: 'csv', label: 'CSV' },
]

function loadHistory(): ReportHistory[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem('report_history')
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveToHistory(entry: ReportHistory) {
  const history = loadHistory()
  history.unshift(entry)
  if (history.length > 50) history.length = 50
  localStorage.setItem('report_history', JSON.stringify(history))
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function getTypeIcon(type: string) {
  const t = REPORT_TYPES.find(r => r.key === type)
  return t?.icon || FileText
}

function getTypeLabel(type: string) {
  const t = REPORT_TYPES.find(r => r.key === type)
  return t?.label || type
}

export default function ReportsClient() {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [format, setFormat] = useState('pdf')
  const [schoolId, setSchoolId] = useState('')
  const [tahunPelajaran, setTahunPelajaran] = useState('2026/2027')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GenerateResponse['data'] | null>(null)
  const [history, setHistory] = useState<ReportHistory[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [previewReport, setPreviewReport] = useState<ReportHistory | null>(null)

  const fetchSchools = async () => {
    try {
      const res = await fetch('/api/v2/schools')
      const json = await res.json()
      if (json.success) setSchools(json.data || [])
    } catch {}
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistory(loadHistory())
    fetchSchools()
  }, [])

  const handleGenerate = async () => {
    if (!selectedType) return
    setGenerating(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/v2/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          format,
          school_id: schoolId || undefined,
          tahun_pelajaran: tahunPelajaran || undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setResult(json.data)
        const schoolNama = schoolId ? schools.find(s => s.id === schoolId)?.nama || null : null
        const entry: ReportHistory = {
          id: crypto.randomUUID(),
          type: selectedType,
          format,
          school_id: schoolId || null,
          school_nama: schoolNama,
          tahun_pelajaran: tahunPelajaran || null,
          generatedAt: json.data.generatedAt,
          summary: json.data.summary,
        }
        saveToHistory(entry)
        setHistory(loadHistory())
      } else {
        setError(json.error || 'Gagal generate laporan')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setGenerating(false)
    }
  }

  const isFormValid = selectedType && format

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Report Center</h1>
          <p className="page-subtitle">Generate dan unduh laporan pendidikan Kecamatan Lemahabang</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge bg-primary/10 text-primary">
            {history.length} Laporan
          </span>
        </div>
      </div>

      {error && (
        <div className="card p-4 mb-6 flex items-center gap-3 bg-red-50 border border-red-200">
          <AlertCircle className="w-5 h-5 text-danger flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {REPORT_TYPES.map(rt => {
          const Icon = rt.icon
          const isActive = selectedType === rt.key
          return (
            <button
              key={rt.key}
              onClick={() => { setSelectedType(rt.key); setResult(null) }}
              className={cn(
                'card p-4 text-left transition-all border-2',
                isActive ? 'ring-2 ring-primary/30 border-primary' : 'border-slate-200 hover:border-slate-300',
              )}
            >
              <div className={cn(
                'p-2 rounded-lg w-fit mb-2',
                isActive ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500',
              )}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-sm font-semibold text-slate-800">{rt.label}</div>
              <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{rt.description}</div>
            </button>
          )
        })}
      </div>

      {selectedType && (
        <div className="card p-5 mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Konfigurasi Laporan</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Format File</label>
              <select value={format} onChange={e => setFormat(e.target.value)} className="input select">
                {FORMATS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Sekolah</label>
              <select value={schoolId} onChange={e => setSchoolId(e.target.value)} className="input select">
                <option value="">Semua Sekolah</option>
                {schools.map(s => (
                  <option key={s.id} value={s.id}>{s.nama} ({s.jenjang.toUpperCase()})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Tahun Pelajaran</label>
              <input
                type="text"
                value={tahunPelajaran}
                onChange={e => setTahunPelajaran(e.target.value)}
                placeholder="2026/2027"
                className="input"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleGenerate}
                disabled={!isFormValid || generating}
                className="btn btn-primary flex items-center gap-2 w-full"
              >
                {generating ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {generating ? 'Menggenerate...' : 'Generate Laporan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="card p-5 mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Ringkasan Laporan</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
              <div className="text-xs text-slate-500">Total Sekolah</div>
              <div className="text-lg font-bold text-slate-800">{result.summary.totalSchools}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                SD: {result.summary.sdSchools} | TK: {result.summary.tkSchools} | KB: {result.summary.kbSchools}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-green-50 border border-green-200">
              <div className="text-xs text-slate-500">Total Siswa</div>
              <div className="text-lg font-bold text-slate-800">{result.summary.totalStudents.toLocaleString()}</div>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
              <div className="text-xs text-slate-500">Total Guru & Tendik</div>
              <div className="text-lg font-bold text-slate-800">{result.summary.totalTeachers.toLocaleString()}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-500">Tipe / Format</div>
              <div className="text-lg font-bold text-slate-800 capitalize">{result.type}</div>
              <div className="text-[11px] text-slate-400 mt-0.5 uppercase">{result.format}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>Dibuat: {formatDate(result.generatedAt)}</span>
            {result.tahun_pelajaran && <span>TP: {result.tahun_pelajaran}</span>}
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">Riwayat Laporan</h3>
          <span className="text-xs text-slate-400">{history.length} laporan</span>
        </div>
        {history.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-500 mb-2">Belum Ada Laporan</h2>
            <p className="text-slate-400 text-sm">Generate laporan pertama Anda dari panel di atas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Tipe</th>
                  <th>Format</th>
                  <th>Sekolah</th>
                  <th>Tahun Pelajaran</th>
                  <th>Dibuat</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {history.map(entry => {
                  const Icon = getTypeIcon(entry.type)
                  return (
                    <tr key={entry.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-medium text-slate-700">{getTypeLabel(entry.type)}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-slate-100 text-slate-600 uppercase text-[11px]">{entry.format}</span>
                      </td>
                      <td className="text-sm text-slate-500 max-w-[200px] truncate">
                        {entry.school_nama || 'Semua Sekolah'}
                      </td>
                      <td className="text-sm text-slate-500">{entry.tahun_pelajaran || '-'}</td>
                      <td className="text-sm text-slate-500">{formatDate(entry.generatedAt)}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setPreviewReport(entry)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
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

      {previewReport && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setPreviewReport(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Preview Laporan</h3>
              <button onClick={() => setPreviewReport(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500 text-xs">Tipe</span>
                  <p className="font-medium text-slate-800">{getTypeLabel(previewReport.type)}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-xs">Format</span>
                  <p className="font-medium text-slate-800 uppercase">{previewReport.format}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-xs">Sekolah</span>
                  <p className="font-medium text-slate-800">{previewReport.school_nama || 'Semua Sekolah'}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-xs">Tahun Pelajaran</span>
                  <p className="font-medium text-slate-800">{previewReport.tahun_pelajaran || '-'}</p>
                </div>
              </div>
              {previewReport.summary && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="text-xs font-semibold text-slate-600 mb-2">Ringkasan</h4>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-lg font-bold text-slate-800">{Number(previewReport.summary.totalSchools) || 0}</div>
                      <div className="text-[11px] text-slate-500">Sekolah</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-slate-800">{Number(previewReport.summary.totalStudents).toLocaleString() || 0}</div>
                      <div className="text-[11px] text-slate-500">Siswa</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-slate-800">{Number(previewReport.summary.totalTeachers).toLocaleString() || 0}</div>
                      <div className="text-[11px] text-slate-500">Guru</div>
                    </div>
                  </div>
                </div>
              )}
              <div className="text-xs text-slate-400">
                Dibuat: {formatDate(previewReport.generatedAt)}
              </div>
            </div>
            <div className="p-4 border-t border-border flex justify-end gap-2">
              <button onClick={() => setPreviewReport(null)} className="btn btn-ghost text-sm">Tutup</button>
              <button className="btn btn-primary text-sm flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
