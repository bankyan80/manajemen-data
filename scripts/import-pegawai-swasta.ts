import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { employees, schools } from '../db/schema'
import { eq, inArray, sql } from 'drizzle-orm'
import * as XLSX from 'xlsx'
import * as path from 'path'
import * as fs from 'fs'
import { randomUUID } from 'crypto'

const DATA_DIR = 'C:\\Users\\Bank Yan\\portal-dinas\\data-pegawai'
const SWASTA_SCHOOLS_RAW = [
  { nama: 'KB A.H. PLUS', id: '887c6040-152e-436f-8b24-423734a97b6a' },
  { nama: 'KB AMALIA SALSABILA', id: 'dcd04e9f-d7b0-4f9f-8757-afaf703ca87a' },
  { nama: 'KB AZ-ZAHRA', id: '99187392-832e-4f64-b2dc-7f84f583436e' },
  { nama: 'KB MUTIARA', id: '366cfd44-0a1e-4cb7-ab44-3cca1d6a21da' },
  { nama: 'KB PALAPA', id: '456c78a6-c074-47e1-b8c7-fe52136b2222' },
  { nama: 'PAUD AL HAMBRA', id: 'e24665c5-e778-4449-a699-24d6bbeb0760' },
  { nama: 'PAUD AL- HIDAYAH', id: '06028ca6-6f98-409a-8c18-1ebd21c811d7' },
  { nama: 'PAUD AL-HUSNA', id: '84c2150c-8d2a-4c8f-a040-1df58b411c3e' },
  { nama: 'PAUD AMANAH', id: '3d45e3a2-066d-475d-abbb-71a3c376a6b5' },
  { nama: 'PAUD AN NAIM', id: '579163dd-3a25-4513-9c0c-e9c1e5ba5f31' },
  { nama: 'PAUD ASY - SYAFIIYAH', id: '2af0b852-4f1f-4d92-b7be-963c58291b56' },
  { nama: 'PAUD BUDGENVIL', id: '52689c7f-a376-4f3c-a536-2ca38fe01704' },
  { nama: 'PAUD SPS MELATI', id: '8e73cab7-e207-48e1-afe6-dedc827b8f50' },
  { nama: 'PAUD TUNAS HARAPAN', id: 'c44e353c-f792-482e-bb93-dbf8e9f476af' },
  { nama: 'SD IT AL IRSYAD AL ISLAMIYYAH', id: '14fcc9a2-d754-4319-ab4c-9b54e7ded46b' },
  { nama: 'TK AISYIYAH LEMAHABANG', id: '8aabec64-df8c-4f60-bbc6-6e7c4a03d385' },
  { nama: 'TK AL-AQSO', id: 'f6dbe892-05fb-40b1-a64f-3356f7563758' },
  { nama: 'TK BPP KENANGA', id: 'a8d98496-1261-4e02-a389-a90988ee5579' },
  { nama: 'TK GELATIK', id: '7248e764-502e-4dd5-9ed4-3323b5905508' },
  { nama: 'TK IT AL IRSYAD AL ISLAMIYYAH', id: '2e2520f0-efc0-4f8e-88cc-7ea00cb76fad' },
  { nama: 'TK MELATI', id: '973798dc-1b54-4f9f-a1d4-fd995402a0fd' },
  { nama: 'TK MUSLIMAT NU', id: '672b85d7-8829-4b75-ae8d-d3e9ee87693c' },
]
const SCHOOL_MAP: Record<string, string> = {}
for (const s of SWASTA_SCHOOLS_RAW) SCHOOL_MAP[s.nama] = s.id

// --- FILE MAPPING (manually verified) ---
interface FileSpec {
  filePath: string
  schoolName: string
  type: 'guru' | 'tendik'
}

