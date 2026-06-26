import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { arsipDigital, employees } from '@/db/schema'
import { getFileMetadata, parseDriveUrl, listFilesInFolder, listSubfolders, detectDocumentType } from '@/lib/drive'
import { like } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface ImportFile {
  url: string
  fileId: string
  employee_id?: string
  document_type?: string
}

async function resolveLinks(
  inputLinks: string[],
  options: { autoMap?: boolean; defaultCategory?: string },
): Promise<ImportFile[]> {
  const resolved: ImportFile[] = []
  const driveAvailable = !!process.env.GOOGLE_DRIVE_CLIENT_EMAIL

  let pegawaiList: { id: string; nama: string; nip: string | null }[] = []
  if (options.autoMap) {
    pegawaiList = await db!
      .select({ id: employees.id, nama: employees.nama, nip: employees.nip })
      .from(employees)
      .then(rows => rows)
  }

  function matchEmployee(fileName: string): string | undefined {
    const name = fileName.replace(/\.[^.]+$/, '').trim().toLowerCase()
    for (const e of pegawaiList) {
      if (e.nip && name.includes(e.nip)) return e.id
      if (name.includes(e.nama.toLowerCase())) return e.id
    }
    return undefined
  }

  for (const raw of inputLinks) {
    const url = raw.trim()
    if (!url) continue
    const parsed = parseDriveUrl(url)
    if (!parsed) { resolved.push({ url, fileId: url }); continue }

    if (parsed.type === 'folder' && driveAvailable) {
      const subfolders = await listSubfolders(parsed.id)
      if (subfolders.length > 0 && options.autoMap) {
        for (const sf of subfolders) {
          const match = pegawaiList.find(e =>
            e.nama.toLowerCase().includes(sf.name.toLowerCase()) ||
            sf.name.toLowerCase().includes(e.nama.toLowerCase()),
          )
          const files = await listFilesInFolder(sf.id)
          for (const f of files) {
            if (f.mimeType === 'application/vnd.google-apps.folder') continue
            const dt = detectDocumentType(f.name)
            resolved.push({
              url: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
              fileId: f.id,
              employee_id: match?.id,
              document_type: dt || options.defaultCategory || undefined,
            })
          }
        }
      } else {
        const files = await listFilesInFolder(parsed.id)
        for (const f of files) {
          if (f.mimeType === 'application/vnd.google-apps.folder') continue
          const dt = detectDocumentType(f.name)
          resolved.push({
            url: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
            fileId: f.id,
            employee_id: options.autoMap ? matchEmployee(f.name) : undefined,
            document_type: dt || options.defaultCategory || undefined,
          })
        }
      }
    } else {
      const dt = driveAvailable ? detectDocumentType(url) : null
      resolved.push({
        url, fileId: parsed.id,
        employee_id: options.autoMap ? matchEmployee(url) : undefined,
        document_type: dt || options.defaultCategory || undefined,
      })
    }
  }
  return resolved
}

export async function POST(req: NextRequest) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session?.user as any)?.id
  const userSekolahId = (session?.user as any)?.sekolah_id

  const body = await req.json()
  const { links, module_type, category, document_type, employee_id, school_id, deskripsi, auto_map } = body

  if (!links || !Array.isArray(links) || links.length === 0) {
    return NextResponse.json({ error: 'Links wajib diisi (array URL)' }, { status: 400 })
  }
  if (!module_type) {
    return NextResponse.json({ error: 'module_type wajib diisi' }, { status: 400 })
  }

  const targetSekolahId = school_id || userSekolahId
  const driveAvailable = !!process.env.GOOGLE_DRIVE_CLIENT_EMAIL
  const isAutoMap = auto_map === true && module_type === 'pegawai'

  const resolved = await resolveLinks(links, { autoMap: isAutoMap, defaultCategory: category })
  if (resolved.length === 0) {
    return NextResponse.json({ error: 'Tidak ada file yang ditemukan dari link yang diberikan' }, { status: 400 })
  }

  const results: { success: boolean; url: string; file_name?: string; employee_match?: string; doc_type?: string; error?: string }[] = []
  const inserted: any[] = []

  for (const item of resolved) {
    try {
      let fileName = item.url
      let fileType = 'application/octet-stream'
      let fileSize = 0
      let driveFileId = item.fileId
      let driveUrl = item.url

      if (driveAvailable) {
        const meta = await getFileMetadata(item.fileId)
        if (meta) {
          fileName = meta.name
          fileType = meta.mimeType
          fileSize = meta.size
          driveUrl = meta.webViewLink || item.url
        }
      }

      const finalEmployeeId = item.employee_id || employee_id || null
      const finalDocType = item.document_type || document_type || category || 'Dokumen Lainnya'

      const record = await db.insert(arsipDigital).values({
        employee_id: finalEmployeeId,
        school_id: targetSekolahId || null,
        module_type,
        category: category || 'Dokumen Lainnya',
        document_type: finalDocType,
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize,
        storage: 'drive',
        file_url: null,
        drive_file_id: driveFileId,
        drive_url: driveUrl,
        uploaded_by: userId || null,
        deskripsi: deskripsi || null,
      }).returning()

      inserted.push(record[0])
      results.push({
        success: true,
        url: item.url,
        file_name: fileName,
        employee_match: finalEmployeeId || undefined,
        doc_type: finalDocType,
      })
    } catch (err: any) {
      results.push({ success: false, url: item.url, error: err.message })
    }
  }

  return NextResponse.json({
    data: inserted,
    results,
    summary: {
      total: resolved.length,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      autoMapped: isAutoMap,
    },
  })
}
