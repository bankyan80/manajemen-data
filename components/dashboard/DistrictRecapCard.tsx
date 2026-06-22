'use client'

import { School, Users, BookOpen, FileText } from 'lucide-react'

export default function DistrictRecapCard({ stats, loading }: { stats?: any; loading?: boolean }) {
  const items = [
    { icon: <School className="h-4 w-4" />, label: 'SD', value: stats?.totalSD ?? '...', color: 'text-blue-600 bg-blue-100' },
    { icon: <Users className="h-4 w-4" />, label: 'KB', value: stats?.totalKB ?? '...', color: 'text-teal-600 bg-teal-100' },
    { icon: <BookOpen className="h-4 w-4" />, label: 'GTK', value: stats?.totalGTK ?? '...', color: 'text-amber-600 bg-amber-100' },
    { icon: <FileText className="h-4 w-4" />, label: 'Dokumen', value: stats?.totalDocuments ?? '...', color: 'text-purple-600 bg-purple-100' },
  ]
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-zinc-900">Rekap Kecamatan</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-2 rounded-lg border border-zinc-100 bg-zinc-50 p-4 text-center transition-colors hover:bg-white hover:shadow-sm">
            <div className={`flex h-9 w-9 items-center justify-center rounded-full ${item.color}`}>{item.icon}</div>
            <div>
              <p className="text-xl font-bold text-zinc-900">{loading ? '...' : item.value}</p>
              <p className="text-xs font-medium text-zinc-500">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