function getFileSpecs(): FileSpec[] {
  const out: FileSpec[] = []

  // Map: [prefix, schoolName, type]
  const patterns: [string, string, 'guru' | 'tendik'][] = [
    // --- KB A.H. PLUS ---
    ['daftar-guru-KB AH PLUS', 'KB A.H. PLUS', 'guru'],
    ['daftar-tendik-KB AH PLUS', 'KB A.H. PLUS', 'tendik'],
    // --- KB AMALIA SALSABILA ---
    ['daftar-guru-KB AMALIA SALSABILA', 'KB AMALIA SALSABILA', 'guru'],
    ['daftar-tendik-KB AMALIA SALSABILA', 'KB AMALIA SALSABILA', 'tendik'],
    // --- KB AZ-ZAHRA ---
    ['daftar-guru-KB AZ-ZAHRA', 'KB AZ-ZAHRA', 'guru'],
    ['daftar-tendik-KB AZ-ZAHRA', 'KB AZ-ZAHRA', 'tendik'],
    // --- KB MUTIARA (combined file) ---
    ['daftar-Guru dan Tendik-KB MUTIARA', 'KB MUTIARA', 'tendik'],
    // --- KB PALAPA ---
    ['daftar-guru-KB PALAPA', 'KB PALAPA', 'guru'],
    ['daftar-tendik-KB PALAPA', 'KB PALAPA', 'tendik'],
    // --- PAUD AL HAMBRA ---
    ['daftar-guru-PAUD AL HAMBRA', 'PAUD AL HAMBRA', 'guru'],
    ['daftar-tendik-PAUD AL HAMBRA', 'PAUD AL HAMBRA', 'tendik'],
    // --- PAUD AL-HIDAYAH ---
    ['daftar-guru-PAUD AL- HIDAYAH', 'PAUD AL- HIDAYAH', 'guru'],
    ['daftar-tendik-PAUD AL- HIDAYAH', 'PAUD AL- HIDAYAH', 'tendik'],
    // --- PAUD AL-HUSNA ---
    ['daftar-guru-PAUD AL-HUSNA', 'PAUD AL-HUSNA', 'guru'],
    ['daftar-tendik-PAUD AL-HUSNA', 'PAUD AL-HUSNA', 'tendik'],
    // --- PAUD AMANAH ---
    ['daftar-guru-PAUD AMANAH', 'PAUD AMANAH', 'guru'],
    ['daftar-tendik-PAUD AMANAH', 'PAUD AMANAH', 'tendik'],
    // --- PAUD AN NAIM ---
    ['daftar-guru-PAUD AN NAIM', 'PAUD AN NAIM', 'guru'],
    ['daftar-tendik-PAUD AN NAIM', 'PAUD AN NAIM', 'tendik'],
    // --- PAUD ASY-SYAFIIYAH ---
    ['daftar-guru-PAUD ASY - SYAFIIYAH', 'PAUD ASY - SYAFIIYAH', 'guru'],
    ['daftar-tendik-PAUD ASY - SYAFIIYAH', 'PAUD ASY - SYAFIIYAH', 'tendik'],
    // --- PAUD BUDGENVIL ---
    ['daftar-guru-PAUD BUDGENVIL', 'PAUD BUDGENVIL', 'guru'],
    ['daftar-tendik-PAUD BUDGENVIL', 'PAUD BUDGENVIL', 'tendik'],
    // --- PAUD SPS MELATI ---
    ['daftar-guru-PAUD SPS MELATI', 'PAUD SPS MELATI', 'guru'],
    // --- PAUD TUNAS HARAPAN ---
    ['daftar-guru-PAUD TUNAS HARAPAN', 'PAUD TUNAS HARAPAN', 'guru'],
    ['daftar-tendik-PAUD TUNAS HARAPAN', 'PAUD TUNAS HARAPAN', 'tendik'],
    // --- SD IT AL IRSYAD AL ISLAMIYYAH ---
    ['daftar-guru-SD IT AL IRSYAD AL ISLAMIYYAH', 'SD IT AL IRSYAD AL ISLAMIYYAH', 'guru'],
    ['daftar-tendik-SD IT AL IRSYAD AL ISLAMIYYAH', 'SD IT AL IRSYAD AL ISLAMIYYAH', 'tendik'],
    // --- TK AISYIYAH LEMAHABANG ---
    ['daftar-guru-TK AISYIYAH LEMAHABANG', 'TK AISYIYAH LEMAHABANG', 'guru'],
    ['daftar-tendik-TK AISYIYAH LEMAHABANG', 'TK AISYIYAH LEMAHABANG', 'tendik'],
    // --- TK AL-AQSO ---
    ['daftar-guru-TK AL-AQSO', 'TK AL-AQSO', 'guru'],
    ['daftar-tendik-TK AL-AQSO', 'TK AL-AQSO', 'tendik'],
    // --- TK BPP KENANGA ---
    ['daftar-guru-TK BPP KENANGA', 'TK BPP KENANGA', 'guru'],
    ['daftar-tendik-TK BPP KENANGA', 'TK BPP KENANGA', 'tendik'],
    // --- TK GELATIK ---
    ['daftar-guru-TK GELATIK', 'TK GELATIK', 'guru'],
    ['daftar-tendik-TK GELATIK', 'TK GELATIK', 'tendik'],
    // --- TK IT AL IRSYAD AL ISLAMIYYAH ---
    ['daftar-guru-TK AL-IRSYAD AL-ISLAMIYYAH', 'TK IT AL IRSYAD AL ISLAMIYYAH', 'guru'],
    ['daftar-tendik-TK AL-IRSYAD AL-ISLAMIYYAH', 'TK IT AL IRSYAD AL ISLAMIYYAH', 'tendik'],
    // --- TK MELATI ---
    ['daftar-guru-TK MELATI', 'TK MELATI', 'guru'],
    ['daftar-tendik-TK MELATI', 'TK MELATI', 'tendik'],
    // --- TK MUSLIMAT NU ---
    ['daftar-guru-TK MUSLIMAT NU', 'TK MUSLIMAT NU', 'guru'],
    ['daftar-tendik-TK MUSLIMAT NU', 'TK MUSLIMAT NU', 'tendik'],
  ]

  const allFiles = listAllXlsx(DATA_DIR)

  for (const [prefix, schoolName, type] of patterns) {
    const match = allFiles.find(f => path.basename(f).toLowerCase().startsWith(prefix.toLowerCase()))
    if (match) {
      out.push({ filePath: match, schoolName, type })
    } else {
      console.warn(`  Pattern not matched: ${prefix}`)
    }
  }

  return out
}

