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

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
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
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Selamat datang, {session.user?.name || 'Pengguna'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            title="Total SD"
            value="28"
            icon={<School className="h-5 w-5" />}
            color="blue"
            description="Sekolah Dasar"
          />
          <StatCard
            title="Total PAUD"
            value="41"
            icon={<Users className="h-5 w-5" />}
            color="teal"
            description="PAUD & TK"
          />
          <StatCard
            title="Total GTK"
            value="356"
            icon={<BookOpen className="h-5 w-5" />}
            color="amber"
            description="Guru & Tenaga Kependidikan"
          />
          <StatCard
            title="Dokumen Pegawai"
            value="1.248"
            icon={<FileText className="h-5 w-5" />}
            color="purple"
            description="Total dokumen tersimpan"
          />
        </div>

        <DocumentArchiveGrid />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CompletionDonutChart />
          <MonthlyReportChart />
        </div>

        <LatestDocumentTable />
        <DistrictRecapCard />
      </div>
    </AppShellTopbar>
  )
}
