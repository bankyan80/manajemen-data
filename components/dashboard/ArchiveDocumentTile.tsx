'use client'

import { type ReactNode } from 'react'

interface ArchiveDocumentTileProps {
  icon: ReactNode
  title: string
  count: number
  color: string
}

const borderColorMap: Record<string, string> = {
  blue: 'border-l-blue-500',
  teal: 'border-l-teal-500',
  amber: 'border-l-amber-500',
  purple: 'border-l-purple-500',
  green: 'border-l-green-500',
  red: 'border-l-red-500',
  indigo: 'border-l-indigo-500',
  pink: 'border-l-pink-500',
  cyan: 'border-l-cyan-500',
  orange: 'border-l-orange-500',
}

const iconBgMap: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-700',
  teal: 'bg-teal-100 text-teal-700',
  amber: 'bg-amber-100 text-amber-700',
  purple: 'bg-purple-100 text-purple-700',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  indigo: 'bg-indigo-100 text-indigo-700',
  pink: 'bg-pink-100 text-pink-700',
  cyan: 'bg-cyan-100 text-cyan-700',
  orange: 'bg-orange-100 text-orange-700',
}

export default function ArchiveDocumentTile({ icon, title, count, color }: ArchiveDocumentTileProps) {
  const border = borderColorMap[color] || 'border-l-zinc-400'
  const iconBg = iconBgMap[color] || 'bg-zinc-100 text-zinc-700'

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border border-zinc-200 border-l-4 bg-white p-3 shadow-sm transition-all hover:shadow-md ${border}`}
    >
      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-zinc-600 truncate">{title}</p>
        <p className="text-lg font-bold text-zinc-900">{count.toLocaleString()}</p>
      </div>
    </div>
  )
}
