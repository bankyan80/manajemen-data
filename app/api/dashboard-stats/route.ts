import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { schools, employees, employeeDocuments, students, reports, studentRecaps } from '@/db/schema'
import { count, eq, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export async function GET() {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const [sdCount] = await db.select({ value: count() }).from(schools).where(eq(schools.jenjang, 'sd'))
  const [paudCount] = await db.select({ value: count() }).from(schools).where(eq(schools.jenjang, 'paud'))
  const [empCount] = await db.select({ value: count() }).from(employees)
  const [docCount] = await db.select({ value: count() }).from(employeeDocuments)
  const [stuCount] = await db.select({ value: count() }).from(students)
  const verified = await db.select({ value: count() }).from(employeeDocuments).where(eq(employeeDocuments.status_verifikasi, 'sudah_diverifikasi'))
  const pending = await db.select({ value: count() }).from(employeeDocuments).where(eq(employeeDocuments.status_verifikasi, 'belum_diverifikasi'))
  const [reportSubmitted] = await db.select({ value: count() }).from(reports).where(sql`${reports.status} != 'draft'`)

  const docTypes = await db
    .select({ jenis: employeeDocuments.jenis_dokumen, total: count() })
    .from(employeeDocuments)
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
    .orderBy(sql`${employeeDocuments.uploaded_at} desc nulls last`)
    .limit(6)

  const done = await db.select({ value: count() }).from(employeeDocuments).where(eq(employeeDocuments.status_kelengkapan, 'lengkap'))
  const incomplete = await db.select({ value: count() }).from(employeeDocuments).where(eq(employeeDocuments.status_kelengkapan, 'belum_lengkap'))

  return NextResponse.json({
    totalSD: sdCount.value,
    totalPAUD: paudCount.value,
    totalGTK: empCount.value,
    totalDocuments: docCount.value,
    totalStudents: stuCount.value,
    documentsVerified: verified[0]?.value || 0,
    documentsPending: pending[0]?.value || 0,
    reportsSubmitted: reportSubmitted.value,
    documentArchives: docTypes,
    latestDocuments: latestDocs,
    completionStats: {
      lengkap: done[0]?.value || 0,
      belum_lengkap: incomplete[0]?.value || 0,
    },
  })
}
