'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Sparkles, Brain, MessageSquare, Send, Lightbulb,
  AlertTriangle, Info, CheckCircle, XCircle,
  Clock, School, Users, GraduationCap, Award,
  Bot, ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Insight {
  type: 'warning' | 'info' | 'success' | 'critical'
  title: string
  description: string
  category: string
  action?: string
}

interface Summary {
  totalSchools: number
  totalTeachers: number
  totalStudents: number
  certifiedTeachers: number
  uncertifiedTeachers: number
  teacherShortageSchools: number
  retiringSoon: number
}

interface InsightsData {
  insights: Insight[]
  summary: Summary
  generatedAt: string
}

interface QaResponse {
  question: string
  answer: string
  data?: Record<string, unknown>
}

function InsightBadge({ type }: { type: Insight['type'] }) {
  const map = {
    critical: { bg: 'bg-red-500/10', text: 'text-red-600', icon: XCircle },
    warning: { bg: 'bg-yellow-500/10', text: 'text-yellow-600', icon: AlertTriangle },
    info: { bg: 'bg-blue-500/10', text: 'text-blue-600', icon: Info },
    success: { bg: 'bg-green-500/10', text: 'text-green-600', icon: CheckCircle },
  }
  const c = map[type]
  const Icon = c.icon
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium', c.bg, c.text)}>
      <Icon className="w-3 h-3" />
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  )
}

