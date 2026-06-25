import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { arsipDigital, employees, schools } from '@/db/schema'
import { eq, sql, and, like, desc } from 'drizzle-orm'
import { put } from '@vercel/blob'
import { uploadFileToDrive, getOrCreateSubfolder } from '@/lib/drive'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MODULE_FOLDERS: Record<string, string> = {
  pegawai: 'Dokumen Pegawai',
  sekolah: 'Dokumen Sekolah',
  surat: 'Dokumen Persuratan',
  lainnya: 'Dokumen Lainnya',
}

const JENIS_PEGAWAI = [
  'KTP', 'KK', 'NPWP', 'BPJS', 'SK CPNS', 'SK PNS', 'SK Pangkat',
  'SK Jabatan', 'SK Berkala', 'Karpeg', 'Taspen', 'Kartu ASN',
  'Ijazah', 'Sertifikat', 'Foto', 'Dokumen Lainnya',
]

export async function GET(req: NextRequest) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const userSekolahId = (session?.user as any)?.sekolah_id

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')
  const module_type = searchParams.get('module_type')
  const category = searchParams.get('category')
  const document_type = searchParams.get('document_type')
  const tahun = searchParams.get('tahun')
  const employee_id = searchParams.get('employee_id')
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')))

  let where = sql`1=1`
  if (role === 'operator_sekolah' && userSekolahId) {
    where = sql`${where} AND ${arsipDigital.school_id} = ${userSekolahId}`
  }
  if (module_type) where = sql`${where} AND ${arsipDigital.module_type} = ${module_type}`
  if (category) where = sql`${where} AND ${arsipDigital.category} = ${category}`
  if (document_type) where = sql`${where} AND ${arsipDigital.document_type} = ${document_type}`
  if (employee_id) where = sql`${where} AND ${arsipDigital.employee_id} = ${employee_id}`
  if (tahun) where = sql`${where} AND strftime('%Y', ${arsipDigital.uploaded_at} / 1000, 'unixepoch') = ${tahun}`
  if (q) {
    where = sql`${where} AND (
      ${arsipDigital.file_name} LIKE ${'%' + q + '%'}
      OR ${arsipDigital.document_type} LIKE ${'%' + q + '%'}
      OR ${arsipDigital.category} LIKE ${'%' + q + '%'}
      OR ${arsipDigital.deskripsi} LIKE ${'%' + q + '%'}
    )`
  }

  const countRes = await db.select({ total: sql<number>`COUNT(*)` }).from(arsipDigital).where(where)
  const total = countRes[0]?.total || 0

  const rows = await db
    .select({
      id: arsipDigital.id,
      ref_id: arsipDigital.ref_id,
      employee_id: arsipDigital.employee_id,
      school_id: arsipDigital.school_id,
      module_type: arsipDigital.module_type,
      category: arsipDigital.category,
      document_type: arsipDigital.document_type,
      file_name: arsipDigital.file_name,
      file_type: arsipDigital.file_type,
      file_size: arsipDigital.file_size,
      storage: arsipDigital.storage,
      file_url: arsipDigital.file_url,
      drive_url: arsipDigital.drive_url,
      uploaded_by: arsipDigital.uploaded_by,
      deskripsi: arsipDigital.deskripsi,
      uploaded_at: arsipDigital.uploaded_at,
      pegawai_nama: employees.nama,
      pegawai_nip: employees.nip,
      school_nama: schools.nama,
    })
    .from(arsipDigital)
    .leftJoin(employees, eq(arsipDigital.employee_id, employees.id))
    .leftJoin(schools, eq(arsipDigital.school_id, schools.id))
    .where(where)
    .orderBy(desc(arsipDigital.uploaded_at))
    .limit(limit)
    .offset((page - 1) * limit)

  const stats = await db
    .select({
      module_type: arsipDigital.module_type,
      total: sql<number>`COUNT(*)`,
      bytes: sql<number>`COALESCE(SUM(${arsipDigital.file_size}), 0)`,
    })
    .from(arsipDigital)
    .groupBy(arsipDigital.module_type)

  const totalArsip = stats.reduce((s, r) => s + r.total, 0)
  const totalBytes = stats.reduce((s, r) => s + r.bytes, 0)
  const statsMap: Record<string, { total: number; bytes: number }> = {}
  for (const s of stats) statsMap[s.module_type] = { total: s.total, bytes: s.bytes }

  return NextResponse.json({
    data: rows,
    stats: {
      totalArsip,
      totalPegawai: statsMap['pegawai']?.total || 0,
      totalSekolah: statsMap['sekolah']?.total || 0,
      totalSurat: statsMap['surat']?.total || 0,
      totalLainnya: statsMap['lainnya']?.total || 0,
      totalBytes,
    },
    pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
    filters: {
      jenisPegawai: JENIS_PEGAWAI,
    },
  })
}

export async function POST(req: NextRequest) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session?.user as any)?.role
  const userId = (session?.user as any)?.id
  const userSekolahId = (session?.user as any)?.sekolah_id

  const formData = await req.formData()
  const file = formData.get('file') as File
  const module_type = formData.get('module_type') as string
  const category = formData.get('category') as string
  const document_type = formData.get('document_type') as string
  const employee_id = formData.get('employee_id') as string
  const school_id = formData.get('school_id') as string
  const ref_id = formData.get('ref_id') as string
  const deskripsi = formData.get('deskripsi') as string

  if (!file || !module_type || !category || !document_type) {
    return NextResponse.json({ error: 'File, module_type, category, dan document_type wajib diisi' }, { status: 400 })
  }

  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: 'File maksimal 20 MB' }, { status: 400 })
  }

  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Format file tidak didukung. Gunakan PDF, JPG, PNG, DOC, DOCX, XLS, atau XLSX' }, { status: 400 })
  }

  const targetSekolahId = school_id || userSekolahId
  const buffer = Buffer.from(await file.arrayBuffer())
  const ext = file.name.split('.').pop()
  const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`

  let fileUrl = ''
  let driveFileId = ''
  let driveUrl = ''
  let storage: string

  if (process.env.GOOGLE_DRIVE_CLIENT_EMAIL) {
    try {
      const parentId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID || 'root'
      const folderName = MODULE_FOLDERS[module_type] || 'Dokumen Lainnya'
      const folderId = await getOrCreateSubfolder(parentId, 'Arsip Digital')
      const subfolderId = await getOrCreateSubfolder(folderId, folderName)
      const result = await uploadFileToDrive(subfolderId, fileName, buffer, file.type)
      driveFileId = result.fileId
      driveUrl = result.webViewLink
      storage = 'drive'
    } catch {
      storage = 'blob'
      const blob = await put(`arsip-digital/${fileName}`, buffer, { access: 'public', contentType: file.type })
      fileUrl = blob.url
    }
  } else {
    storage = 'blob'
    const blob = await put(`arsip-digital/${fileName}`, buffer, { access: 'public', contentType: file.type })
    fileUrl = blob.url
  }

  const record = await db.insert(arsipDigital).values({
    ref_id: ref_id || null,
    employee_id: employee_id || null,
    school_id: targetSekolahId || null,
    module_type,
    category,
    document_type,
    file_name: file.name,
    file_type: file.type,
    file_size: file.size,
    storage,
    file_url: fileUrl || null,
    drive_file_id: driveFileId || null,
    drive_url: driveUrl || null,
    uploaded_by: userId || null,
    deskripsi: deskripsi || null,
  }).returning()

  return NextResponse.json({ data: record[0] })
}
