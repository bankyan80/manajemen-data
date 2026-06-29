import 'dotenv/config'
import * as fs from 'fs'
import * as path from 'path'
import * as XLSX from 'xlsx'
import { db } from '../lib/db'
import { schools, students } from '../db/schema'
import { eq, sql, and } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

const DATA_DIR = 'C:/Users/Bank Yan/portal-dinas/data-siswa'

const SCHOOL_MAP: Record<string, string> = {
  'ah plus': '887c6040-152e-436f-8b24-423734a97b6a',
  'sd negeri 1 asem': '774e132c-5db6-4d1e-9b03-42d03c3b62c2',
  'sd negeri 1 belawa': 'f98547ac-67cc-4fcb-a4dc-ed10653a136a',
  'sd negeri 1 cipeujeuh kulon': 'a7ead500-8b09-402c-b7be-e6b455b28d0f',
  'sd negeri 1 cipeujeuh wetan': 'b1cc7746-2be2-4f7a-ac99-220d4619d92e',
  'sd negeri 1 lemahabang': '858edace-8558-422b-899e-b4c0ad58eeee',
  'sd negeri 1 lemahabang kulon': 'a3ef7b7b-7c10-4f24-8c61-e61655e069cf',
  'sd negeri 1 leuwidingding': '64934622-8780-4f02-b382-e4c4cbd08ad2',
  'sd negeri 1 picungpugur': '3fb3c825-f45a-459e-aabb-dbebf8466fbd',
  'sd negeri 1 sarajaya': '252385b1-cb6b-4e8e-9ef7-d823f18c5be2',
  'sd negeri 1 sigong': '081cb41f-a423-4ddb-b10f-b61deccf7e16',
  'sd negeri 1 sindanglaut': '227b262f-b035-41b0-bc2a-5a18ae2f4961',
  'sd negeri 1 tuk karangsuwung': '0fec227c-451e-4887-804d-7d7dfd9bcd42',
  'sd negeri 1 wangkelang': 'df868ffb-e4e6-4c7f-8321-8f0968665ab2',
  'sd negeri 2 belawa': 'b0db6d7c-2796-4739-8b2b-8639cb098bb2',
  'sd negeri 2 cipeujeuh kulon': '8f012f57-1ecb-499c-ba5f-76e453ee9f68',
  'sd negeri 2 cipeujeuh wetan': '039d91e8-45a4-4cf9-98a2-55300e46a836',
  'sd negeri 2 lemahabang': '77959661-acc0-4462-83c9-271292daaeb5',
  'sd negeri 2 sarajaya': 'd999cf28-1190-4df6-9906-917f787da0a5',
  'sd negeri 3 cipeujeuh wetan': 'a4a76b6a-6d33-4fd1-8e53-41f4e42634c9',
  'sd negeri 3 sigong': '5657a80e-add8-433a-a365-c5be6c143ac8',
  'sd negeri 4 sigong': '3f6e56a4-50fd-4f65-b3a7-6b460e734b4e',
  '12052026 sd negeri 3 sigong': '5657a80e-add8-433a-a365-c5be6c143ac8',
  'sd it al irsyad al islamiyyah': '14fcc9a2-d754-4319-ab4c-9b54e7ded46b',
  'tk aisyiyah lemahabang': '8aabec64-df8c-4f60-bbc6-6e7c4a03d385',
  'tk aisyiyah': '8aabec64-df8c-4f60-bbc6-6e7c4a03d385',
  'tk al aqso': 'f6dbe892-05fb-40b1-a64f-3356f7563758',
  'tk al irsyad al islamiyyah': '2e2520f0-efc0-4f8e-88cc-7ea00cb76fad',
  'tk bpp kenanga': 'a8d98496-1261-4e02-a389-a90988ee5579',
  'tk gelatik': '7248e764-502e-4dd5-9ed4-3323b5905508',
  'tk melati': '973798dc-1b54-4f9f-a1d4-fd995402a0fd',
  'tk muslimat nu': '672b85d7-8829-4b75-ae8d-d3e9ee87693c',
  'tk negeri lemahabang': 'd8190c0b-94b6-4665-8a00-7073f2ec1add',
  'tk negeri': 'd8190c0b-94b6-4665-8a00-7073f2ec1add',
  'kb ah plus': '887c6040-152e-436f-8b24-423734a97b6a',
  'kb amalia salsabila': 'dcd04e9f-d7b0-4f9f-8757-afaf703ca87a',
  'kb az zahra': '99187392-832e-4f64-b2dc-7f84f583436e',
  'kb mutiara': '366cfd44-0a1e-4cb7-ab44-3cca1d6a21da',
  'kb mutiara mei2026': '366cfd44-0a1e-4cb7-ab44-3cca1d6a21da',
  'kb palapa': '456c78a6-c074-47e1-b8c7-fe52136b2222',
  'kb permata bunda': '388fd329-9e96-409e-9454-59af45bd9ea8',
  'paud al hambra': 'e24665c5-e778-4449-a699-24d6bbeb0760',
  'paud al hidayah': '06028ca6-6f98-409a-8c18-1ebd21c811d7',
  'paud al husna': '84c2150c-8d2a-4c8f-a040-1df58b411c3e',
  'paud amanah': '3d45e3a2-066d-475d-abbb-71a3c376a6b5',
  'paud an naim': '579163dd-3a25-4513-9c0c-e9c1e5ba5f31',
  'paud asy syafiiyah': '2af0b852-4f1f-4d92-b7be-963c58291b56',
  'paud budgenvil': '52689c7f-a376-4f3c-a536-2ca38fe01704',
  'paud sps melati': '8e73cab7-e207-48e1-afe6-dedc827b8f50',
  'paud tunas harapan': 'c44e353c-f792-482e-bb93-dbf8e9f476af',
}

