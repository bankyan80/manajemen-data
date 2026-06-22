'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const COLORS = ['#22c55e', '#ef4444', '#f59e0b']

export default function CompletionDonutChart({ stats, loading }: { stats?: { lengkap: number; belum_lengkap: number }; loading?: boolean }) {
  const data = [
    { name: 'Lengkap', value: stats?.lengkap || 0, color: '#22c55e' },
    { name: 'Belum Lengkap', value: stats?.belum_lengkap || 0, color: '#ef4444' },
  ]

  if (loading) {
    return (
      <div className="card p-5">
        <h3 className="mb-4 text-base font-semibold text-text-main">Status Kelengkapan Dokumen</h3>
        <div className="flex h-[280px] items-center justify-center text-sm text-text-muted">Memuat...</div>
      </div>
    )
  }

  return (
    <div className="card p-5">
      <h3 className="mb-4 text-base font-semibold text-text-main">Status Kelengkapan Dokumen</h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
              {data.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index]} />)}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(15,23,42,0.1)', fontSize: '13px' }} formatter={(value) => [`${value} dokumen`, 'Jumlah']} />
            <Legend verticalAlign="bottom" height={36} formatter={(value: string) => <span className="text-xs text-text-muted">{value}</span>} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
