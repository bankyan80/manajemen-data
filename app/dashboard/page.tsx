'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import AppShellTopbar from '@/components/layout/AppShellTopbar'
import StatCard from '@/components/dashboard/StatCard'
import DocumentArchiveGrid from '@/components/dashboard/DocumentArchiveGrid'
import CompletionDonutChart from '@/components/dashboard/CompletionDonutChart'
import MonthlyReportChart from '@/components/dashboard/MonthlyReportChart'
import LatestDocumentTable from '@/components/dashboard/LatestDocumentTable'
import DistrictRecapCard from '@/components/dashboard/DistrictRecapCard'
import { School, Users, BookOpen, FileText } from 'lucide-react'
import { useData, fetchJson } from '@/lib/useData'

interface DashboardStats {
  totalSD: number; totalPAUD: number; totalGTK: number
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
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-teal-600" />
          <p className="mt-2 text-sm text-zinc-500">Memuat...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <AppShellTopbar>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500">Selamat datang, {session.user?.name || 'Pengguna'}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard title="Total SD" value={statsLoading ? '...' : String(stats?.totalSD || 0)} icon={<School className="h-5 w-5" />} color="blue" description="Sekolah Dasar" />
          <StatCard title="Total PAUD" value={statsLoading ? '...' : String(stats?.totalPAUD || 0)} icon={<Users className="h-5 w-5" />} color="teal" description="PAUD & TK" />
          <StatCard title="Total GTK" value={statsLoading ? '...' : String(stats?.totalGTK || 0)} icon={<BookOpen className="h-5 w-5" />} color="amber" description="Guru & Tenaga Kependidikan" />
          <StatCard title="Dokumen Pegawai" value={statsLoading ? '...' : String(stats?.totalDocuments || 0)} icon={<FileText className="h-5 w-5" />} color="purple" description="Total dokumen tersimpan" />
        </div>

        <DocumentArchiveGrid archives={stats?.documentArchives} loading={statsLoading} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CompletionDonutChart stats={stats?.completionStats} loading={statsLoading} />
          <MonthlyReportChart />
        </div>
        <LatestDocumentTable docs={stats?.latestDocuments} loading={statsLoading} />
        <DistrictRecapCard stats={stats} loading={statsLoading} />
      </div>
    </AppShellTopbar>
  )
}
