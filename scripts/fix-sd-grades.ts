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
  'sd negeri 2 lemahabang kulon': '87b81866-bfc6-4379-9f24-b0514264f98e',
  'sd negeri 2 leuwidingding': 'a6e10401-53fb-4109-9197-7ea6ad0b6e4f',
  'sd negeri 2 picungpugur': '2dfefc3e-d906-47cf-987c-5c9e07b09d23',
  'sd negeri 2 sarajaya': 'fa3bbbde-3ba1-43f6-8725-7b851e4cc5a0',
  'sd negeri 2 sigong': '8dbf89df-431d-44df-a66f-e2089562aed6',
  'sd negeri 2 tuk karangsuwung': '6253c9e8-e85e-48f0-9e74-715b7e55ecf8',
  'sd negeri 3 belawa': '2f81ead5-e02b-46a8-8a90-9b547bd5b38d',
  'sd negeri 3 lemahabang': '0560ac73-9a4f-47dc-ba18-e0d661d4e562',
  'sd negeri 3 lemahabang kulon': '94dbdefd-2ce0-4d66-9f39-9cb48e48ef8c',
  'sd negeri 3 leuwidingding': 'b27a6a91-d5f8-47f3-9a2a-a33165cdc7b3',
  'sd negeri 3 picungpugur': '1eab9a6c-9f00-4c90-9ab9-8ddf99d740ec',
  'sd negeri 3 sigong': '56428a5c-db06-46cd-81e8-1569c34504ae',
  'sd negeri 3 tuk karangsuwung': 'd3a1e3cc-5bce-4235-9e24-1bf98a3a0419',
  'sd negeri 4 belawa': 'f354c035-02e5-4e86-8e4f-6d1869d923f6',
  'sd negeri 4 lemahabang': '1bffa6ab-16e0-4a1a-9479-006b32870aa2',
  'sd negeri 4 picungpugur': 'b1d8dbe9-d06a-4de5-991b-24f9478487cc',
  'sd negeri 4 sigong': '3f6e56a4-50fd-4f65-b3a7-6b460e734b4e',
  'sd negeri 5 belawa': 'e10d9968-2fc2-4aec-ba70-49cbc9d3b8c2',
  'sd negeri 5 lemahabang': '12dd3a8e-5961-4862-9e40-a6b9189f5e33',
  'sd negeri 5 sigong': 'b33db5a3-00df-4cc0-b9b1-85ad4062ad8f',
  'sd negeri 6 lemahabang': '5e8eca6a-aa47-4f4f-988a-4ec6f4277e92',
  'sd negeri 6 sigong': '11a2e664-a11d-4bbf-a2cf-8086b5c91a25',
  'sd pgri 1 lemahabang': 'dd12a7d6-a998-4b78-829e-875ae75c7b96',
  'sd pgri 2 lemahabang': '606c7a84-9b7d-4172-aa1c-6df197735583',
  'sd pgri 3 lemahabang': '894c4fac-63ca-4c20-8541-94734a017ebf',
  'sd pgri lemahabang': '7fb621a3-91a0-4a8f-9a0a-096aa681cc66',
}
const ROMAN: Record<string, string> = { '1': 'I', '2': 'II', '3': 'III', '4': 'IV', '5': 'V', '6': 'VI' }

function getLookupKey(filename: string): string {
  return filename.replace(/\.xlsx?$/i, '').replace(/[^a-z0-9]+/g, ' ').toLowerCase().trim()
}

function parseDate(val: any): string {
  if (!val) return ''
  if (typeof val === 'number') {
    const d = new Date((val - 25569) * 86400 * 1000)
    return d.toISOString().split('T')[0]
  }
  const s = String(val).trim()
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  const m2 = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (m2) return `${m2[3]}-${m2[2]}-${m2[1]}`
  return s
}

