import { google } from 'googleapis'
import { Readable } from 'stream'

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL!,
  key: (process.env.GOOGLE_DRIVE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/drive.file'],
})

const drive = google.drive({ version: 'v3', auth })

export async function createDriveFolder(parentId: string, folderName: string): Promise<string> {
  const response = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id',
  })

  return response.data.id!
}

export async function uploadFileToDrive(
  folderId: string,
  fileName: string,
  fileBuffer: Buffer,
  mimeType: string,
): Promise<{ fileId: string; webViewLink: string }> {
  const readable = new Readable()
  readable.push(fileBuffer)
  readable.push(null)

  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: readable,
    },
    fields: 'id, webViewLink',
  })

  return {
    fileId: response.data.id!,
    webViewLink: response.data.webViewLink!,
  }
}

export async function deleteFileFromDrive(fileId: string): Promise<void> {
  await drive.files.delete({ fileId })
}

export async function listFilesInFolder(folderId: string): Promise<any[]> {
  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType, size, webViewLink, createdTime)',
  })

  return response.data.files || []
}

export async function getFileMetadata(fileId: string): Promise<{ name: string; mimeType: string; size: number; webViewLink: string } | null> {
  try {
    const response = await drive.files.get({
      fileId,
      fields: 'id, name, mimeType, size, webViewLink',
    })
    if (!response.data) return null
    return {
      name: response.data.name || 'unknown',
      mimeType: response.data.mimeType || 'application/octet-stream',
      size: parseInt(response.data.size || '0'),
      webViewLink: response.data.webViewLink || '',
    }
  } catch {
    return null
  }
}

const DRIVE_URL_PATTERNS = [
  { pattern: /^https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/, type: 'file' as const },
  { pattern: /^https:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/, type: 'unknown' as const },
  { pattern: /^https:\/\/docs\.google\.com\/(?:document|spreadsheets|presentation)\/d\/([a-zA-Z0-9_-]+)/, type: 'file' as const },
  { pattern: /^https:\/\/drive\.google\.com\/drive\/folders\/([a-zA-Z0-9_-]+)/, type: 'folder' as const },
  { pattern: /^https:\/\/drive\.google\.com\/drive\/u\/\d+\/folders\/([a-zA-Z0-9_-]+)/, type: 'folder' as const },
]

export function parseDriveUrl(url: string): { id: string; type: 'file' | 'folder' | 'unknown' } | null {
  url = url.trim()
  for (const { pattern, type } of DRIVE_URL_PATTERNS) {
    const match = url.match(pattern)
    if (match) return { id: match[1], type }
  }
  return null
}

export async function isFolder(fileId: string): Promise<boolean> {
  try {
    const response = await drive.files.get({ fileId, fields: 'mimeType' })
    return response.data.mimeType === 'application/vnd.google-apps.folder'
  } catch {
    return false
  }
}

export async function getOrCreateSubfolder(parentId: string, folderName: string): Promise<string> {
  const response = await drive.files.list({
    q: `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id)',
  })

  if (response.data.files && response.data.files.length > 0) {
    return response.data.files[0].id!
  }

  return createDriveFolder(parentId, folderName)
}
