import { NextResponse } from 'next/server'
import { safeApi } from '@/lib/api-handler'
import { guardApi, guardDb } from '@/lib/api-guard'
import { db } from '@/lib/db'
import { studentRecaps, activityLogs, employees, schools } from '@/db/schema-v2'
import { and, gte, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

function getMonthLabel(m: number): string {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
  ]
  return months[m - 1] || ''
}

function getLast12Months(): { year: number; month: number; label: string }[] {
  const now = new Date()
  const result: { year: number; month: number; label: string }[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    result.push({ year: d.getFullYear(), month: d.getMonth() + 1, label: `${getMonthLabel(d.getMonth() + 1)} ${d.getFullYear()}` })
  }
  return result
}

export const GET = () => safeApi(async () => {
  const { error } = await guardApi()
  if (error) return error
  const dbErr = guardDb(db)
  if (dbErr.error) return dbErr.error

  const _db = db!
  const months = getLast12Months()
  const twelveMonthsAgo = months[0]
  const startDate = new Date(twelveMonthsAgo.year, twelveMonthsAgo.month - 1, 1)
  const startTs = startDate.getTime()

  const recapData = await _db
    .select({
      total: studentRecaps.total,
      createdAt: studentRecaps.created_at,
    })
    .from(studentRecaps)
    .where(gte(studentRecaps.created_at, startTs))

  const studentTrend = months.map((m) => {
    const start = new Date(m.year, m.month - 1, 1).getTime()
    const end = new Date(m.year, m.month, 1).getTime()
    const sum = recapData
      .filter((r) => r.createdAt >= start && r.createdAt < end)
      .reduce((acc, r) => acc + r.total, 0)
    return { month: m.label, value: sum }
  })

  const logData = await _db
    .select({
      createdAt: activityLogs.created_at,
    })
    .from(activityLogs)
    .where(
      and(
        gte(activityLogs.created_at, startTs),
        sql`${activityLogs.table_name} = 'employees'`,
      )
    )

  const teacherTrend = months.map((m) => {
    const start = new Date(m.year, m.month - 1, 1).getTime()
    const end = new Date(m.year, m.month, 1).getTime()
    const count = logData.filter((r) => r.createdAt >= start && r.createdAt < end).length
    return { month: m.label, value: count }
  })

  const schoolLogData = await _db
    .select({
      createdAt: activityLogs.created_at,
    })
    .from(activityLogs)
    .where(
      and(
        gte(activityLogs.created_at, startTs),
        sql`${activityLogs.table_name} = 'schools'`,
      )
    )

  const schoolTrend = months.map((m) => {
    const start = new Date(m.year, m.month - 1, 1).getTime()
    const end = new Date(m.year, m.month, 1).getTime()
    const count = schoolLogData.filter((r) => r.createdAt >= start && r.createdAt < end).length
    return { month: m.label, value: count }
  })

  return NextResponse.json({
    success: true,
    data: {
      studentTrend,
      teacherTrend,
      schoolTrend,
    },
  })
})