function parseRombel(val: any, jenjang: string): string {
  if (!val || String(val).trim() === '') return ''
  const s = String(val).trim()

  if (jenjang === 'sd') {
    const m = s.match(/[Kk][Ee][Ll][Aa][Ss]\s*(\d)/)
    if (m) {
      const num = m[1]
      const roman = ROMAN[num]
      if (roman) return `Kelas ${roman}`
    }
    if (/^Kelas\s+(I|II|III|IV|V|VI)$/i.test(s)) {
      return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
    }
    return s
  }

  if (jenjang === 'tk') {
    if (/^Kelompok\s+[AB]$/i.test(s)) return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
    return s
  }

  return s
}

function countExcelRows(filePath: string): { rows: any[][]; total: number } {
  const wb = XLSX.readFile(filePath)
  const ws = wb.Sheets[wb.SheetNames[0]]
  const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 })
  const rows = data.slice(1).filter((r: any[]) => r[1] && String(r[1]).trim() !== '')
  return { rows, total: rows.length }
}

const schoolInfo = new Map<string, { jenjang: string }>()

async function main() {
  console.log('Step 1: Delete all SD students and re-import from Dapodik...')

  // Load school jenjang
  const allSchools = await db.select({ id: schools.id, jenjang: schools.jenjang }).from(schools)
  for (const s of allSchools) schoolInfo.set(s.id, { jenjang: s.jenjang })

  // Get all SD Excel files
  const files = fs.readdirSync(DATA_DIR).filter(f => f.match(/\.xlsx?$/i) && f.toLowerCase().includes('sd'))

  console.log(`Found ${files.length} SD Excel files`)

  // Delete ALL existing SD students (tahun_pelajaran 2026/2027, jenjang sd)
  const delResult = await db.delete(students).where(and(eq(students.jenjang, 'sd'), eq(students.tahun_pelajaran, '2026/2027')))
  console.log('Deleted existing SD students')

  let totalInserted = 0
  let totalSkipped = 0
  let totalSchools = 0

  for (const file of files) {
    const key = getLookupKey(file)
    const schoolId = SCHOOL_MAP[key]
    if (!schoolId) { console.log(`  SKIP: ${file} (no school mapping)`); continue }

    const info = schoolInfo.get(schoolId)!
    const jenjang = info.jenjang
    if (jenjang !== 'sd') continue

    const { rows, total } = countExcelRows(path.join(DATA_DIR, file))
    if (total === 0) continue

    totalSchools++
    const batch: any[] = []
    let schoolSkipped = 0

    for (const row of rows) {
      const nik = row[7] ? String(row[7]).trim() : ''
      const nama = row[1] ? String(row[1]).trim() : ''
      if (!nik && !nama) { schoolSkipped++; continue }

      const nisn = row[4] ? String(row[4]).trim() : ''
      const jenisKelamin = row[3] ? String(row[3]).trim().toUpperCase() === 'L' ? 'L' : 'P' : ''
      const tempatLahir = row[5] ? String(row[5]).trim() : ''
      const tanggalLahir = parseDate(row[6])
      const alamat = row[9] ? String(row[9]).trim() : ''
      const namaOrtu = row[24] ? String(row[24]).trim() : ''
      const rombel = parseRombel(row[42], jenjang)

      batch.push({
        id: uuidv4(),
        school_id: schoolId,
        tahun_pelajaran: '2026/2027',
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
        status_siswa: 'aktif',
      })
    }

    for (const item of batch) {
      try {
        await db.insert(students).values(item as any)
        totalInserted++
      } catch {
        totalSkipped++
      }
    }
    console.log(`  ${file}: inserted ${batch.length - schoolSkipped} (skipped ${schoolSkipped})`)
  }

  console.log(`\nDone! Total: ${totalInserted} inserted, ${totalSkipped} skipped, ${totalSchools} schools`)

  // Verify
  const count = await db.select({ count: sql<number>`COUNT(*)` }).from(students).where(and(eq(students.jenjang, 'sd'), eq(students.tahun_pelajaran, '2026/2027')))
  console.log(`Total SD students now: ${count[0].count}`)
}
main().catch(console.error)
