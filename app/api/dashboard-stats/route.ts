import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { schools, employees, employeeDocuments, students, reports } from '@/db/schema'
import { count, eq, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export async function GET() {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const userSekolahId = (session?.user as any)?.sekolah_id

  const isOperator = role === 'operator_sekolah' && !!userSekolahId
  const _db = db!

  async function filterCount(table: any, col: any, conditions?: any) {
    const base = isOperator ? sql`${col} = ${userSekolahId}` : sql`1=1`
    const final = conditions ? sql`${base} AND ${conditions}` : base
    const [r] = await _db.select({ value: count() }).from(table).where(final)
    return r.value
  }

  const [sdCount] = isOperator
    ? await db.select({ value: count() }).from(schools).where(sql`${schools.id} = ${userSekolahId} AND ${schools.jenjang} = 'sd'`)
    : await db.select({ value: count() }).from(schools).where(eq(schools.jenjang, 'sd'))

  const [kbCount] = isOperator
    ? await db.select({ value: count() }).from(schools).where(sql`${schools.id} = ${userSekolahId} AND ${schools.jenjang} = 'kb'`)
    : await db.select({ value: count() }).from(schools).where(eq(schools.jenjang, 'kb'))

  const empCount = await filterCount(employees, employees.sekolah_id)
  const docCount = await filterCount(employeeDocuments, employeeDocuments.school_id)
  const stuCount = await filterCount(students, students.school_id)
  const verified = await filterCount(employeeDocuments, employeeDocuments.school_id, eq(employeeDocuments.status_verifikasi, 'sudah_diverifikasi'))
  const pending = await filterCount(employeeDocuments, employeeDocuments.school_id, eq(employeeDocuments.status_verifikasi, 'belum_diverifikasi'))

  const [reportSubmitted] = isOperator
    ? await db.select({ value: count() }).from(reports).where(sql`${reports.status} != 'draft' AND ${reports.school_id} = ${userSekolahId}`)
    : await db.select({ value: count() }).from(reports).where(sql`${reports.status} != 'draft'`)

  const docTypes = await db
    .select({ jenis: employeeDocuments.jenis_dokumen, total: count() })
    .from(employeeDocuments)
    .where(isOperator ? sql`${employeeDocuments.school_id} = ${userSekolahId}` : sql`1=1`)
    .groupBy(employeeDocuments.jenis_dokumen)
    .orderBy(sql`count(*) desc`)
    .limit(10)

  const latestDocs = await db
    .select({
      id: employeeDocuments.id,
      nama_file: employeeDocuments.nama_file,
      jenis_dokumen: employeeDocuments.jenis_dokumen,
      status_upload: employeeDocuments.status_upload,
      status_verifikasi: employeeDocuments.status_verifikasi,
      status_kelengkapan: employeeDocuments.status_kelengkapan,
      uploaded_at: employeeDocuments.uploaded_at,
      employee_nama: employees.nama,
      school_nama: schools.nama,
    })
    .from(employeeDocuments)
    .leftJoin(employees, eq(employeeDocuments.employee_id, employees.id))
    .leftJoin(schools, eq(employeeDocuments.school_id, schools.id))
    .where(isOperator ? sql`${employeeDocuments.school_id} = ${userSekolahId}` : sql`1=1`)
    .orderBy(sql`${employeeDocuments.uploaded_at} desc nulls last`)
    .limit(6)

  const done = await filterCount(employeeDocuments, employeeDocuments.school_id, eq(employeeDocuments.status_kelengkapan, 'lengkap'))
  const incomplete = await filterCount(employeeDocuments, employeeDocuments.school_id, eq(employeeDocuments.status_kelengkapan, 'belum_lengkap'))

  return NextResponse.json({
    totalSD: sdCount.value,
    totalKB: kbCount.value,
    totalGTK: empCount,
    totalDocuments: docCount,
    totalStudents: stuCount,
    documentsVerified: verified,
    documentsPending: pending,
    reportsSubmitted: reportSubmitted.value,
    documentArchives: docTypes,
    latestDocuments: latestDocs,
    completionStats: {
      lengkap: done,
      belum_lengkap: incomplete,
    },
  })
}
