import { google } from 'googleapis'

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL!,
  key: (process.env.GOOGLE_SHEETS_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

const sheets = google.sheets({ version: 'v4', auth })

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!

export async function syncToSpreadsheet(sheetName: string, data: any[][]): Promise<void> {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: data },
  })
}

export async function appendToSheet(sheetName: string, values: any[][]): Promise<void> {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values },
  })
}

export async function clearSheetRange(sheetName: string, range: string): Promise<void> {
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!${range}`,
  })
}
