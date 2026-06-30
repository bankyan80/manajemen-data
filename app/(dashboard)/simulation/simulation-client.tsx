'use client'

import { useState, useEffect, useCallback } from 'react'
import { safeFetch } from '@/lib/safe-fetch'
import {
  UserMinus, UserPlus, Shuffle, TrendingUp, Play,
  AlertCircle, ChevronUp, ChevronDown, Clock, Trash2,
  BookOpen, DollarSign,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SimulationParams {
  years?: number
  retiringCount?: number
  newTeachers?: number
  movedTeachers?: number
  growthRate?: number
}

interface SimulationResult {
  scenario: string
  params: SimulationParams
  before: {
    totalTeachers: number
    totalStudents: number
    certifiedTeachers: number
    schoolsWithShortage: number
    teachersInSurplus: number
  }
  after: {
    totalTeachers: number
    totalStudents: number
    certifiedTeachers: number
    schoolsWithShortage: number
    teachersInSurplus: number
  }
  delta: {
    totalTeachers: number
    totalStudents: number
    certifiedTeachers: number
    schoolsWithShortage: number
    teachersInSurplus: number
  }
  costImpact: number
  recommendations: string[]
}

interface HistoryEntry {
  id: string
  timestamp: number
  result: SimulationResult
}

const SCENARIOS = [
  {
    key: 'retirement',
    label: 'Pensiun Guru',
    description: 'Simulasi dampak pensiun guru dalam 5 tahun ke depan',
    icon: UserMinus,
    color: 'text-orange-600 bg-orange-100',
    borderColor: 'border-orange-200 hover:border-orange-400',
  },
  {
    key: 'pppk',
    label: 'Rekrutmen PPPK',
    description: 'Simulasi penambahan guru PPPK baru',
    icon: UserPlus,
    color: 'text-green-600 bg-green-100',
    borderColor: 'border-green-200 hover:border-green-400',
  },
  {
    key: 'redistribution',
    label: ' redistribusi Guru',
    description: 'Simulasi pemindahan guru dari sekolah surplus ke minus',
    icon: Shuffle,
    color: 'text-blue-600 bg-blue-100',
    borderColor: 'border-blue-200 hover:border-blue-400',
  },
  {
    key: 'student_growth',
    label: 'Pertumbuhan Siswa',
    description: 'Simulasi dampak pertumbuhan jumlah siswa',
    icon: TrendingUp,
    color: 'text-purple-600 bg-purple-100',
    borderColor: 'border-purple-200 hover:border-purple-400',
  },
]

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
}

function loadHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem('simulation_history')
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveToHistory(result: SimulationResult) {
  const history = loadHistory()
  history.unshift({ id: crypto.randomUUID(), timestamp: Date.now(), result })
  if (history.length > 20) history.length = 20
  localStorage.setItem('simulation_history', JSON.stringify(history))
}

function DeltaBadge({ value, label }: { value: number; label: string }) {
  if (value === 0) return null
  const isPositive = value > 0
  const isGood = (label === 'totalTeachers' || label === 'totalStudents' || label === 'certifiedTeachers') ? isPositive : !isPositive
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full',
      isGood ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700',
    )}>
      {isPositive ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      {Math.abs(value).toLocaleString()}
    </span>
  )
}

function MetricCard({ title, value, delta, highlight }: { title: string; value: number | string; delta?: number; highlight?: boolean }) {
  return (
    <div className={cn('card p-4', highlight && 'ring-2 ring-primary/20')}>
      <div className="text-xs text-slate-500 mb-1">{title}</div>
      <div className="text-xl font-bold text-slate-800">{typeof value === 'number' ? value.toLocaleString() : value}</div>
      {delta !== undefined && delta !== 0 && (
        <div className={cn('text-xs mt-1 font-medium', delta > 0 ? 'text-green-600' : 'text-red-600')}>
          {delta > 0 ? '+' : ''}{delta.toLocaleString()}
        </div>
      )}
    </div>
  )
}

