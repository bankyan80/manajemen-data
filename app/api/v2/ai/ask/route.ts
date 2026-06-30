import { NextRequest, NextResponse } from 'next/server'
import { safeApi } from '@/lib/api-handler'
import { guardApi } from '@/lib/api-guard'
import { db } from '@/lib/db'
import { schools, employees, students } from '@/db/schema'
import { eq, count, sql, and } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export const GET = (req: NextRequest) => safeApi(async () => {
  const { error: authErr } = await guardApi()
  if (authErr) return authErr
  if (!db) return NextResponse.json({ success: false, error: 'DB not configured' }, { status: 500 })

  const _db = db
  const question = req.nextUrl.searchParams.get('q')?.toLowerCase() || ''

  if (question.includes('sekolah') && (question.includes('butuh') || question.includes('kekurangan') || question.includes('kurang'))) {
    const schoolRows = await _db
      .select({ id: schools.id, nama: schools.nama, desa: schools.desa })
      .from(schools)
      .where(eq(schools.is_active, 1))

    const counts = await _db
      .select({ school_id: employees.sekolah_id, value: count() })
      .from(employees)
      .where(eq(employees.is_active, 1))
      .groupBy(employees.sekolah_id)

    const countMap = new Map(counts.map(c => [c.school_id, Number(c.value)]))
    const results = schoolRows
      .map(s => ({ id: s.id, nama: s.nama, desa: s.desa, teacherCount: countMap.get(s.id) || 0 }))
      .filter(s => s.teacherCount < 7)
      .sort((a, b) => a.teacherCount - b.teacherCount)
      .slice(0, 10)

    return NextResponse.json({
      success: true,
      data: {
        question,
        answer: `${results.length} sekolah mengalami kekurangan guru (< 7 guru). ${results.slice(0, 5).map(s => `${s.nama} (${s.teacherCount} guru)`).join(', ')}${results.length > 5 ? `, dan ${results.length - 5} lainnya` : ''}.`,
        data: results,
      },
    })
  }

  if (question.includes('sertifikasi') || question.includes('belum')) {
    const total = await _db.select({ value: count() }).from(employees).where(eq(employees.is_active, 1))
    const certified = await _db.select({ value: count() }).from(employees).where(and(eq(employees.is_active, 1), eq(employees.sertifikasi, 'sudah')))
    const pct = total[0].value > 0 ? Math.round((certified[0].value / total[0].value) * 100) : 0
    return NextResponse.json({
      success: true,
      data: {
        question,
        answer: `${pct}% guru sudah tersertifikasi (${certified[0].value} dari ${total[0].value}). ${pct < 50 ? 'Perlu percepatan program sertifikasi.' : 'Progress cukup baik.'}`,
      },
    })
  }

  if (question.includes('pensiun')) {
    const now = new Date()
    const todayStr = now.toISOString().slice(0, 10)
    const fiveYearsLater = new Date(now.getFullYear() + 5, now.getMonth(), now.getDate())
    const fiveYearsStr = fiveYearsLater.toISOString().slice(0, 10)

    const result = await _db
      .select({ value: count() })
      .from(employees)
      .where(
        and(
          eq(employees.is_active, 1),
          sql`${employees.tanggal_bup} IS NOT NULL`,
          sql`${employees.tanggal_bup} >= ${todayStr}`,
          sql`${employees.tanggal_bup} <= ${fiveYearsStr}`,
        )
      )

    return NextResponse.json({
      success: true,
      data: {
        question,
        answer: `${result[0].value} guru akan pensiun dalam 5 tahun ke depan. Perlu regenerasi ${Math.ceil(result[0].value / 5)} guru per tahun.`,
      },
    })
  }

  return NextResponse.json({
    success: true,
    data: {
      question,
      answer: 'Maaf, saya belum bisa menjawab pertanyaan tersebut. Coba tanyakan tentang: kekurangan guru, sertifikasi, atau pensiun guru.',
    },
  })
})