function listAllXlsx(dir: string): string[] {
  const result: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      result.push(...listAllXlsx(full))
    } else if (entry.name.endsWith('.xlsx')) {
      result.push(full)
    }
  }
  return result
}

// --- COLUMN MAPPING ---
function mapStatusPegawai(status: string | null): string {
  if (!status) return 'honorer'
  const s = status.toLowerCase()
  if (s.includes('pns')) return 'pns'
  if (s.includes('pppk')) return 'pppk'
  if (s.includes('gty') || s.includes('pty')) return 'gty'
  if (s.includes('honor')) return 'honorer'
  if (s.includes('gtt')) return 'gtt'
  return 'honorer'
}

function mapJenisKelamin(jk: string | null): string | null {
  if (!jk) return null
  const j = jk.toUpperCase()
  if (j === 'L') return 'laki-laki'
  if (j === 'P') return 'perempuan'
  return null
}

function cleanStr(val: unknown): string | null {
  if (val === null || val === undefined) return null
  const s = String(val).trim()
  return s || null
}

function parseRow(row: unknown[], sekolahId: string, defJabatan: string): Record<string, any> | null {
  const nama = cleanStr(row[1])
  const nik = cleanStr(row[44])
  if (!nama && !nik) return null
  const nameVal = nama || 'UNKNOWN'
  let jabatan = cleanStr(row[8]) || defJabatan
  const jb = jabatan.toLowerCase()
  if (jb.includes('kepala') && jb.includes('sekolah')) jabatan = 'Kepala Sekolah'
  else if (jb.includes('guru')) jabatan = 'Guru'
  else if (jb.includes('tenaga') || jb.includes('tendik') || jb.includes('administrasi') || jb.includes('pegawai')) jabatan = 'Tenaga Kependidikan'
  else jabatan = defJabatan
  return {
    sekolah_id: sekolahId,
    nama: nameVal,
    nik: nik || `SWASTA-${randomUUID().slice(0, 8)}`,
    nip: cleanStr(row[6]),
    nuptk: cleanStr(row[2]),
    email: cleanStr(row[19]),
    no_hp: cleanStr(row[18]),
    tempat_lahir: cleanStr(row[4]),
    tanggal_lahir: cleanStr(row[5]),
    jenis_kelamin: mapJenisKelamin(cleanStr(row[3])),
    jabatan,
    status_pegawai: mapStatusPegawai(cleanStr(row[7])),
    pangkat_golongan: cleanStr(row[26]),
    tmt_kerja: cleanStr(row[24]),
  }
}

