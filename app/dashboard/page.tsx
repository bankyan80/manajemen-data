'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'
import AppShellTopbar from '@/components/layout/AppShellTopbar'
import StatCard from '@/components/dashboard/StatCard'
import CompletionDonutChart from '@/components/dashboard/CompletionDonutChart'
import MonthlyReportChart from '@/components/dashboard/MonthlyReportChart'
import DistrictRecapCard from '@/components/dashboard/DistrictRecapCard'
import { School, Users, BookOpen, FileText } from 'lucide-react'
import { useData, fetchJson } from '@/lib/useData'


interface DashboardStats {
  totalSD: number; totalTK: number; totalKB: number; totalGTK: number
  totalDocuments: number; totalStudents: number
  documentsVerified: number; documentsPending: number; reportsSubmitted: number
  documentArchives: { jenis: string; total: number }[]
  latestDocuments: any[]
  completionStats: { lengkap: number; belum_lengkap: number }
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { data: stats, loading: statsLoading } = useData<DashboardStats>('dashboard-stats', () =>
    fetchJson('/api/dashboard-stats')
  )

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{background: 'radial-gradient(ellipse 80% 60% at 0% 0%, rgba(30,58,138,0.1), transparent 60%), radial-gradient(ellipse 60% 50% at 100% 100%, rgba(20,184,166,0.08), transparent 50%), linear-gradient(180deg, #f8fafc 0%, #eef6ff 100%)'}}>
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-text-muted">Memuat...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <AppShellTopbar>
      <div className="container-page space-y-6">
        <div className="page-header">
          <div className="logo-icon">
            <Image src="/tutwuri.png" alt="Tut Wuri" width={24} height={24} />
          </div>
          <div>
            <h1>Dashboard</h1>
            <p className="text-sm text-text-muted">Selamat datang, {session.user?.name || 'Pengguna'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard title="Total SD" value={statsLoading ? '...' : String(stats?.totalSD || 0)} icon={<School className="h-5 w-5" />} color="blue" description="Sekolah Dasar" />
          <StatCard title="Total TK" value={statsLoading ? '...' : String(stats?.totalTK || 0)} icon={<Users className="h-5 w-5" />} color="purple" description="Taman Kanak-Kanak" />
          <StatCard title="Total KB" value={statsLoading ? '...' : String(stats?.totalKB || 0)} icon={<Users className="h-5 w-5" />} color="teal" description="Kelompok Bermain" />
          <StatCard title="Total GTK" value={statsLoading ? '...' : String(stats?.totalGTK || 0)} icon={<BookOpen className="h-5 w-5" />} color="amber" description="Guru & Tenaga Kependidikan" />
          <StatCard title="Dokumen Pegawai" value={statsLoading ? '...' : String(stats?.totalDocuments || 0)} icon={<FileText className="h-5 w-5" />} color="purple" description="Total dokumen tersimpan" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CompletionDonutChart stats={stats?.completionStats} loading={statsLoading} />
          <MonthlyReportChart />
        </div>
        <DistrictRecapCard stats={stats} loading={statsLoading} />
      </div>
    </AppShellTopbar>
  )
}
