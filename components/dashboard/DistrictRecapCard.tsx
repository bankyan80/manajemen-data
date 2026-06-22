'use client'

import { School, Users, BookOpen, FileText } from 'lucide-react'

export default function DistrictRecapCard({ stats, loading }: { stats?: any; loading?: boolean }) {
  const items = [
    { icon: <School className="h-4 w-4" />, label: 'SD', value: stats?.totalSD ?? '...', color: 'text-primary bg-primary-soft' },
    { icon: <Users className="h-4 w-4" />, label: 'KB', value: stats?.totalKB ?? '...', color: 'text-secondary-dark bg-secondary-soft' },
    { icon: <BookOpen className="h-4 w-4" />, label: 'GTK', value: stats?.totalGTK ?? '...', color: 'text-warning bg-warning-soft' },
    { icon: <FileText className="h-4 w-4" />, label: 'Dokumen', value: stats?.totalDocuments ?? '...', color: 'text-purple-700 bg-purple-100' },
  ]
  return (
    <div className="card p-5">
      <h3 className="mb-4 text-base font-semibold text-text-main">Rekap Kecamatan</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-2 rounded-xl border border-border bg-zinc-50 p-4 text-center transition-all hover:border-primary-soft hover:bg-primary-soft/30 hover:shadow-sm">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.color}`}>{item.icon}</div>
            <div>
              <p className="text-xl font-bold text-text-main">{loading ? '...' : item.value}</p>
              <p className="text-xs font-medium text-text-muted">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
