import jsPDF from 'jspdf'
import 'jspdf-autotable'

export async function exportToPDF(
  title: string,
  headers: string[],
  data: any[][],
  fileName: string,
): Promise<Buffer> {
  const doc = new jsPDF()

  doc.setFontSize(14)
  doc.text('Aplikasi Laporan Pendidikan', 105, 15, { align: 'center' })
  doc.setFontSize(10)
  doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 105, 22, { align: 'center' })

  doc.setFontSize(12)
  doc.text(title, 14, 35)

  ;(doc as any).autoTable({
    head: [headers],
    body: data,
    startY: 40,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] },
    didDrawPage: (data: any) => {
      const pageHeight = doc.internal.pageSize.getHeight()
      const pageWidth = doc.internal.pageSize.getWidth()
      doc.setFontSize(8)
      doc.text(`Halaman ${data.pageNumber}`, 14, pageHeight - 10)
      doc.text('Dicetak oleh Sistem Aplikasi Laporan Pendidikan', pageWidth / 2, pageHeight - 10, {
        align: 'center',
      })
    },
  })

  const finalY = (doc as any).lastAutoTable.finalY + 20
  const pageHeight = doc.internal.pageSize.getHeight()

  if (finalY + 40 > pageHeight) {
    doc.addPage()
  }

  const signatureY = finalY > pageHeight ? 20 : finalY
  doc.setFontSize(10)
  doc.text('Mengetahui,', 14, signatureY)
  doc.text('Kepala Dinas Pendidikan Kecamatan', 14, signatureY + 7)
  doc.text('', 14, signatureY + 25)
  doc.text('( ______________________________ )', 14, signatureY + 32)
  doc.text('NIP. ______________________________', 14, signatureY + 39)

  const buffer = Buffer.from(doc.output('arraybuffer'))
  return buffer
}