const ROMAN_MAP: Record<string, string> = {
  '1': 'I', '2': 'II', '3': 'III', '4': 'IV', '5': 'V', '6': 'VI',
}

function normalizeName(name: string): string {
  return name.replace(/[._-]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase()
}

function getLookupKey(fileName: string): string {
  let name = fileName.replace(/\.xlsx?$/i, '')
  name = name.replace(/[_-]/g, ' ')
  name = name
    .replace(/^daftar\s+pd\s*/i, '')
    .replace(/^pd\s+/i, '')
    .replace(/\s+kecamatan\s+\w+/gi, '')
    .replace(/^\d+\s*-\s*/, '')
    .replace(/\s+\d{4}\s*\d{2}\s*\d{2}.*$/i, '')
    .replace(/\s+\w+\d{4}.*$/i, '')
  return normalizeName(name)
}

function parseRombel(val: any, jenjang: string): string {
  if (!val || String(val).trim() === '') return ''
  const s = String(val).trim()

  if (jenjang === 'sd') {
    const m = s.match(/[Kk][Ee][Ll][Aa][Ss]\s*(\d)/)
    if (m) {
      const num = m[1]
      const roman = ROMAN_MAP[num]
      if (roman) return `Kelas ${roman}`
    }
    // If it already matches DB format
    if (/^Kelas\s+(I|II|III|IV|V|VI)$/i.test(s)) {
      return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
    }
    return s
  }

  if (jenjang === 'tk' || jenjang === 'kb') {
    // "A", "A1", "A2", "A3", "kelompok a", "Kelompok A2", "KELAS A.1" → Kelompok A
    if (/^(kelas\s+|kelompok\s+)?a\.?\d*$/i.test(s)) return 'Kelompok A'
    // "B", "B1", "B2", "B3", "B4", "B5", "kelompok b", "Kelompok B2", "KELAS B.1" → Kelompok B
    if (/^(kelas\s+|kelompok\s+)?b\.?\d*$/i.test(s)) return 'Kelompok B'
    return s
  }

  return s
}

function countExcelRows(filePath: string): { rows: any[][]; total: number } {
  const buf = fs.readFileSync(filePath)
  const wb = XLSX.read(buf, { type: 'buffer' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const allRows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 })
  const dataRows: any[][] = []
  for (let i = 5; i < allRows.length; i++) {
    const r = allRows[i]
    if (r && r[0] !== undefined && r[0] !== null && String(r[0]).trim() !== '') {
      const no = Number(r[0])
      if (!isNaN(no)) dataRows.push(r)
    }
  }
  return { rows: dataRows, total: dataRows.length }
}

function parseDate(val: any): string | null {
  if (!val) return null
  // Try parsing as serial date number
  if (typeof val === 'number') {
    // Excel serial date: days since 1900-01-01
    const d = new Date((val - 25569) * 86400 * 1000)
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  }
  // Try string date
  const s = String(val).trim()
  // Format: YYYY-MM-DD
  const m1 = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m1) return `${m1[1]}-${m1[2]}-${m1[3]}`
  // Format: DD/MM/YYYY or DD-MM-YYYY
  const m2 = s.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})/)
  if (m2) return `${m2[3]}-${m2[2]}-${m2[1]}`
  return s
}

