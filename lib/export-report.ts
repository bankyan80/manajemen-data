import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

type DetailData = Record<string, unknown>

function safeVal(v: unknown): string {
  if (v === null || v === undefined) return '-'
  return String(v)
}

function cols(keys: string[], labels: string[]): { key: string; label: string }[] {
  return keys.map((k, i) => ({ key: k, label: labels[i] || k }))
}

function rowsFrom(arr: unknown[], keys: string[]): Record<string, string>[] {
  return (arr as any[]).map(item => {
    const r: Record<string, string> = {}
    for (const k of keys) r[k] = safeVal(item[k])
    return r
  })
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function getHeader(summary: any, type: string, label: string): string[] {
  return [
    `Laporan ${label} - Kecamatan Lemahabang`,
    `Total Sekolah: ${summary?.totalSchools || 0} (SD: ${summary?.sdSchools || 0} | TK: ${summary?.tkSchools || 0} | KB: ${summary?.kbSchools || 0})`,
    `Total Siswa: ${(summary?.totalStudents || 0).toLocaleString()} | Total Guru: ${(summary?.totalTeachers || 0).toLocaleString()}`,
    `Dibuat: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}`,
  ]
}

// ─── Excel ─────────────────────────────────────────────────────

export function exportExcel(type: string, label: string, summary: any, details: DetailData) {
  const wb = XLSX.utils.book_new()

  const headerRows = getHeader(summary, type, label).map(h => [h])
  headerRows.push([])

  let sheetData: string[][] = []
  let sheetName = 'Detail'

  switch (type) {
    case 'monthly': {
      const sisPerKelas = (details.siswaPerKelas || []) as any[]
      sheetData = [
        ...headerRows,
        ['Data Siswa per Kelas'],
        ['Jenjang', 'Kelas/Kelompok', 'Laki-laki', 'Perempuan', 'Total'],
        ...sisPerKelas.map(s => [safeVal(s.jenjang), safeVal(s.kelas_kelompok), safeVal(s.laki), safeVal(s.perempuan), safeVal(s.total)]),
        [],
        ['Mutasi Masuk', safeVal(details.mutasiMasuk)],
        ['Mutasi Keluar', safeVal(details.mutasiKeluar)],
        ['Periode', safeVal(details.periode)],
      ]
      break
    }
    case 'semester': {
      const recaps = (details.recaps || []) as any[]
      sheetData = [
        ...headerRows,
        ['Rekapitulasi Semester'],
        ['TP', 'Semester', 'Laki-laki', 'Perempuan', 'Total', 'Masuk', 'Keluar'],
        ...recaps.map(r => [safeVal(r.tahun_pelajaran), safeVal(r.semester), safeVal(r.totalLaki), safeVal(r.totalPerempuan), safeVal(r.total), safeVal(r.siswaMasuk), safeVal(r.siswaKeluar)]),
        [],
        ['Ringkasan Ganjil', safeVal((details.ringkasanGanjil as any)?.total), 'Masuk:', safeVal((details.ringkasanGanjil as any)?.masuk), 'Keluar:', safeVal((details.ringkasanGanjil as any)?.keluar)],
        ['Ringkasan Genap', safeVal((details.ringkasanGenap as any)?.total), 'Masuk:', safeVal((details.ringkasanGenap as any)?.masuk), 'Keluar:', safeVal((details.ringkasanGenap as any)?.keluar)],
      ]
      break
    }
    case 'annual': {
      const trendSd = (details.trendSd || []) as any[]
      const alumni = (details.alumni || []) as any[]
      sheetData = [
        ...headerRows,
        ['Trend Tahunan SD'],
        ['Tahun', 'Siswa'],
        ...trendSd.map(t => [safeVal(t.tahun), safeVal(t.total)]),
        [],
        ['Alumni'],
        ['Tahun Lulus', 'Jumlah'],
        ...alumni.map(a => [safeVal(a.tahun_lulus), safeVal(a.total)]),
        [],
        ['Pertumbuhan SD', safeVal(details.pertumbuhanSd)],
      ]
      break
    }
    case 'gis': {
      const sebaran = (details.sebaranDesa || []) as any[]
      sheetData = [
        ...headerRows,
        ['Sebaran Sekolah per Desa'],
        ['Desa', 'SD', 'TK', 'KB', 'Total'],
        ...sebaran.map(s => [safeVal(s.desa), safeVal(s.sd), safeVal(s.tk), safeVal(s.kb), safeVal(s.total)]),
        [],
        ['Sekolah Berkoordinat', safeVal(details.sekolahBerkoordinat)],
        ['Sekolah Tanpa Koordinat', safeVal(details.sekolahTanpaKoordinat)],
      ]
      break
    }
    case 'certification': {
      const ss = (details.statusSertifikasi || {}) as any
      const perSek = (details.perSekolah || []) as any[]
      sheetData = [
        ...headerRows,
        ['Rekapitulasi Sertifikasi per Sekolah'],
        ['Sekolah', 'Jenjang', 'Total Guru', 'Tersertifikasi', 'Belum'],
        ...perSek.map(s => [safeVal(s.sekolahNama), safeVal(s.jenjang), safeVal(s.totalGuru), safeVal(s.tersertifikasi), safeVal(s.belumSertifikasi)]),
        [],
        ['Total Tersertifikasi', safeVal(ss.sudah)],
        ['Total Belum', safeVal(ss.belum)],
        ['Persentase', safeVal(ss.persenSudah) + '%'],
      ]
      break
    }
    case 'shortage': {
      const analisis = (details.analisis || []) as any[]
      const rekap = (details.rekapitulasi || {}) as any
      sheetData = [
        ...headerRows,
        ['Analisis Kekurangan Guru'],
        ['Sekolah', 'Jenjang', 'Siswa', 'Guru', 'Target', 'Kurang', 'Rasio', 'Status'],
        ...analisis.map(a => [safeVal(a.sekolahNama), safeVal(a.jenjang), safeVal(a.jumlahSiswa), safeVal(a.jumlahGuru), safeVal(a.targetGuru), safeVal(a.kekuranganGuru), safeVal(a.rasioSiswaGuru), safeVal(a.statusKetenagaan)]),
        [],
        ['Sekolah Kekurangan', safeVal(rekap.kekurangan)],
        ['Sekolah Ideal', safeVal(rekap.ideal)],
        ['Kelebihan Siswa', safeVal(rekap.kelebihanSiswa)],
        ['Rata-rata Rasio', '1:' + safeVal(rekap.rataRataRasio)],
        ['Total Kekurangan Guru', safeVal(rekap.totalKekuranganGuru)],
      ]
      break
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(sheetData)
  XLSX.utils.book_append_sheet(wb, ws, sheetName)

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  downloadBlob(new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `laporan-${type}-${Date.now()}.xlsx`)
}

// ─── PDF ───────────────────────────────────────────────────────

export function exportPdf(type: string, label: string, summary: any, details: DetailData) {
  const doc = new jsPDF()
  const pageW = doc.internal.pageSize.getWidth()

  let y = 20
  doc.setFontSize(16)
  doc.text(`Laporan ${label}`, pageW / 2, y, { align: 'center' })
  y += 8
  doc.setFontSize(9)
  doc.text(`Kecamatan Lemahabang`, pageW / 2, y, { align: 'center' })
  y += 6
  doc.text(`Total Sekolah: ${summary?.totalSchools || 0} | Siswa: ${(summary?.totalStudents || 0).toLocaleString()} | Guru: ${(summary?.totalTeachers || 0).toLocaleString()}`, pageW / 2, y, { align: 'center' })
  y += 6
  doc.text(`Dibuat: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}`, pageW / 2, y, { align: 'center' })
  y += 10

  switch (type) {
    case 'monthly': {
      const sisPerKelas = (details.siswaPerKelas || []) as any[]
      doc.text('Data Siswa per Kelas', 14, y)
      y += 5
      autoTable(doc, {
        startY: y,
        head: [[{ content: 'Jenjang', styles: { halign: 'center' } }, 'Kelas/Kelompok', 'L', 'P', 'Total']],
        body: sisPerKelas.map(s => [safeVal(s.jenjang), safeVal(s.kelas_kelompok), safeVal(s.laki), safeVal(s.perempuan), safeVal(s.total)]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
      })
      y = (doc as any).lastAutoTable.finalY + 8
      doc.setFontSize(9)
      doc.text(`Mutasi Masuk: ${details.mutasiMasuk || 0}  |  Mutasi Keluar: ${details.mutasiKeluar || 0}  |  Periode: ${details.periode || '-'}`, 14, y)
      break
    }
    case 'semester': {
      const recaps = (details.recaps || []) as any[]
      doc.text('Rekapitulasi Semester', 14, y)
      y += 5
      autoTable(doc, {
        startY: y,
        head: [['TP', 'Semester', 'L', 'P', 'Total', 'Masuk', 'Keluar']],
        body: recaps.map(r => [safeVal(r.tahun_pelajaran), safeVal(r.semester), safeVal(r.totalLaki), safeVal(r.totalPerempuan), safeVal(r.total), safeVal(r.siswaMasuk), safeVal(r.siswaKeluar)]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
      })
      y = (doc as any).lastAutoTable.finalY + 8
      doc.setFontSize(9)
      const g = (details.ringkasanGanjil || {}) as any
      const gn = (details.ringkasanGenap || {}) as any
      doc.text(`Ganjil: ${g.total || 0} siswa (+${g.masuk || 0}/-${g.keluar || 0})  |  Genap: ${gn.total || 0} siswa (+${gn.masuk || 0}/-${gn.keluar || 0})`, 14, y)
      break
    }
    case 'annual': {
      const trendSd = (details.trendSd || []) as any[]
      doc.text('Trend Tahunan SD', 14, y)
      y += 5
      autoTable(doc, {
        startY: y,
        head: [['Tahun', 'Siswa']],
        body: trendSd.map(t => [safeVal(t.tahun), safeVal(t.total)]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
      })
      y = (doc as any).lastAutoTable.finalY + 8
      if ((details.alumni || []).length > 0) {
        doc.text('Alumni', 14, y)
        y += 5
        autoTable(doc, {
          startY: y,
          head: [['Tahun Lulus', 'Jumlah']],
          body: (details.alumni as any[]).map(a => [safeVal(a.tahun_lulus), safeVal(a.total)]),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [59, 130, 246] },
        })
        y = (doc as any).lastAutoTable.finalY + 8
      }
      doc.text(`Pertumbuhan SD: ${details.pertumbuhanSd || '0%'}`, 14, y)
      break
    }
    case 'gis': {
      const sebaran = (details.sebaranDesa || []) as any[]
      doc.text('Sebaran Sekolah per Desa', 14, y)
      y += 5
      autoTable(doc, {
        startY: y,
        head: [['Desa', 'SD', 'TK', 'KB', 'Total']],
        body: sebaran.map(s => [safeVal(s.desa), safeVal(s.sd), safeVal(s.tk), safeVal(s.kb), safeVal(s.total)]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
      })
      y = (doc as any).lastAutoTable.finalY + 8
      doc.text(`Berkoordinat: ${details.sekolahBerkoordinat || 0}  |  Tanpa Koordinat: ${details.sekolahTanpaKoordinat || 0}`, 14, y)
      break
    }
    case 'certification': {
      const ss = (details.statusSertifikasi || {}) as any
      const perSek = (details.perSekolah || []) as any[]
      doc.text('Rekapitulasi Sertifikasi per Sekolah', 14, y)
      y += 5
      autoTable(doc, {
        startY: y,
        head: [['Sekolah', 'Jenjang', 'Total', 'Sudah', 'Belum']],
        body: perSek.map(s => [safeVal(s.sekolahNama), safeVal(s.jenjang), safeVal(s.totalGuru), safeVal(s.tersertifikasi), safeVal(s.belumSertifikasi)]),
        styles: { fontSize: 7 },
        headStyles: { fillColor: [59, 130, 246] },
      })
      y = (doc as any).lastAutoTable.finalY + 8
      doc.text(`Tersertifikasi: ${ss.sudah || 0}  |  Belum: ${ss.belum || 0}  |  ${ss.persenSudah || 0}%`, 14, y)
      break
    }
    case 'shortage': {
      const analisis = (details.analisis || []) as any[]
      const rekap = (details.rekapitulasi || {}) as any
      doc.text('Analisis Kekurangan Guru', 14, y)
      y += 5
      autoTable(doc, {
        startY: y,
        head: [['Sekolah', 'Jenjang', 'Siswa', 'Guru', 'Target', 'Kurang', 'Rasio', 'Status']],
        body: analisis.map(a => [safeVal(a.sekolahNama), safeVal(a.jenjang), safeVal(a.jumlahSiswa), safeVal(a.jumlahGuru), safeVal(a.targetGuru), safeVal(a.kekuranganGuru), safeVal(a.rasioSiswaGuru), safeVal(a.statusKetenagaan)]),
        styles: { fontSize: 7 },
        headStyles: { fillColor: [59, 130, 246] },
      })
      y = (doc as any).lastAutoTable.finalY + 8
      doc.text(`Kekurangan: ${rekap.kekurangan || 0} sekolah  |  Ideal: ${rekap.ideal || 0}  |  Total Kurang Guru: ${rekap.totalKekuranganGuru || 0}`, 14, y)
      break
    }
  }

  doc.save(`laporan-${type}-${Date.now()}.pdf`)
}

// ─── CSV ───────────────────────────────────────────────────────

export function exportCsv(type: string, _label: string, _summary: any, details: DetailData) {
  let rows: string[][] = []
  switch (type) {
    case 'monthly': {
      const sisPerKelas = (details.siswaPerKelas || []) as any[]
      rows = [
        ['Jenjang', 'Kelas/Kelompok', 'Laki-laki', 'Perempuan', 'Total'],
        ...sisPerKelas.map(s => [safeVal(s.jenjang), safeVal(s.kelas_kelompok), safeVal(s.laki), safeVal(s.perempuan), safeVal(s.total)]),
      ]
      break
    }
    case 'semester': {
      const recaps = (details.recaps || []) as any[]
      rows = [
        ['TP', 'Semester', 'Laki-laki', 'Perempuan', 'Total', 'Masuk', 'Keluar'],
        ...recaps.map(r => [safeVal(r.tahun_pelajaran), safeVal(r.semester), safeVal(r.totalLaki), safeVal(r.totalPerempuan), safeVal(r.total), safeVal(r.siswaMasuk), safeVal(r.siswaKeluar)]),
      ]
      break
    }
    case 'annual': {
      const trendSd = (details.trendSd || []) as any[]
      rows = [
        ['Tahun', 'Siswa (SD)'],
        ...trendSd.map(t => [safeVal(t.tahun), safeVal(t.total)]),
      ]
      break
    }
    case 'gis': {
      const sebaran = (details.sebaranDesa || []) as any[]
      rows = [
        ['Desa', 'SD', 'TK', 'KB', 'Total'],
        ...sebaran.map(s => [safeVal(s.desa), safeVal(s.sd), safeVal(s.tk), safeVal(s.kb), safeVal(s.total)]),
      ]
      break
    }
    case 'certification': {
      const perSek = (details.perSekolah || []) as any[]
      rows = [
        ['Sekolah', 'Jenjang', 'Total Guru', 'Tersertifikasi', 'Belum'],
        ...perSek.map(s => [safeVal(s.sekolahNama), safeVal(s.jenjang), safeVal(s.totalGuru), safeVal(s.tersertifikasi), safeVal(s.belumSertifikasi)]),
      ]
      break
    }
    case 'shortage': {
      const analisis = (details.analisis || []) as any[]
      rows = [
        ['Sekolah', 'Jenjang', 'Siswa', 'Guru', 'Target', 'Kurang', 'Rasio', 'Status'],
        ...analisis.map(a => [safeVal(a.sekolahNama), safeVal(a.jenjang), safeVal(a.jumlahSiswa), safeVal(a.jumlahGuru), safeVal(a.targetGuru), safeVal(a.kekuranganGuru), safeVal(a.rasioSiswaGuru), safeVal(a.statusKetenagaan)]),
      ]
      break
    }
  }

  const csv = rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\r\n')
  const bom = '\uFEFF'
  downloadBlob(new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' }), `laporan-${type}-${Date.now()}.csv`)
}
