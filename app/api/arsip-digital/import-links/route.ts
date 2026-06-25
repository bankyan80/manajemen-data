import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { arsipDigital } from '@/db/schema'
import { getFileMetadata, parseDriveUrl, listFilesInFolder } from '@/lib/drive'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function resolveLinks(inputLinks: string[]): Promise<{ url: string; fileId: string }[]> {
  const resolved: { url: string; fileId: string }[] = []
  const driveAvailable = !!process.env.GOOGLE_DRIVE_CLIENT_EMAIL

  for (const raw of inputLinks) {
    const url = raw.trim()
    if (!url) continue
    const parsed = parseDriveUrl(url)
    if (!parsed) {
      resolved.push({ url, fileId: url })
      continue
    }

    if (parsed.type === 'folder' && driveAvailable) {
      const files = await listFilesInFolder(parsed.id)
      for (const f of files) {
        if (f.mimeType === 'application/vnd.google-apps.folder') continue
        resolved.push({ url: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`, fileId: f.id })
      }
    } else {
      resolved.push({ url, fileId: parsed.id })
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
  const { links, module_type, category, document_type, employee_id, school_id, deskripsi } = body

  if (!links || !Array.isArray(links) || links.length === 0) {
    return NextResponse.json({ error: 'Links wajib diisi (array URL)' }, { status: 400 })
  }
  if (!module_type || !category || !document_type) {
    return NextResponse.json({ error: 'module_type, category, dan document_type wajib diisi' }, { status: 400 })
  }

  const targetSekolahId = school_id || userSekolahId
  const driveAvailable = !!process.env.GOOGLE_DRIVE_CLIENT_EMAIL

  const resolved = await resolveLinks(links)
  if (resolved.length === 0) {
    return NextResponse.json({ error: 'Tidak ada file yang ditemukan dari link yang diberikan' }, { status: 400 })
  }

  const results: { success: boolean; url: string; file_name?: string; error?: string }[] = []
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

      const record = await db.insert(arsipDigital).values({
        employee_id: employee_id || null,
        school_id: targetSekolahId || null,
        module_type,
        category,
        document_type,
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
      results.push({ success: true, url: item.url, file_name: fileName })
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
      folderCount: links.length - resolved.length > 0 ? links.length - resolved.length : 0,
    },
  })
}