async function main() {
  if (!db) { console.log('DB not available'); process.exit(1) }

  // Build DB school info
  const schoolRows = await db.select().from(schools)
  const schoolInfo = new Map<string, { nama: string; jenjang: string }>()
  for (const s of schoolRows) schoolInfo.set(s.id, { nama: s.nama, jenjang: s.jenjang })

  // Get existing students per school to avoid duplicates
  const existingStudents = await db
    .select({ school_id: students.school_id, nik: students.nik, nama: students.nama })
    .from(students)
    .where(eq(students.status_siswa, 'aktif'))
  const existingKeySet = new Set<string>()
  for (const s of existingStudents) {
    if (s.nik) existingKeySet.add(`${s.school_id}:nik:${s.nik}`)
    if (s.nama) existingKeySet.add(`${s.school_id}:nama:${s.nama.toLowerCase().trim()}`)
  }

  const files = fs.readdirSync(DATA_DIR).filter(f => f.match(/\.xlsx?$/i))

  let totalInserted = 0
  let totalSkipped = 0
  let totalSchools = 0

  const now = new Date().toISOString()

  for (const file of files) {
    const key = getLookupKey(file)
    const schoolId = SCHOOL_MAP[key]
    if (!schoolId) continue

    const info = schoolInfo.get(schoolId)!
    const jenjang = info.jenjang
    const tp = jenjang === 'sd' ? '2026/2027' : '2025/2026'

    const { rows, total } = countExcelRows(path.join(DATA_DIR, file))
    if (total === 0) continue

    // Get existing count for this school
    const dbCountResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(students)
      .where(and(
        eq(students.school_id, schoolId),
        eq(students.jenjang, jenjang),
        eq(students.tahun_pelajaran, tp),
        eq(students.status_siswa, 'aktif'),
      ))
    const existingCount = dbCountResult[0].count

    if (existingCount >= total) continue // Already match or DB has more

    totalSchools++

    const batch: any[] = []
    let skipped = 0

    for (const row of rows) {
      const nik = row[7] ? String(row[7]).trim() : ''
      const nama = row[1] ? String(row[1]).trim() : ''
      if (!nik && !nama) { skipped++; continue }

      const nikKey = nik ? `${schoolId}:nik:${nik}` : ''
      const namaKey = nama ? `${schoolId}:nama:${nama.toLowerCase()}` : ''
      if ((nikKey && existingKeySet.has(nikKey)) || (namaKey && existingKeySet.has(namaKey))) {
        skipped++; continue
      }

      const nisn = jenjang === 'sd' && row[4] ? String(row[4]).trim() : ''
      const jenisKelamin = row[3] ? String(row[3]).trim().toUpperCase() === 'L' ? 'L' : 'P' : ''
      const tempatLahir = row[5] ? String(row[5]).trim() : ''
      const tanggalLahir = parseDate(row[6])
      const alamat = row[9] ? String(row[9]).trim() : ''
      const namaOrtu = row[24] ? String(row[24]).trim() : '' // Nama Ayah
      const rombel = parseRombel(row[42], jenjang)

      const newStudent = {
        id: uuidv4(),
        school_id: schoolId,
        tahun_pelajaran: tp,
        jenjang,
        kelas_kelompok: rombel,
        nama,
        nik,
        nisn,
        jenis_kelamin: jenisKelamin,
        tempat_lahir: tempatLahir,
        tanggal_lahir: tanggalLahir,
        alamat,
        nama_orang_tua: namaOrtu,
        no_hp: '',
        status_siswa: 'aktif',
        created_at: now,
        updated_at: now,
      }

      batch.push(newStudent)
      if (nik) existingKeySet.add(nikKey)
      if (nama) existingKeySet.add(namaKey)
    }

    if (batch.length > 0) {
      // Insert in chunks of 50
      for (let i = 0; i < batch.length; i += 50) {
        const chunk = batch.slice(i, i + 50)
        await db.insert(students).values(chunk)
      }
      totalInserted += batch.length
      totalSkipped += skipped
      console.log(`${info.nama}: ${batch.length} imported, ${skipped} skipped (DB had ${existingCount}/${total} Dapodik)`)
    }
  }

  console.log(`\nSelesai. ${totalInserted} siswa diimport dari ${totalSchools} sekolah, ${totalSkipped} skipped (duplikat).`)
}

main().catch(console.error)