export default function SimulationClient() {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null)
  const [params, setParams] = useState<SimulationParams>({})
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistory(loadHistory())
  }, [])

  const refreshHistory = useCallback(() => {
    setHistory(loadHistory())
  }, [])

  const handleSelectScenario = (key: string) => {
    setSelectedScenario(key)
    setResult(null)
    setError(null)
    switch (key) {
      case 'retirement':
        setParams({ years: 5, retiringCount: undefined })
        break
      case 'pppk':
        setParams({ newTeachers: 50 })
        break
      case 'redistribution':
        setParams({ movedTeachers: undefined })
        break
      case 'student_growth':
        setParams({ growthRate: 5 })
        break
    }
  }

  const handleRunSimulation = async () => {
    if (!selectedScenario) return
    setLoading(true)
    setError(null)
    try {
      const result = await safeFetch<SimulationResult>('/api/v2/simulation', {
        method: 'POST',
        body: JSON.stringify({ scenario: selectedScenario, params }),
      })
      setResult(result)
      saveToHistory(result)
      refreshHistory()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Simulation Engine</h1>
          <p className="page-subtitle">Simulasi dan analisis dampak kebijakan pendidikan Kecamatan Lemahabang</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="btn btn-ghost text-sm flex items-center gap-1.5"
          >
            <Clock className="w-4 h-4" />
            Riwayat
          </button>
        </div>
      </div>

      {error && (
        <div className="card p-4 mb-6 flex items-center gap-3 bg-red-50 border border-red-200">
          <AlertCircle className="w-5 h-5 text-danger flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {SCENARIOS.map(sc => {
          const Icon = sc.icon
          const isActive = selectedScenario === sc.key
          return (
            <button
              key={sc.key}
              onClick={() => handleSelectScenario(sc.key)}
              className={cn(
                'card p-5 text-left transition-all border-2',
                isActive ? 'ring-2 ring-primary/30 border-primary' : sc.borderColor,
              )}
            >
              <div className={cn('p-2.5 rounded-xl w-fit mb-3', sc.color)}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="font-semibold text-slate-800 text-sm mb-1">{sc.label}</div>
              <div className="text-xs text-slate-500 leading-relaxed">{sc.description}</div>
            </button>
          )
        })}
      </div>

      {selectedScenario && (
        <div className="card p-5 mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Parameter Skenario</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {selectedScenario === 'retirement' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Jangka Waktu (tahun)</label>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={params.years || 5}
                    onChange={e => setParams(p => ({ ...p, years: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                  <span className="text-xs text-slate-500 mt-1 block">{params.years || 5} tahun</span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Guru Pensiun</label>
                  <input
                    type="number"
                    min={1}
                    value={params.retiringCount || ''}
                    onChange={e => setParams(p => ({ ...p, retiringCount: parseInt(e.target.value) || 0 }))}
                    placeholder="Estimasi otomatis (15%)"
                    className="input"
                  />
                </div>
              </>
            )}
            {selectedScenario === 'pppk' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Jumlah Guru PPPK Baru</label>
                <input
                  type="number"
                  min={1}
                  value={params.newTeachers || ''}
                  onChange={e => setParams(p => ({ ...p, newTeachers: parseInt(e.target.value) || 0 }))}
                  className="input"
                />
              </div>
            )}
            {selectedScenario === 'redistribution' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Guru yang Dipindahkan</label>
                <input
                  type="number"
                  min={1}
                  value={params.movedTeachers || ''}
                  onChange={e => setParams(p => ({ ...p, movedTeachers: parseInt(e.target.value) || 0 }))}
                  placeholder="Maks 20 (otomatis)"
                  className="input"
                />
              </div>
            )}
            {selectedScenario === 'student_growth' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Tingkat Pertumbuhan (%)</label>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={params.growthRate || 5}
                  onChange={e => setParams(p => ({ ...p, growthRate: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <span className="text-xs text-slate-500 mt-1 block">{params.growthRate || 5}%</span>
              </div>
            )}
          </div>
          <button
            onClick={handleRunSimulation}
            disabled={loading}
            className="btn btn-primary flex items-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {loading ? 'Menjalankan...' : 'Jalankan Simulasi'}
          </button>
        </div>
      )}

      {result && (
        <>
          <div className="card p-5 mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Hasil Simulasi</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
              <MetricCard
                title="Total Guru"
                value={result.after.totalTeachers}
                delta={result.delta.totalTeachers}
                highlight={result.delta.totalTeachers !== 0}
              />
              <MetricCard
                title="Total Siswa"
                value={result.after.totalStudents}
                delta={result.delta.totalStudents}
                highlight={result.delta.totalStudents !== 0}
              />
              <MetricCard
                title="Guru Tersertifikasi"
                value={result.after.certifiedTeachers}
                delta={result.delta.certifiedTeachers}
                highlight={result.delta.certifiedTeachers !== 0}
              />
              <MetricCard
                title="Sekolah Kekurangan"
                value={result.after.schoolsWithShortage}
                delta={result.delta.schoolsWithShortage}
                highlight={result.delta.schoolsWithShortage !== 0}
              />
              <MetricCard
                title="Guru Surplus"
                value={result.after.teachersInSurplus}
                delta={result.delta.teachersInSurplus}
                highlight={result.delta.teachersInSurplus !== 0}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-700">Dampak Biaya</span>
                </div>
                <div className="text-2xl font-bold text-slate-800">{formatRupiah(result.costImpact)}</div>
                <div className="text-xs text-slate-500 mt-1">Estimasi biaya tahun pertama</div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-700">Rekomendasi</span>
                </div>
                <ol className="space-y-1.5">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="text-xs text-blue-800 flex items-start gap-2">
                      <span className="font-bold text-blue-500 mt-0.5">{i + 1}.</span>
                      {rec}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>

          <div className="card overflow-hidden mb-6">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-semibold text-slate-700">Perbandingan Sebelum vs Sesudah</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Metrik</th>
                    <th>Sebelum</th>
                    <th>Sesudah</th>
                    <th>Delta</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Total Guru', key: 'totalTeachers' as const },
                    { label: 'Total Siswa', key: 'totalStudents' as const },
                    { label: 'Guru Tersertifikasi', key: 'certifiedTeachers' as const },
                    { label: 'Sekolah Kekurangan Guru', key: 'schoolsWithShortage' as const },
                    { label: 'Guru Surplus', key: 'teachersInSurplus' as const },
                  ].map(row => (
                    <tr key={row.key}>
                      <td className="font-medium text-slate-700">{row.label}</td>
                      <td className="text-slate-600">{result.before[row.key].toLocaleString()}</td>
                      <td className="text-slate-600">{result.after[row.key].toLocaleString()}</td>
                      <td>
                        <DeltaBadge value={result.delta[row.key]} label={row.key} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {showHistory && (
        <div className="card overflow-hidden mb-6">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Riwayat Simulasi</h3>
            <button
              onClick={() => { localStorage.removeItem('simulation_history'); setHistory([]) }}
              className="text-xs text-danger hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Hapus Semua
            </button>
          </div>
          {history.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Belum ada riwayat simulasi
            </div>
          ) : (
            <div className="divide-y divide-border">
              {history.map(entry => {
                const sc = SCENARIOS.find(s => s.key === entry.result.scenario)
                const Icon = sc?.icon || Play
                return (
                  <div
                    key={entry.id}
                    className="p-4 flex items-center gap-4 hover:bg-slate-50 cursor-pointer"
                    onClick={() => { setResult(entry.result); setSelectedScenario(entry.result.scenario); setParams(entry.result.params || {}) }}
                  >
                    <div className={cn('p-2 rounded-lg', sc?.color || 'bg-slate-100')}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-700">{sc?.label || entry.result.scenario}</div>
                      <div className="text-xs text-slate-400">{formatTime(entry.timestamp)}</div>
                    </div>
                    <div className="text-xs text-slate-500">
                      {entry.result.delta.totalTeachers !== 0 && (
                        <span>Guru: {entry.result.delta.totalTeachers > 0 ? '+' : ''}{entry.result.delta.totalTeachers}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
