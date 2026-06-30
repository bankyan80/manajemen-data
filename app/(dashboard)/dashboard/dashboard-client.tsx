'use client'

import { useState, useEffect } from 'react'
import { safeFetch } from '@/lib/safe-fetch'
import {
  School, Users, GraduationCap, AlertTriangle,
  TrendingUp, Award, Clock, Building, AlertCircle,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/utils'

interface KPI {
  totalSchools: number
  totalStudents: number
  totalTeachers: number
  teacherShortage: number
  teacherSurplus: number
  certificationPending: number
  retirementRisk: number
  damagedClassrooms: number
}

function AnimatedCounter({ value, label, icon: Icon, color, prefix = '', suffix = '' }: {
  value: number
  label: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  color: string
  prefix?: string
  suffix?: string
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
    <div className="card p-5 card-hover">
      <div className="flex items-start justify-between">
        <div>
          <div className="kpi-value" style={{ color }}>
            {prefix}{display.toLocaleString()}{suffix}
          </div>
          <div className="kpi-label mt-1">{label}</div>
        </div>
        <div className="p-3 rounded-xl" style={{ backgroundColor: color + '15' }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
    </div>
  )
}

export default function DashboardClient() {
  const [kpi, setKpi] = useState<KPI | null>(null)
  const [trends, setTrends] = useState<Record<string, unknown>[]>([])
  const [alerts, setAlerts] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAll() {
      try {
        const [kpiData, trendData, alertData] = await Promise.all([
          safeFetch<any>('/api/v2/dashboard/kpi'),
          safeFetch<any>('/api/v2/dashboard/trends'),
          safeFetch<any>('/api/v2/dashboard/alerts'),
        ])
        setKpi(kpiData)
        setTrends(trendData?.studentTrend || [])
        setAlerts(alertData || [])
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Gagal memuat data dashboard')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  if (error) {
    return (
      <div className="page-container">
        <div className="card p-12 text-center">
          <AlertCircle className="w-12 h-12 text-danger mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Gagal Memuat Dashboard</h2>
          <p className="text-slate-500 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Dashboard</h1>
          <p className="page-subtitle">Ringkasan data pendidikan Kecamatan Lemahabang</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Clock className="w-4 h-4" />
          <span>Update Real-time</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card p-5">
              <div className="skeleton h-8 w-24 mb-2" />
              <div className="skeleton h-4 w-32" />
            </div>
          ))
        ) : kpi ? (
          <>
            <AnimatedCounter value={kpi.totalSchools} label="Total Sekolah" icon={School} color="#2563EB" />
            <AnimatedCounter value={kpi.totalStudents} label="Total Siswa" icon={GraduationCap} color="#10B981" />
            <AnimatedCounter value={kpi.totalTeachers} label="Total Guru & Tendik" icon={Users} color="#8B5CF6" />
            <AnimatedCounter value={kpi.teacherShortage} label="Kekurangan Guru" icon={AlertTriangle} color="#EF4444" />
            <AnimatedCounter value={kpi.teacherSurplus} label="Kelebihan Guru" icon={TrendingUp} color="#F59E0B" />
            <AnimatedCounter value={kpi.certificationPending} label="Sertifikasi Tertunda" icon={Award} color="#F59E0B" />
            <AnimatedCounter value={kpi.retirementRisk} label="Risiko Pensiun" icon={Clock} color="#EF4444" />
            <AnimatedCounter value={kpi.damagedClassrooms} label="Ruang Rusak" icon={Building} color="#EF4444" />
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Tren Siswa per Bulan</h3>
          {loading ? (
            <div className="skeleton h-64 w-full" />
          ) : trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
              Belum ada data tren
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Notifikasi & Peringatan</h3>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 mb-3">
                <div className="skeleton w-8 h-8 rounded-lg flex-shrink-0" />
                <div className="flex-1">
                  <div className="skeleton h-4 w-3/4 mb-1" />
                  <div className="skeleton h-3 w-1/2" />
                </div>
              </div>
            ))
          ) : alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((alert: Record<string, unknown>, i: number) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50" style={{ animation: 'none' }}>
                  <div className={cn(
                    "p-2 rounded-lg flex-shrink-0",
                    alert.type === 'critical' && "bg-red-100",
                    alert.type === 'warning' && "bg-yellow-100",
                    alert.type === 'success' && "bg-green-100",
                    (alert.type === 'info' || true) && "bg-blue-100",
                  )}>
                    <AlertCircle className={cn(
                      "w-4 h-4",
                      alert.type === 'critical' && "text-red-600",
                      alert.type === 'warning' && "text-yellow-600",
                      alert.type === 'success' && "text-green-600",
                      alert.type === 'info' && "text-blue-600",
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{String(alert.title || '')}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{String(alert.related_school_name || '')}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
              Tidak ada notifikasi
            </div>
          )}
        </div>
      </div>

      <div className="card p-5 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/10">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-700">Rekomendasi AI</h3>
            <p className="text-sm text-slate-500 mt-1">
              {kpi && kpi.teacherShortage > 0
                ? `${kpi.teacherShortage} sekolah mengalami kekurangan guru. Disarankan redistribusi ${kpi.teacherSurplus > 0 ? `${kpi.teacherSurplus} guru dari sekolah surplus.` : 'segera lakukan perekrutan PPPK.'}`
                : 'Kebutuhan guru saat ini terpenuhi. Pantau perkembangan rutin.'}
            </p>
          </div>
          <span className="badge bg-primary/10 text-primary">AI</span>
        </div>
      </div>
    </div>
  )
}
