import 'dotenv/config'
import { db } from '../lib/db'
import { arsipDigital, employeeDocuments } from './schema'
import { eq } from 'drizzle-orm'

async function main() {
  if (!db) {
    console.error('❌ DB not configured — pastikan TURSO_DB_URL dan TURSO_DB_TOKEN di .env')
    process.exit(1)
  }

  console.log('📄 Membaca dokumen pegawai yang sudah diupload...')
  const docs = await db
    .select()
    .from(employeeDocuments)
    .where(eq(employeeDocuments.status_upload, 'sudah_diupload'))

  if (docs.length === 0) {
    console.log('✅ Tidak ada dokumen pegawai yang perlu dimigrasi')
    process.exit(0)
  }

  console.log(`  → Ditemukan ${docs.length} dokumen`)

  let migrated = 0
  let skipped = 0
  let failed = 0

  for (const doc of docs) {
    try {
      const exists = await db
        .select({ id: arsipDigital.id })
        .from(arsipDigital)
        .where(eq(arsipDigital.drive_file_id, doc.drive_file_id))
        .limit(1)

      if (exists.length > 0) {
        skipped++
        continue
      }

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

      migrated++
    } catch (err: any) {
      console.error(`  ❌ Gagal migrasi ${doc.nama_file}: ${err.message}`)
      failed++
    }
  }

  console.log()
  console.log('✅ Migrasi selesai:')
  console.log(`  - Berhasil: ${migrated}`)
  console.log(`  - Dilewati (sudah ada): ${skipped}`)
  console.log(`  - Gagal: ${failed}`)
  console.log(`  - Total: ${docs.length}`)

  process.exit(0)
}

main()
