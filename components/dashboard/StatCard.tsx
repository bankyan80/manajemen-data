'use client'

import { type ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: string
  icon: ReactNode
  color: string
  description?: string
}

const colorMap: Record<string, { bg: string; text: string; ring: string }> = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-700', ring: 'ring-blue-200' },
  teal: { bg: 'bg-teal-100', text: 'text-teal-700', ring: 'ring-teal-200' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-700', ring: 'ring-amber-200' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-700', ring: 'ring-purple-200' },
  green: { bg: 'bg-green-100', text: 'text-green-700', ring: 'ring-green-200' },
  red: { bg: 'bg-red-100', text: 'text-red-700', ring: 'ring-red-200' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-700', ring: 'ring-indigo-200' },
}

export default function StatCard({ title, value, icon, color, description }: StatCardProps) {
  const colors = colorMap[color] || colorMap.blue

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${colors.bg} ${colors.text} ring-2 ${colors.ring}`}>
            {icon}
          </div>
          <div>
            <p className="text-2xl font-bold text-zinc-900">{value}</p>
            <p className="text-xs font-medium text-zinc-500">{title}</p>
          </div>
        </div>
      </div>
      {description && (
        <p className="mt-2 text-xs text-zinc-400">{description}</p>
      )}
    </div>
  )
}
