'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const COLORS = ['#10b981', '#ef4444', '#f59e0b']

export default function CompletionDonutChart({ stats, loading }: { stats?: { lengkap: number; belum_lengkap: number }; loading?: boolean }) {
  const data = [
    { name: 'Lengkap', value: stats?.lengkap || 0, color: '#10b981' },
    { name: 'Belum Lengkap', value: stats?.belum_lengkap || 0, color: '#ef4444' },
  ]

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-zinc-900">Status Kelengkapan Dokumen</h3>
        <div className="flex h-[280px] items-center justify-center text-sm text-zinc-400">Memuat...</div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-zinc-900">Status Kelengkapan Dokumen</h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
              {data.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index]} />)}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '13px' }} formatter={(value) => [`${value} dokumen`, 'Jumlah']} />
            <Legend verticalAlign="bottom" height={36} formatter={(value: string) => <span className="text-xs text-zinc-600">{value}</span>} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
