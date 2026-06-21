'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const data = [
  { month: 'Jan', masuk: 28, terverifikasi: 22 },
  { month: 'Feb', masuk: 31, terverifikasi: 25 },
  { month: 'Mar', masuk: 35, terverifikasi: 28 },
  { month: 'Apr', masuk: 30, terverifikasi: 26 },
  { month: 'Mei', masuk: 38, terverifikasi: 30 },
  { month: 'Jun', masuk: 33, terverifikasi: 27 },
  { month: 'Jul', masuk: 29, terverifikasi: 24 },
  { month: 'Agu', masuk: 36, terverifikasi: 29 },
  { month: 'Sep', masuk: 34, terverifikasi: 28 },
  { month: 'Okt', masuk: 32, terverifikasi: 26 },
  { month: 'Nov', masuk: 37, terverifikasi: 31 },
  { month: 'Des', masuk: 35, terverifikasi: 30 },
]

export default function MonthlyReportChart() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-zinc-900">
        Monitoring Laporan Bulanan
      </h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: '#71717a' }}
              axisLine={{ stroke: '#e4e4e7' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#71717a' }}
              axisLine={{ stroke: '#e4e4e7' }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e4e4e7',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                fontSize: '13px',
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value: string) => (
                <span className="text-xs text-zinc-600">{value}</span>
              )}
            />
            <Bar
              dataKey="masuk"
              name="Laporan Masuk"
              fill="#14b8a6"
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
            />
            <Bar
              dataKey="terverifikasi"
              name="Laporan Terverifikasi"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
