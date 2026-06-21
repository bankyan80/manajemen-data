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
