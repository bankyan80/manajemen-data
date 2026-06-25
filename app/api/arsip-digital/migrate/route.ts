import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { arsipDigital, employeeDocuments } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST() {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session?.user as any)?.role
  if (role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const docs = await db
    .select()
    .from(employeeDocuments)
    .where(eq(employeeDocuments.status_upload, 'sudah_diupload'))

  if (docs.length === 0) {
    return NextResponse.json({ message: 'Tidak ada dokumen pegawai yang perlu dimigrasi', migrated: 0 })
  }

  let migratedCount = 0
  const errors: string[] = []

  for (const doc of docs) {
    try {
      const exists = await db
        .select({ id: arsipDigital.id })
        .from(arsipDigital)
        .where(eq(arsipDigital.drive_file_id, doc.drive_file_id))
        .limit(1)

      if (exists.length > 0) continue

      await db.insert(arsipDigital).values({
        employee_id: doc.employee_id,
        school_id: doc.school_id,
        module_type: 'pegawai',
        category: doc.kategori,
        document_type: doc.jenis_dokumen,
        file_name: doc.nama_file,
        file_type: doc.mime_type,
        file_size: doc.file_size,
        storage: 'drive',
        file_url: null,
        drive_file_id: doc.drive_file_id,
        drive_url: doc.drive_url,
        uploaded_by: doc.uploaded_by || null,
        deskripsi: doc.catatan_revisi || null,
        uploaded_at: doc.uploaded_at || Date.now(),
      })

      migratedCount++
    } catch (err: any) {
      errors.push(`Dokumen ${doc.nama_file}: ${err.message}`)
    }
  }

  return NextResponse.json({
    message: `Berhasil migrasi ${migratedCount} dari ${docs.length} dokumen ke Arsip Digital`,
    migrated: migratedCount,
    total: docs.length,
    errors: errors.length > 0 ? errors : undefined,
  })
}