function AnimatedCounter({ value, label, icon: Icon, color }: {
  value: number
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    let start = 0
    const duration = 1500
    const steps = 30
    const increment = value / steps
    const timer = setInterval(() => {
      start += increment
      if (start >= value) {
        setDisplay(value)
        clearInterval(timer)
      } else {
        setDisplay(Math.floor(start))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [value])

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/70 backdrop-blur-xl p-5 card-hover">
      <div className="absolute top-0 right-0 w-32 h-32 -translate-y-1/2 translate-x-1/2 rounded-full opacity-10" style={{ backgroundColor: color }} />
      <div className="flex items-start justify-between relative">
        <div>
          <div className="text-3xl font-bold" style={{ color }}>{display.toLocaleString()}</div>
          <div className="text-sm text-slate-500 mt-1">{label}</div>
        </div>
        <div className="p-3 rounded-xl" style={{ backgroundColor: color + '15' }}>
          <div style={{ color }}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  )
}

function TypeBadge({ category }: { category: string }) {
  const colorMap: Record<string, string> = {
    sertifikasi: 'bg-purple-100 text-purple-700',
    kepegawaian: 'bg-orange-100 text-orange-700',
    kesiswaan: 'bg-cyan-100 text-cyan-700',
  }
  return (
    <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider', colorMap[category] || 'bg-slate-100 text-slate-600')}>
      {category}
    </span>
  )
}

export default function AiClient() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<InsightsData | null>(null)
  const [question, setQuestion] = useState('')
  const [asking, setAsking] = useState(false)
  const [qaResult, setQaResult] = useState<QaResponse | null>(null)
  const [qaError, setQaError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchInsights() {
      try {
        const res = await fetch('/api/v2/ai/insights')
        const json = await res.json()
        if (json.success) setData(json.data)
        else setError(json.error || 'Gagal memuat insights')
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Gagal terhubung ke server')
      } finally {
        setLoading(false)
      }
    }
    fetchInsights()
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [qaResult])

  const handleAsk = useCallback(async () => {
    if (!question.trim() || asking) return
    setAsking(true)
    setQaError(null)
    setQaResult(null)
    try {
      const res = await fetch(`/api/v2/ai/ask?q=${encodeURIComponent(question.trim())}`)
      const json = await res.json()
      if (json.success) setQaResult(json.data)
      else setQaError(json.error || 'Gagal mendapatkan jawaban')
    } catch (err: unknown) {
      setQaError(err instanceof Error ? err.message : 'Gagal terhubung ke server')
    } finally {
      setAsking(false)
    }
  }, [question, asking])

  const filteredInsights = activeCategory
    ? data?.insights.filter(i => i.category === activeCategory) || []
    : data?.insights || []

  const categories = data?.insights
    ? [...new Set(data.insights.map(i => i.category))]
    : []

  if (error) {
    return (
      <div className="page-container">
        <div className="max-w-lg mx-auto mt-20 text-center">
          <div className="card p-12">
            <XCircle className="w-12 h-12 text-danger mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Gagal Memuat AI Insights</h2>
            <p className="text-slate-500 text-sm">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-200">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="page-title">AI Intelligence</h1>
            <p className="page-subtitle">Analisis cerdas dan wawasan data pendidikan Kecamatan Lemahabang</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          {data ? <span>Update {new Date(data.generatedAt).toLocaleString('id-ID')}</span> : <span className="skeleton h-3 w-32" />}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
        {loading ? (
          Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/20 bg-white/70 backdrop-blur-xl p-4">
              <div className="skeleton h-7 w-16 mb-2" />
              <div className="skeleton h-3 w-20" />
            </div>
          ))
        ) : data ? (
          <>
            <AnimatedCounter value={data.summary.totalSchools} label="Sekolah" icon={School} color="#6366F1" />
            <AnimatedCounter value={data.summary.totalTeachers} label="Guru" icon={Users} color="#8B5CF6" />
            <AnimatedCounter value={data.summary.totalStudents} label="Siswa" icon={GraduationCap} color="#06B6D4" />
            <AnimatedCounter value={data.summary.certifiedTeachers} label="Tersertifikasi" icon={Award} color="#10B981" />
            <AnimatedCounter value={data.summary.uncertifiedTeachers} label="Belum Sertifikasi" icon={Award} color="#F59E0B" />
            <AnimatedCounter value={data.summary.teacherShortageSchools} label="Kekurangan Guru" icon={AlertTriangle} color="#EF4444" />
            <AnimatedCounter value={data.summary.retiringSoon} label="Akan Pensiun" icon={Clock} color="#F43F5E" />
          </>
        ) : null}
      </div>

      {/* Main grid: Insights + Q&A */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Insights Feed */}
        <div className="lg:col-span-3">
          <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/70 backdrop-blur-xl p-6">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500" />
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-violet-600" />
                <h2 className="text-sm font-semibold text-slate-800">Insight Feed</h2>
                <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {data?.insights.length || 0} insights
                </span>
              </div>
              {activeCategory && (
                <button
                  onClick={() => setActiveCategory(null)}
                  className="text-xs text-violet-600 hover:text-violet-700 font-medium"
                >
                  Semua
                </button>
              )}
            </div>

            {/* Category filters */}
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                      activeCategory === cat
                        ? 'bg-violet-100 text-violet-700 border-violet-200'
                        : 'bg-white/50 text-slate-500 border-slate-200/50 hover:bg-slate-50 hover:border-slate-300'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white/50">
                    <div className="skeleton w-10 h-10 rounded-lg flex-shrink-0" />
                    <div className="flex-1">
                      <div className="skeleton h-4 w-3/4 mb-2" />
                      <div className="skeleton h-3 w-full mb-1" />
                      <div className="skeleton h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredInsights.length > 0 ? (
              <div className="space-y-3">
                {filteredInsights.map((insight, i) => (
                  <div
                    key={i}
                    className="group relative overflow-hidden rounded-xl border border-slate-100 bg-white/60 p-4 transition-all hover:bg-white hover:shadow-md hover:border-slate-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'p-2.5 rounded-xl flex-shrink-0 transition-transform group-hover:scale-110',
                        insight.type === 'critical' && 'bg-red-100',
                        insight.type === 'warning' && 'bg-yellow-100',
                        insight.type === 'success' && 'bg-green-100',
                        insight.type === 'info' && 'bg-blue-100',
                      )}>
                        {insight.type === 'critical' && <XCircle className="w-4 h-4 text-red-600" />}
                        {insight.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-600" />}
                        {insight.type === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
                        {insight.type === 'info' && <Info className="w-4 h-4 text-blue-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-slate-800">{insight.title}</h3>
                          <InsightBadge type={insight.type} />
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{insight.description}</p>
                        {insight.action && (
                          <div className="flex items-center gap-1 mt-2 text-xs font-medium text-violet-600">
                            <ArrowRight className="w-3 h-3" />
                            <span>{insight.action}</span>
                          </div>
                        )}
                      </div>
                      <TypeBadge category={insight.category} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Sparkles className="w-8 h-8 mb-2" />
                <p className="text-sm">Tidak ada insight untuk kategori ini</p>
              </div>
            )}
          </div>
        </div>

        {/* AI Q&A */}
        <div className="lg:col-span-2">
          <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/70 backdrop-blur-xl h-full flex flex-col">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500" />
            <div className="p-6 pb-0">
              <div className="flex items-center gap-2 mb-5">
                <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-sm shadow-cyan-200">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-sm font-semibold text-slate-800">AI Tanya Jawab</h2>
              </div>

              {/* Response area */}
              <div className="min-h-[200px] mb-4">
                {asking ? (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                ) : qaResult ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-slate-100 flex-shrink-0">
                        <Users className="w-4 h-4 text-slate-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-slate-400 mb-1">Pertanyaan</p>
                        <p className="text-sm text-slate-700 bg-slate-50 rounded-xl p-3">{qaResult.question}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-slate-400 mb-1">Jawaban AI</p>
                        <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-3 border border-violet-100">
                          <p className="text-sm text-slate-700">{qaResult.answer}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : qaError ? (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-red-100 flex-shrink-0">
                      <XCircle className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-red-600">{qaError}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                    <Brain className="w-10 h-10 mb-3 text-slate-300" />
                    <p className="text-sm font-medium text-slate-500">Ada yang ingin ditanyakan?</p>
                    <p className="text-xs text-slate-400 mt-1 text-center max-w-[200px]">
                      Tanya tentang kekurangan guru, sertifikasi, atau data pensiun
                    </p>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>

            {/* Input */}
            <div className="mt-auto p-4 border-t border-slate-100">
              <form
                onSubmit={(e) => { e.preventDefault(); handleAsk() }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Tanyakan sesuatu..."
                  className="flex-1 px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all placeholder:text-slate-400"
                  disabled={asking}
                />
                <button
                  type="submit"
                  disabled={!question.trim() || asking}
                  className={cn(
                    'p-2.5 rounded-xl transition-all',
                    question.trim() && !asking
                      ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md shadow-violet-200 hover:shadow-lg hover:shadow-violet-300'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  )}
                >
                  {asking ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
