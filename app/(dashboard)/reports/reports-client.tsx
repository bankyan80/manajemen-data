'use client'

import { useState, useEffect } from 'react'
import { safeFetch } from '@/lib/safe-fetch'
import { exportPdf, exportExcel, exportCsv } from '@/lib/export-report'
import {
  Calendar, FileSpreadsheet, BarChart3, Map, Award, AlertTriangle,
  Download, Eye, FileText, AlertCircle, Users, GraduationCap,
  Building2, BookOpen, TrendingUp, Globe, CheckCircle2, XCircle,
  Loader2,
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
    details?: Record<string, unknown>
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
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
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

function DetailMonthly({ data }: { data: any }) {
  const d = data || {}
  const kelas = d.siswaPerKelas || []
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-center">
          <div className="text-xs text-slate-500">Mutasi Masuk</div>
          <div className="text-lg font-bold text-blue-700">+{d.mutasiMasuk || 0}</div>
        </div>
        <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-center">
          <div className="text-xs text-slate-500">Mutasi Keluar</div>
          <div className="text-lg font-bold text-orange-700">-{d.mutasiKeluar || 0}</div>
        </div>
      </div>
      <div className="text-xs text-slate-400 text-center">{d.periode || '-'}</div>
      {kelas.length > 0 && (
        <div className="overflow-x-auto">
          <table className="table-base text-xs">
            <thead>
              <tr><th>Jenjang</th><th>Kelas</th><th>L</th><th>P</th><th>Total</th></tr>
            </thead>
            <tbody>
              {kelas.map((k: any, i: number) => (
                <tr key={i}>
                  <td className="uppercase font-medium">{k.jenjang}</td>
                  <td>{k.kelas_kelompok}</td>
                  <td>{k.laki}</td>
                  <td>{k.perempuan}</td>
                  <td className="font-semibold">{k.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function DetailSemester({ data }: { data: any }) {
  const d = data || {}
  const recaps = d.recaps || []
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-green-50 border border-green-200">
          <div className="text-xs text-slate-500">Ganjil</div>
          <div className="text-lg font-bold text-green-700">{d.ringkasanGanjil?.total || 0}</div>
          <div className="text-[11px] text-green-600">Masuk: +{d.ringkasanGanjil?.masuk || 0} / Keluar: -{d.ringkasanGanjil?.keluar || 0}</div>
        </div>
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
          <div className="text-xs text-slate-500">Genap</div>
          <div className="text-lg font-bold text-blue-700">{d.ringkasanGenap?.total || 0}</div>
          <div className="text-[11px] text-blue-600">Masuk: +{d.ringkasanGenap?.masuk || 0} / Keluar: -{d.ringkasanGenap?.keluar || 0}</div>
        </div>
      </div>
      {recaps.length > 0 && (
        <div className="overflow-x-auto">
          <table className="table-base text-xs">
            <thead>
              <tr><th>TP</th><th>Semester</th><th>L</th><th>P</th><th>Total</th><th>Masuk</th><th>Keluar</th></tr>
            </thead>
            <tbody>
              {recaps.map((r: any, i: number) => (
                <tr key={i}>
                  <td>{r.tahun_pelajaran}</td>
                  <td className="capitalize">{r.semester}</td>
                  <td>{r.totalLaki}</td>
                  <td>{r.totalPerempuan}</td>
                  <td className="font-semibold">{r.total}</td>
                  <td className="text-green-600">+{r.siswaMasuk}</td>
                  <td className="text-red-600">-{r.siswaKeluar}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function DetailAnnual({ data }: { data: any }) {
  const d = data || {}
  const trendSd = d.trendSd || []
  const trendTk = d.trendTk || []
  const trendKb = d.trendKb || []
  const alumni = d.alumni || []
  return (
    <div className="space-y-4">
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
        <div className="text-xs text-slate-500">Pertumbuhan Siswa SD</div>
        <div className={cn('text-lg font-bold', (d.pertumbuhanSd || '').startsWith('+') ? 'text-green-600' : 'text-red-600')}>
          {d.pertumbuhanSd || '0%'}
        </div>
      </div>
      {trendSd.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-slate-600 mb-1">Trend SD</div>
          <div className="overflow-x-auto">
            <table className="table-base text-xs">
              <thead><tr><th>TP</th><th>Siswa</th></tr></thead>
              <tbody>
                {trendSd.map((t: any, i: number) => (
                  <tr key={i}><td>{t.tahun}</td><td className="font-semibold">{t.total}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {alumni.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-slate-600 mb-1">Alumni</div>
          <div className="overflow-x-auto">
            <table className="table-base text-xs">
              <thead><tr><th>Tahun</th><th>Jumlah</th></tr></thead>
              <tbody>
                {alumni.map((a: any, i: number) => (
                  <tr key={i}><td>{a.tahun_lulus}</td><td className="font-semibold">{a.total}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {(trendTk.length > 0 || trendKb.length > 0) && (
        <div className="text-xs text-slate-400">Data TK/KB juga tersedia ({trendTk.length} TP TK, {trendKb.length} TP KB)</div>
      )}
    </div>
  )
}

function DetailGis({ data }: { data: any }) {
  const d = data || {}
  const sebaran = d.sebaranDesa || []
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-center">
          <div className="text-xs text-slate-500">Berkoordinat</div>
          <div className="text-lg font-bold text-green-700">{d.sekolahBerkoordinat || 0}</div>
        </div>
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-center">
          <div className="text-xs text-slate-500">Tanpa Koordinat</div>
          <div className="text-lg font-bold text-red-700">{d.sekolahTanpaKoordinat || 0}</div>
        </div>
      </div>
      {sebaran.length > 0 && (
        <div className="overflow-x-auto">
          <table className="table-base text-xs">
            <thead>
              <tr><th>Desa</th><th>SD</th><th>TK</th><th>KB</th><th>Total</th></tr>
            </thead>
            <tbody>
              {sebaran.map((s: any, i: number) => (
                <tr key={i}>
                  <td className="font-medium">{s.desa}</td>
                  <td>{s.sd}</td>
                  <td>{s.tk}</td>
                  <td>{s.kb}</td>
                  <td className="font-semibold">{s.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function DetailCertification({ data }: { data: any }) {
  const d = data || {}
  const ss = d.statusSertifikasi || {}
  const perSekolah = d.perSekolah || []
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-center">
          <div className="text-xs text-slate-500">Tersertifikasi</div>
          <div className="text-lg font-bold text-green-700">{ss.sudah || 0}</div>
        </div>
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-center">
          <div className="text-xs text-slate-500">Belum</div>
          <div className="text-lg font-bold text-red-700">{ss.belum || 0}</div>
        </div>
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-center">
          <div className="text-xs text-slate-500">% Sertifikasi</div>
          <div className="text-lg font-bold text-blue-700">{ss.persenSudah || 0}%</div>
        </div>
      </div>
      {perSekolah.length > 0 && (
        <div className="overflow-x-auto max-h-48 overflow-y-auto">
          <table className="table-base text-xs">
            <thead>
              <tr><th>Sekolah</th><th>Jenjang</th><th>Total</th><th>Sudah</th><th>Belum</th></tr>
            </thead>
            <tbody>
              {perSekolah.map((s: any, i: number) => (
                <tr key={i}>
                  <td className="max-w-[150px] truncate">{s.sekolahNama}</td>
                  <td className="uppercase">{s.jenjang}</td>
                  <td>{s.totalGuru}</td>
                  <td className="text-green-600">{s.tersertifikasi}</td>
                  <td className="text-red-600">{s.belumSertifikasi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function DetailShortage({ data }: { data: any }) {
  const d = data || {}
  const analisis = d.analisis || []
  const rekap = d.rekapitulasi || {}
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-center">
          <div className="text-xs text-slate-500">Sekolah Kurang Guru</div>
          <div className="text-lg font-bold text-red-700">{rekap.kekurangan || 0}</div>
        </div>
        <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-center">
          <div className="text-xs text-slate-500">Sekolah Ideal</div>
          <div className="text-lg font-bold text-green-700">{rekap.ideal || 0}</div>
        </div>
        <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-center">
          <div className="text-xs text-slate-500">Kelebihan Siswa</div>
          <div className="text-lg font-bold text-orange-700">{rekap.kelebihanSiswa || 0}</div>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
          <div className="text-xs text-slate-500">Rata-rata Rasio</div>
          <div className="text-lg font-bold text-slate-700">1:{rekap.rataRataRasio || 0}</div>
        </div>
      </div>
      <div className="text-xs text-slate-500">Total kekurangan guru: <span className="font-bold text-red-600">{rekap.totalKekuranganGuru || 0}</span> orang</div>
      {analisis.length > 0 && (
        <div className="overflow-x-auto max-h-48 overflow-y-auto">
          <table className="table-base text-xs">
            <thead>
              <tr><th>Sekolah</th><th>Jenjang</th><th>Siswa</th><th>Guru</th><th>Target</th><th>Kurang</th><th>Rasio</th><th>Status</th></tr>
            </thead>
            <tbody>
              {analisis.map((a: any, i: number) => (
                <tr key={i}>
                  <td className="max-w-[130px] truncate">{a.sekolahNama}</td>
                  <td className="uppercase">{a.jenjang}</td>
                  <td>{a.jumlahSiswa}</td>
                  <td>{a.jumlahGuru}</td>
                  <td>{a.targetGuru}</td>
                  <td className={a.kekuranganGuru > 0 ? 'text-red-600 font-bold' : 'text-slate-400'}>{a.kekuranganGuru}</td>
                  <td>1:{a.rasioSiswaGuru}</td>
                  <td>
                    <span className={cn(
                      'badge text-[10px]',
                      a.statusKetenagaan === 'kekurangan' ? 'bg-red-100 text-red-700' :
                      a.statusKetenagaan === 'ideal' ? 'bg-green-100 text-green-700' :
                      'bg-orange-100 text-orange-700'
                    )}>
                      {a.statusKetenagaan === 'kekurangan' ? 'Kurang' :
                       a.statusKetenagaan === 'ideal' ? 'Ideal' : 'Kelebihan Siswa'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const DETAIL_COMPONENTS: Record<string, React.FC<{ data: any }>> = {
  monthly: DetailMonthly,
  semester: DetailSemester,
  annual: DetailAnnual,
  gis: DetailGis,
  certification: DetailCertification,
  shortage: DetailShortage,
}

function getDetailIcon(type: string) {
  switch (type) {
    case 'monthly': return Calendar
    case 'semester': return BookOpen
    case 'annual': return TrendingUp
    case 'gis': return Globe
    case 'certification': return CheckCircle2
    case 'shortage': return XCircle
    default: return FileText
  }
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
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const fetchSchools = async () => {
    try {
      const result = await safeFetch<{ schools: School[] }>('/api/v2/schools')
      setSchools(result?.schools || [])
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
      const result = await safeFetch<GenerateResponse['data']>('/api/v2/reports/generate', {
        method: 'POST',
        body: JSON.stringify({
          type: selectedType,
          format,
          school_id: schoolId || undefined,
          tahun_pelajaran: tahunPelajaran || undefined,
        }),
      })
      setResult(result)
      const schoolNama = schoolId ? schools.find(s => s.id === schoolId)?.nama || null : null
      const entry: ReportHistory = {
        id: crypto.randomUUID(),
        type: selectedType,
        format,
        school_id: schoolId || null,
        school_nama: schoolNama,
        tahun_pelajaran: tahunPelajaran || null,
        generatedAt: result.generatedAt,
        summary: result.summary as unknown as Record<string, unknown>,
      }
      saveToHistory(entry)
      setHistory(loadHistory())
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setGenerating(false)
    }
  }

  const handleDownloadFromHistory = async (entry: ReportHistory) => {
    setDownloadingId(entry.id)
    try {
      const result = await safeFetch<GenerateResponse['data']>('/api/v2/reports/generate', {
        method: 'POST',
        body: JSON.stringify({
          type: entry.type,
          format: entry.format,
          school_id: entry.school_id || undefined,
          tahun_pelajaran: entry.tahun_pelajaran || undefined,
        }),
      })
      const label = REPORT_TYPES.find(r => r.key === entry.type)?.label || entry.type
      if (entry.format === 'pdf') exportPdf(entry.type, label, result.summary, (result.details || {}) as Record<string, unknown>)
      else if (entry.format === 'excel') exportExcel(entry.type, label, result.summary, (result.details || {}) as Record<string, unknown>)
      else exportCsv(entry.type, label, result.summary, (result.details || {}) as Record<string, unknown>)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal mendownload laporan')
    } finally {
      setDownloadingId(null)
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

          {result.details && selectedType && DETAIL_COMPONENTS[selectedType] && (
            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                {(() => { const Icon = getDetailIcon(selectedType); return <Icon className="w-4 h-4 text-slate-500" /> })()}
                <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  {selectedType === 'monthly' ? 'Detail Bulanan' :
                   selectedType === 'semester' ? 'Detail Semester' :
                   selectedType === 'annual' ? 'Trend Tahunan' :
                   selectedType === 'gis' ? 'Sebaran Desa' :
                   selectedType === 'certification' ? 'Status Sertifikasi' :
                   'Analisis Ketenagaan'}
                </h4>
              </div>
              {(() => {
                const Comp = DETAIL_COMPONENTS[selectedType]
                return <Comp data={result.details} />
              })()}
            </div>
          )}

          <div className="flex items-center gap-3 text-xs text-slate-500 mt-4">
            <span>Dibuat: {formatDate(result.generatedAt)}</span>
            {result.tahun_pelajaran && <span>TP: {result.tahun_pelajaran}</span>}
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
            <button
              onClick={() => {
                const label = REPORT_TYPES.find(r => r.key === result.type)?.label || result.type
                if (result.format === 'pdf') exportPdf(result.type, label, result.summary, (result.details || {}) as Record<string, unknown>)
                else if (result.format === 'excel') exportExcel(result.type, label, result.summary, (result.details || {}) as Record<string, unknown>)
                else exportCsv(result.type, label, result.summary, (result.details || {}) as Record<string, unknown>)
              }}
              className="btn btn-primary text-sm flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download {result.format.toUpperCase()}
            </button>
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
                            onClick={() => handleDownloadFromHistory(entry)}
                            disabled={downloadingId === entry.id}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 disabled:opacity-40"
                            title="Download"
                          >
                            {downloadingId === entry.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
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
              <button
                onClick={() => previewReport && handleDownloadFromHistory(previewReport)}
                disabled={downloadingId === previewReport?.id}
                className="btn btn-primary text-sm flex items-center gap-1.5"
              >
                {downloadingId === previewReport?.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
