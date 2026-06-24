'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AppShellTopbar from '@/components/layout/AppShellTopbar'
import { useData, fetchJson } from '@/lib/useData'
import { Printer, FileSpreadsheet, FileText } from 'lucide-react'

export default function CetakExportPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { data: schools } = useData<any[]>('schools-all', () => fetchJson('/api/schools'))

  if (status === 'loading') return <div className="p-8 text-center text-zinc-500">Memuat...</div>
  if (!session) { router.push('/login'); return null }

  const role = (session?.user as any)?.role
  const userSekolahId = (session?.user as any)?.sekolah_id
  const userSchool = (schools || []).find((s: any) => s.id === userSekolahId)
  const userJenjang = userSchool?.jenjang || 'sd'

  const isOperator = role === 'operator_sekolah'
  const jenjang = isOperator ? userJenjang : null

  const CARDS: {
    title: string
    desc: string
    color: string
    icon: string
  }[] = [
    ...(isOperator ? [{
      title: `Cetak Laporan ${userJenjang === 'kb' ? 'KB' : 'SD'}`,
      desc: `Cetak laporan bulanan ${userSchool?.nama || ''}`,
      color: 'blue',
      icon: 'printer',
    }] : [{
      title: 'Cetak Laporan SD',
      desc: 'Cetak laporan bulanan SD',
      color: 'blue',
      icon: 'printer',
    }, {
      title: 'Cetak Laporan KB',
      desc: 'Cetak laporan bulanan KB',
      color: 'purple',
      icon: 'printer',
    }]),
    {
      title: isOperator ? `Export Excel ${userJenjang === 'kb' ? 'KB' : 'SD'}` : 'Export Excel',
      desc: isOperator ? `Download data ${userSchool?.nama || ''}` : 'Export data ke spreadsheet',
      color: 'emerald',
      icon: 'excel',
    },
    {
      title: isOperator ? `Export PDF ${userJenjang === 'kb' ? 'KB' : 'SD'}` : 'Export PDF',
      desc: isOperator ? `Download PDF ${userSchool?.nama || ''}` : 'Export data ke PDF',
      color: 'red',
      icon: 'pdf',
    },
  ]

  const colorMap: Record<string, { bg: string; text: string; btn: string; hover: string }> = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-700', btn: 'bg-blue-600', hover: 'hover:bg-blue-700' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-700', btn: 'bg-purple-600', hover: 'hover:bg-purple-700' },
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700', btn: 'bg-emerald-600', hover: 'hover:bg-emerald-700' },
    red: { bg: 'bg-red-100', text: 'text-red-700', btn: 'bg-red-600', hover: 'hover:bg-red-700' },
  }

  return (
    <AppShellTopbar>
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-zinc-900">Cetak &amp; Export</h1>
        {isOperator && (
          <p className="text-sm text-zinc-500">Data: {userSchool?.nama || 'Sekolah Anda'} ({userJenjang?.toUpperCase()})</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CARDS.map((card, i) => {
            const c = colorMap[card.color]
            return (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
                <div className={`w-10 h-10 ${c.bg} rounded-lg flex items-center justify-center mb-3`}>
                  {card.icon === 'excel' ? <FileSpreadsheet className={`w-5 h-5 ${c.text}`} /> :
                   card.icon === 'pdf' ? <FileText className={`w-5 h-5 ${c.text}`} /> :
                   <Printer className={`w-5 h-5 ${c.text}`} />}
                </div>
                <h3 className="font-semibold text-zinc-900 mb-2">{card.title}</h3>
                <p className="text-xs text-zinc-500 mb-4">{card.desc}</p>
                <button onClick={() => alert('Fitur cetak/export akan tersedia dalam versi mendatang')}
                  className={`block w-full px-4 py-2 text-white rounded-lg text-sm font-medium text-center ${c.btn} ${c.hover}`}>
                  Download
                </button>
              </div>
            )
          })}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-12 text-center">
          <FileText className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <h3 className="font-semibold text-zinc-900 mb-2">Arsip Cetakan</h3>
          <p className="text-sm text-zinc-500">Belum ada arsip cetakan. Arsip akan muncul setelah Anda mencetak atau mengekspor laporan.</p>
        </div>
      </div>
    </AppShellTopbar>
  )
}
