'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AppShellTopbar from '@/components/layout/AppShellTopbar'
import { Printer, FileSpreadsheet, FileText } from 'lucide-react'

const CARDS = [
  {
    title: 'Cetak Laporan SD',
    desc: 'Cetak laporan bulanan SD dalam format PDF',
    color: 'blue',
    options: ['Bulan: Januari 2026', 'Februari 2026', 'Maret 2026'],
  },
  {
    title: 'Cetak Laporan PAUD',
    desc: 'Cetak laporan bulanan PAUD dalam format PDF',
    color: 'purple',
    options: ['Bulan: Januari 2026', 'Februari 2026', 'Maret 2026'],
  },
  {
    title: 'Cetak Rekap Kecamatan',
    desc: 'Cetak rekap data seluruh kecamatan',
    color: 'green',
    options: ['Semester Ganjil 2025/2026', 'Semester Genap 2024/2025'],
  },
  {
    title: 'Export Excel',
    desc: 'Export data ke format spreadsheet',
    color: 'emerald',
    options: ['Pilih data untuk di-export', 'Data Kesiswaan SD', 'Data Kesiswaan PAUD', 'Data GTK', 'Data Sarpras', 'Data SPMB', 'Rekap Kecamatan'],
  },
  {
    title: 'Export PDF',
    desc: 'Export data ke format PDF',
    color: 'red',
    options: ['Pilih data untuk di-export', 'Laporan Bulanan SD', 'Laporan Bulanan PAUD', 'Rekap Kecamatan', 'Data GTK', 'Data SPMB'],
  },
  {
    title: 'Sinkron Spreadsheet',
    desc: 'Sinkronisasi data ke Google Spreadsheet',
    color: 'cyan',
    isSync: true,
    options: [],
  },
]

const colorMap: Record<string, { bg: string; text: string; btn: string; hover: string }> = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-700', btn: 'bg-blue-600', hover: 'hover:bg-blue-700' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-700', btn: 'bg-purple-600', hover: 'hover:bg-purple-700' },
  green: { bg: 'bg-green-100', text: 'text-green-700', btn: 'bg-green-600', hover: 'hover:bg-green-700' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700', btn: 'bg-emerald-600', hover: 'hover:bg-emerald-700' },
  red: { bg: 'bg-red-100', text: 'text-red-700', btn: 'bg-red-600', hover: 'hover:bg-red-700' },
  cyan: { bg: 'bg-cyan-100', text: 'text-cyan-700', btn: 'bg-cyan-600', hover: 'hover:bg-cyan-700' },
}

export default function CetakExportPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  if (status === 'loading') return <div className="p-8 text-center text-zinc-500">Memuat...</div>
  if (!session) { router.push('/login'); return null }

  return (
    <AppShellTopbar>
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-zinc-900">Cetak &amp; Export</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CARDS.map((card, i) => {
            const c = colorMap[card.color]
            return (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
                <div className={`w-10 h-10 ${c.bg} rounded-lg flex items-center justify-center mb-3`}>
                  {card.color === 'blue' || card.color === 'purple' ? <Printer className={`w-5 h-5 ${c.text}`} /> :
                   card.color === 'cyan' ? <FileSpreadsheet className={`w-5 h-5 ${c.text}`} /> :
                   <FileText className={`w-5 h-5 ${c.text}`} />}
                </div>
                <h3 className="font-semibold text-zinc-900 mb-2">{card.title}</h3>
                <p className="text-xs text-zinc-500 mb-4">{card.desc}</p>
                {card.isSync ? (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm text-green-700">Terhubung</span>
                    </div>
                    <button className={'w-full px-4 py-2 text-white rounded-lg text-sm font-medium ' + c.btn + ' ' + c.hover}>Sinkron Sekarang</button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <select className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
                      {card.options.map((opt, j) => <option key={j}>{opt}</option>)}
                    </select>
                    <button className={'w-full px-4 py-2 text-white rounded-lg text-sm font-medium ' + c.btn + ' ' + c.hover}>
                      {card.title.includes('Export') ? 'Download' : 'Cetak'} {card.title.includes('Excel') ? 'Excel' : card.title.includes('PDF') ? 'PDF' : ''}
                    </button>
                  </div>
                )}
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
