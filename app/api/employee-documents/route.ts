import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { employeeDocuments, employees, schools } from '@/db/schema'
import { eq, count, sql } from 'drizzle-orm'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export async function GET(req: NextRequest) {
  try {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const userSekolahId = (session?.user as any)?.sekolah_id

  const { searchParams } = new URL(req.url)
  const employee_id = searchParams.get('employee_id')

  let whereConditions = sql`1=1`

  if (role === 'operator_sekolah' && userSekolahId) {
    whereConditions = sql`${whereConditions} AND ${employeeDocuments.school_id} = ${userSekolahId}`
  }
  if (employee_id) whereConditions = sql`${whereConditions} AND ${employeeDocuments.employee_id} = ${employee_id}`

  const rows = await db
    .select({
      id: employeeDocuments.id,
      employee_id: employeeDocuments.employee_id,
      school_id: employeeDocuments.school_id,
      kategori: employeeDocuments.kategori,
      jenis_dokumen: employeeDocuments.jenis_dokumen,
      nama_file: employeeDocuments.nama_file,
      mime_type: employeeDocuments.mime_type,
      file_size: employeeDocuments.file_size,
      drive_url: employeeDocuments.drive_url,
      status_upload: employeeDocuments.status_upload,
      status_verifikasi: employeeDocuments.status_verifikasi,
      status_kelengkapan: employeeDocuments.status_kelengkapan,
      catatan_revisi: employeeDocuments.catatan_revisi,
      uploaded_at: employeeDocuments.uploaded_at,
      verified_at: employeeDocuments.verified_at,
      employee_nama: employees.nama,
      school_nama: schools.nama,
    })
    .from(employeeDocuments)
    .leftJoin(employees, eq(employeeDocuments.employee_id, employees.id))
    .leftJoin(schools, eq(employeeDocuments.school_id, schools.id))
    .where(whereConditions)
    .orderBy(sql`${employeeDocuments.uploaded_at} desc nulls last`)

  const byKategori = await db
    .select({ kategori: employeeDocuments.kategori, total: count() })
    .from(employeeDocuments)
    .where(whereConditions)
    .groupBy(employeeDocuments.kategori)
    .orderBy(sql`count(*) desc`)

  const statusCount = {
    lengkap: 0,
    belum_lengkap: 0,
    sudah_diverifikasi: 0,
    belum_diverifikasi: 0,
    sudah_diupload: 0,
    belum_diupload: 0,
  }

  for (const r of rows) {
    if (r.status_kelengkapan === 'lengkap') statusCount.lengkap++
    if (r.status_kelengkapan === 'belum_lengkap') statusCount.belum_lengkap++
    if (r.status_verifikasi === 'sudah_diverifikasi') statusCount.sudah_diverifikasi++
    if (r.status_verifikasi === 'belum_diverifikasi') statusCount.belum_diverifikasi++
    if (r.status_upload === 'sudah_diupload') statusCount.sudah_diupload++
    if (r.status_upload === 'belum_diupload') statusCount.belum_diupload++
  }

  return NextResponse.json({ data: rows, byKategori, statusCount })

  } catch (e) {
    console.error('[API Error]', e);
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Internal error' }, { status: 500 });
  }
  }

export async function POST(req: NextRequest) {
  try {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session?.user as any)?.role
  const userSekolahId = (session?.user as any)?.sekolah_id
  const userId = (session?.user as any)?.id

  const body = await req.json()
  const { employee_id, sekolah_id, kategori, jenis_dokumen, drive_url } = body

  if (!employee_id || !sekolah_id || !kategori || !jenis_dokumen || !drive_url) {
    return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 })
  }

  const id = randomUUID()
  const now = Date.now()

  await db.insert(employeeDocuments).values({
    id,
    employee_id,
    school_id: sekolah_id,
    kategori,
    jenis_dokumen,
    nama_file: jenis_dokumen,
    mime_type: 'application/octet-stream',
    file_size: 0,
    drive_file_id: '',
    drive_url,
    status_upload: 'sudah_diupload',
    status_verifikasi: 'belum_diverifikasi',
    status_kelengkapan: 'belum_lengkap',
    uploaded_by: userId,
    uploaded_at: now,
    created_at: now,
    updated_at: now,
  })

  return NextResponse.json({ id, message: 'Dokumen berhasil ditambahkan' })

  } catch (e) {
    console.error('[API Error]', e);
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Internal error' }, { status: 500 });
  }
  }