function processXlsx(filePath: string, schoolName: string, type: 'guru' | 'tendik'): Record<string, any>[] {
  const sekolahId = SCHOOL_MAP[schoolName]
  if (!sekolahId) {
    console.warn(`  WARN: No school ID for "${schoolName}", skipping`)
    return []
  }

  const buf = fs.readFileSync(filePath)
  const wb = XLSX.read(buf, { type: 'buffer', cellDates: false })
  const ws = wb.Sheets[wb.SheetNames[0]]
  if (!ws) { console.warn(`  WARN: No sheet in ${filePath}`); return [] }

  const rows = XLSX.utils.sheet_to_json<any>(ws, { header: 1, raw: true, blankrows: false })
  if (rows.length < 5) { console.warn(`  WARN: Too few rows ${rows.length}`); return [] }

  let headerIdx = -1
  for (let i = 0; i < Math.min(rows.length, 6); i++) {
    const row = rows[i]
    if (row && Array.isArray(row) && row.some((c: unknown) => {
      const s = String(c || '').trim(); return s === 'No' || s === 'Nama'
    })) { headerIdx = i; break }
  }
  if (headerIdx === -1) { console.warn(`  WARN: No header`); return [] }

  const dataRows = rows.slice(headerIdx + 1)
  const results: Record<string, any>[] = []
  const defJabatan = type === 'guru' ? 'Guru' : 'Tenaga Kependidikan'
  for (const row of dataRows) {
    if (!Array.isArray(row)) continue
    const emp = parseRow(row, sekolahId, defJabatan)
    if (emp) results.push(emp)
  }
  return results
}

// --- MAIN ---
async function main() {
  const url = process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN
  if (!url || !authToken) { console.error('ERROR: env not set'); process.exit(1) }

  const turso = createClient({ url, authToken })
  const db = drizzle(turso)

  // 1. DELETE all existing swasta employees
  const swastaIds = SWASTA_SCHOOLS_RAW.map(s => s.id)
  console.log('Deleting existing swasta employees...')
  const delResult = await db.delete(employees).where(inArray(employees.sekolah_id, swastaIds))
  console.log(`  Deleted ${delResult?.rowsAffected ?? '?'} rows`)
  console.log()

  // 2. Import
  const specs = getFileSpecs()
  console.log(`Found ${specs.length} file specs`)
  console.log()

  let totalInserted = 0
  const counts: Record<string, { guru: number; tendik: number }> = {}

  for (const spec of specs) {
    const { filePath, schoolName, type } = spec
    console.log(`${schoolName} (${type}) <- ${path.basename(filePath)}`)

    const emps = processXlsx(filePath, schoolName, type)
    console.log(`  Parsed ${emps.length}`)

    if (!counts[schoolName]) counts[schoolName] = { guru: 0, tendik: 0 }
    counts[schoolName][type] += emps.length

    for (let i = 0; i < emps.length; i += 20) {
      await db.insert(employees).values(emps.slice(i, i + 20) as any)
    }
    totalInserted += emps.length
    console.log(`  Inserted ${emps.length}`)
  }

  console.log()
  console.log('='.repeat(50))
  console.log('IMPORT SUMMARY')
  console.log('='.repeat(50))
  console.log(`Total inserted: ${totalInserted}`)
  for (const [school, c] of Object.entries(counts).sort()) {
    const t = c.guru + c.tendik
    console.log(`${school}: ${c.guru} guru + ${c.tendik} tendik = ${t}`)
  }
}

main().catch(err => { console.error('FATAL:', err); process.exit(1) })
