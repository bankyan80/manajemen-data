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
  blue: { bg: 'bg-primary-soft', text: 'text-primary', ring: 'ring-primary-soft' },
  teal: { bg: 'bg-secondary-soft', text: 'text-secondary-dark', ring: 'ring-secondary-soft' },
  amber: { bg: 'bg-warning-soft', text: 'text-warning', ring: 'ring-warning-soft' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-700', ring: 'ring-purple-200' },
  green: { bg: 'bg-success-soft', text: 'text-success', ring: 'ring-success-soft' },
  red: { bg: 'bg-danger-soft', text: 'text-danger', ring: 'ring-danger-soft' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-700', ring: 'ring-indigo-200' },
}

export default function StatCard({ title, value, icon, color, description }: StatCardProps) {
  const colors = colorMap[color] || colorMap.blue

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${colors.bg} ${colors.text} ring-2 ${colors.ring}`}>
            {icon}
          </div>
          <div>
            <p className="text-2xl font-bold text-text-main">{value}</p>
            <p className="text-xs font-medium text-text-muted">{title}</p>
          </div>
        </div>
      </div>
      {description && (
        <p className="mt-2 text-xs text-text-muted">{description}</p>
      )}
    </div>
  )
}
