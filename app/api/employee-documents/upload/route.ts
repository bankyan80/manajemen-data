import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { employeeDocuments } from '@/db/schema'
import { randomUUID } from 'crypto'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export async function POST(req: NextRequest) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session?.user as any)?.id

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const employee_id = formData.get('employee_id') as string
  const sekolah_id = formData.get('sekolah_id') as string
  const kategori = formData.get('kategori') as string
  const jenis_dokumen = formData.get('jenis_dokumen') as string

  if (!file || !employee_id || !sekolah_id || !kategori || !jenis_dokumen) {
    return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 })
  }

  const id = randomUUID()
  const ext = file.name.split('.').pop() || ''
  const fileName = `${id}.${ext}`
  const uploadDir = join(process.cwd(), 'public', 'uploads', 'employee-documents')
  const filePath = join(uploadDir, fileName)

  await mkdir(uploadDir, { recursive: true })
  const bytes = await file.arrayBuffer()
  await writeFile(filePath, Buffer.from(bytes))

  const fileUrl = `/uploads/employee-documents/${fileName}`
  const now = Date.now()

  await db.insert(employeeDocuments).values({
    id,
    employee_id,
    school_id: sekolah_id,
    kategori,
    jenis_dokumen,
    nama_file: file.name,
    mime_type: file.type,
    file_size: file.size,
    drive_file_id: '',
    drive_url: fileUrl,
    status_upload: 'sudah_diupload',
    status_verifikasi: 'belum_diverifikasi',
    status_kelengkapan: 'belum_lengkap',
    uploaded_by: userId,
    uploaded_at: now,
    created_at: now,
    updated_at: now,
  })

  return NextResponse.json({ id, message: 'Dokumen berhasil diupload', url: fileUrl })
}
