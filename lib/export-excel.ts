import * as XLSX from 'xlsx'

export async function exportToExcel(data: any[], sheetName: string, fileName: string): Promise<Buffer> {
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.json_to_sheet(data)

  const columnWidths = Object.keys(data[0] || {}).map((key) => {
    const maxLength = Math.max(
      key.length,
      ...data.map((item) => String(item[key] ?? '').length),
    )
    return { wch: maxLength + 2 }
  })
  worksheet['!cols'] = columnWidths

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  const buffer: Buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  return buffer
}
