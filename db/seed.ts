import 'dotenv/config'
import { readFileSync } from 'fs'
import { join } from 'path'
import bcrypt from 'bcryptjs'
import { db } from '../lib/db'
import {
  users, schools, employees, employeeDocuments, students, studentRecaps,
  reports, settings, activityLogs, notifications, transitions,
} from './schema'

const JSON_DIR = join(process.env.HOME || process.env.USERPROFILE || 'C:\\Users\\Bank Yan', 'Downloads', 'tursodb')

function loadJson<T>(file: string): T[] {
  const raw = readFileSync(join(JSON_DIR, file), 'utf-8')
  return JSON.parse(raw) as T[]
}

function mapJenisKelamin(jk: string): string | null {
  if (jk.toLowerCase().includes('laki')) return 'laki-laki'
  if (jk.toLowerCase().includes('perempuan')) return 'perempuan'
  return null
}

function mapStatusPegawai(sp: string | null | undefined): string {
  const s = (sp || '').toLowerCase()
  if (s === 'pns') return 'pns'
  if (s.includes('pppk paruh')) return 'pppk_paruh_waktu'
  if (s.includes('pppk')) return 'pppk'
  if (s.includes('honor') || s === 'guru honor sekolah') return 'honorer'
  return 'honorer'
}

function mapPendidikan(p: string | null): string | null {
  if (!p) return null
  const s = p.trim()
  if (s === 'S1') return 'S.1'
  if (s === 'S2') return 'S.2'
  if (s === 'S3') return 'S.3'
  if (s === 'D1') return 'D.1'
  if (s === 'D2') return 'D.2'
  if (s === 'D3') return 'D.3'
  if (s === 'SD') return 'SD Sederajat'
  if (s === 'SMP') return 'SMP Sederajat'
  if (s === 'SMA') return 'SMA Sederajat'
  return s
}

function mapJenjang(j: string): string {
  const upper = j.toUpperCase()
  if (upper === 'SD') return 'sd'
  return 'kb'
}

function isNegeri(nama: string): string {
  return nama.toUpperCase().includes('NEGERI') ? 'negeri' : 'swasta'
}

function calculateBup(tanggalLahir: string | null | undefined, jabatan: string | null): string | null {
  if (!tanggalLahir) return null
  const usiaPensiun = jabatan?.toLowerCase().includes('guru') || jabatan?.toLowerCase().includes('kepala') ? 60 : 58
  const tgl = new Date(tanggalLahir)
  if (isNaN(tgl.getTime())) return null
  tgl.setFullYear(tgl.getFullYear() + usiaPensiun)
  tgl.setMonth(tgl.getMonth() + 1)
  tgl.setDate(1)
  return tgl.toISOString().split('T')[0]
}

function parseDateToTimestamp(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? null : d.getTime()
}

const BATCH_SIZE = 100

async function batchInsert<T>(table: any, rows: T[]) {
  if (!db) throw new Error('DB not configured')
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE)
    await db.insert(table).values(chunk as any)
  }
}

// ───────────────────────── Types ─────────────────────────

interface SekolahJson {
  id: string
  npsn: string
  namaSekolah: string
  jenjang: string
  statusSekolah: string
  alamat: string | null
  desa: string | null
  kecamatan: string | null
  status: string
  createdAt: string
  updatedAt: string
}

interface InstansiJson {
  id: string
  nama_instansi: string
  alamat: string | null
  kecamatan: string | null
  kabupaten: string | null
  status_aktif: number
}

interface PegawaiJson {
  id: string
  instansi_id: string
  nama_instansi: string
  nama_pegawai: string
  nip: string
  nik: string
  tanggal_lahir: string | null
  jenis_kelamin: string | null
  jabatan: string | null
  status_pegawai: string | null
  pangkat_golongan: string | null
  pendidikan_terakhir: string | null
  nomor_hp: string | null
  email: string | null
  alamat: string | null
  role: string
  status_aktif: number
  password: string
  created_at: string
  updated_at: string
}

interface ArsipJson {
  id: string
  pegawai_id: string
  nip: string
  nik: string
  nama_pegawai: string
  instansi_id: string
  kelompok_arsip: string
  jenis_dokumen: string
  nama_dokumen: string
  file_name: string
  file_type: string
  file_size: number
  storage_path: string
  download_url: string
  status_validasi: string
  catatan_admin: string | null
  deleted: number
  uploaded_at: string
  updated_at: string
}

interface SiswaJson {
  id: string
  sekolahId: string
  rombelId: string
  tahunPelajaran: string
  nisn: string
  nik: string
  namaLengkap: string
  tempatLahir: string | null
  tanggalLahir: string | null
  usia: number
  jenisKelamin: string | null
  agama: string | null
  statusSiswa: string
  jenjang: string
  kelasKelompok: string
  rombel: string
  nomorAbsen: number
  createdAt: string
  updatedAt: string
}

interface AlamatSiswaJson {
  id: string
  siswaId: string
  alamatLengkap: string
  kecamatan: string
  desa: string
}

interface OrangTuaSiswaJson {
  id: string
  siswaId: string
  namaAyah: string
  namaIbu: string
}

interface RombelJson {
  id: string
  sekolahId: string
  jenjang: string
  kelasKelompok: string
  namaRombel: string
  jumlahL: number
  jumlahP: number
  totalSiswa: number
}

// ───────── Main ─────────

async function main() {
  if (!db) {
    console.error('Database not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.')
    process.exit(1)
  }
  console.log('Loading JSON files...')

  const sekolahList = loadJson<SekolahJson>('Sekolah.json')
  const instansiList = loadJson<InstansiJson>('instansi.json')
  const pegawaiList = loadJson<PegawaiJson>('pegawai.json')
  const arsipList = loadJson<ArsipJson>('arsip.json')
  const siswaList = loadJson<SiswaJson>('Siswa.json')
  const alamatSiswaList = loadJson<AlamatSiswaJson>('AlamatSiswa.json')
  const orangTuaList = loadJson<OrangTuaSiswaJson>('OrangTuaSiswa.json')
  const rombelList = loadJson<RombelJson>('Rombel.json')

  console.log(`  Schools: ${sekolahList.length}, Instansi: ${instansiList.length}`)
  console.log(`  Employees: ${pegawaiList.length}, Documents: ${arsipList.length}`)
  console.log(`  Students: ${siswaList.length}, Rombels: ${rombelList.length}`)

  // ─── Build lookup maps ───

  // Instansi by id (INST_<npsn>)
  const instansiById = new Map<string, InstansiJson>()
  for (const inst of instansiList) {
    instansiById.set(inst.id, inst)
  }

  // For each Sekolah record, extract npsn
  // Also build map from npsn -> SekolahJson
  const sekolahByNpsn = new Map<string, SekolahJson>()
  for (const sk of sekolahList) {
    sekolahByNpsn.set(sk.npsn, sk)
  }

  // Map from instansi INST_<npsn> to cmq id via npsn
  function instansiToSekolahId(instansi_id: string): string | undefined {
    const npsn = instansi_id.replace('INST_', '')
    const sk = sekolahByNpsn.get(npsn)
    return sk?.id
  }

  console.log('\nClearing existing data...')
  // Delete in reverse dependency order
  await db.delete(notifications)
  await db.delete(activityLogs)
  await db.delete(settings)
  await db.delete(reports)
  await db.delete(employeeDocuments)
  await db.delete(studentRecaps)
  await db.delete(students)
  await db.delete(employees)
  await db.delete(users)
  await db.delete(schools)

  console.log('  ✓ All tables cleared')

  // ════════════════════════════════════════════
  // SCHOOLS
  // ════════════════════════════════════════════

  console.log('\nSeeding schools...')
  const schoolRows: any[] = []
  const cmqToUuid = new Map<string, string>()

  for (const sk of sekolahList) {
    const id = crypto.randomUUID()
    cmqToUuid.set(sk.id, id)

    // Enrich address from instansi if available
    const instId = `INST_${sk.npsn}`
    const inst = instansiById.get(instId)

    schoolRows.push({
      id,
      nama: sk.namaSekolah,
      npsn: sk.npsn,
      jenjang: mapJenjang(sk.jenjang),
      status: isNegeri(sk.namaSekolah),
      alamat: inst?.alamat || sk.alamat || '',
      desa: sk.desa || inst?.kecamatan || '',
      kecamatan: sk.kecamatan?.replace('Kec. ', '') || inst?.kecamatan || '',
    })
  }

  await batchInsert(schools, schoolRows)
  console.log(`  ✓ ${schoolRows.length} schools seeded`)

  // ════════════════════════════════════════════
  // EMPLOYEES
  // ════════════════════════════════════════════

  console.log('\nSeeding employees...')
  const employeeRows: any[] = []
  const pgwToUuid = new Map<string, string>() // pegawai.json id -> uuid

  for (const pgw of pegawaiList) {
    const empId = crypto.randomUUID()
    pgwToUuid.set(pgw.id, empId)

    const sekolahId = instansiToSekolahId(pgw.instansi_id)
    if (!sekolahId) {
      console.warn(`  ⚠ Skipping pegawai ${pgw.nama_pegawai}: no school found for instansi ${pgw.instansi_id}`)
      continue
    }
    const cmqSekolahId = sekolahId
    const dbSchoolId = cmqToUuid.get(cmqSekolahId)
    if (!dbSchoolId) {
      console.warn(`  ⚠ Skipping pegawai ${pgw.nama_pegawai}: school UUID not found for ${cmqSekolahId}`)
      continue
    }

    employeeRows.push({
      id: empId,
      sekolah_id: dbSchoolId,
      nama: pgw.nama_pegawai,
      nik: pgw.nik,
      nip: pgw.nip || null,
      email: pgw.email || null,
      no_hp: pgw.nomor_hp || null,
      tempat_lahir: null,
      tanggal_lahir: pgw.tanggal_lahir || null,
      jenis_kelamin: pgw.jenis_kelamin ? mapJenisKelamin(pgw.jenis_kelamin) : null,
      jabatan: pgw.jabatan || null,
      status_pegawai: pgw.status_pegawai ? mapStatusPegawai(pgw.status_pegawai) : 'non_asn',
      pangkat_golongan: pgw.pangkat_golongan || null,
      pendidikan_terakhir: mapPendidikan(pgw.pendidikan_terakhir),
      sertifikasi: null,
      tmt_kerja: null,
      tanggal_bup: calculateBup(pgw.tanggal_lahir, pgw.jabatan),
    })
  }

  await batchInsert(employees, employeeRows)
  console.log(`  ✓ ${employeeRows.length} employees seeded`)

  // ════════════════════════════════════════════
  // USERS
  // ════════════════════════════════════════════

  console.log('\nSeeding users...')
  const userRows: any[] = []

  const pwAdmin = bcrypt.hashSync('admin456', 10)

  // 1. Admin
  const adminId = crypto.randomUUID()
  userRows.push({
    id: adminId,
    name: 'Admin Kecamatan',
    username: 'admin_Tim',
    password: pwAdmin,
    email: 'admin.kecamatan@gmail.com',
    role: 'admin_kecamatan',
  })

  // 2. Operators — one per school (password = sp + npsn)
  const operatorIds = new Map<string, string>()
  for (const sk of sekolahList) {
    const dbSchoolId = cmqToUuid.get(sk.id)
    if (!dbSchoolId) continue

    const opId = crypto.randomUUID()
    operatorIds.set(sk.id, opId)
    userRows.push({
      id: opId,
      name: `Operator ${sk.namaSekolah}`,
      username: sk.npsn,
      password: bcrypt.hashSync(`sp${sk.npsn}`, 10),
      email: `operator.${sk.npsn}@sekolah.sch.id`,
      role: 'operator_sekolah',
      sekolah_id: dbSchoolId,
    })
  }

  // 3. Pegawai — from pegawai.json (already bcrypt-hashed passwords)
  const pegawaiUserIds = new Map<string, string>()
  for (const pgw of pegawaiList) {
    const empId = pgwToUuid.get(pgw.id)
    if (!empId) continue

    const dbSekolahId = cmqToUuid.get(instansiToSekolahId(pgw.instansi_id) || '')
    if (!dbSekolahId) continue

    const userId = crypto.randomUUID()
    pegawaiUserIds.set(pgw.id, userId)

    // Use nip as username, or nik as fallback
    const username = pgw.nip || pgw.nik

    userRows.push({
      id: userId,
      name: pgw.nama_pegawai,
      username,
      password: pgw.password, // Already bcrypt hashed from source system
      email: pgw.email || null,
      role: 'pegawai',
      sekolah_id: dbSekolahId,
      pegawai_id: empId,
    })
  }

  await batchInsert(users, userRows)
  console.log(`  ✓ ${userRows.length} users seeded`)

  // ════════════════════════════════════════════
  // UPDATE SCHOOLS — set kepala_id
  // ════════════════════════════════════════════

  console.log('\nUpdating school heads...')
  let kepalaUpdated = 0
  for (const pgw of pegawaiList) {
    if (pgw.jabatan?.toLowerCase().includes('kepala sekolah')) {
      const empId = pgwToUuid.get(pgw.id)
      if (!empId) continue
      const cmqSekId = instansiToSekolahId(pgw.instansi_id)
      if (!cmqSekId) continue
      const dbSchoolId = cmqToUuid.get(cmqSekId)
      if (!dbSchoolId) continue

      await db.update(schools).set({ kepala_id: empId }).where(eq(schools.id, dbSchoolId))
      kepalaUpdated++
    }
  }
  console.log(`  ✓ ${kepalaUpdated} schools updated with kepala sekolah`)

  // ════════════════════════════════════════════
  // EMPLOYEE DOCUMENTS
  // ════════════════════════════════════════════

  console.log('\nSeeding employee documents...')
  const docRows: any[] = []

  for (const ars of arsipList) {
    const empId = pgwToUuid.get(ars.pegawai_id)
    if (!empId) continue

    const cmqSekId = instansiToSekolahId(ars.instansi_id)
    if (!cmqSekId) continue
    const dbSchoolId = cmqToUuid.get(cmqSekId)
    if (!dbSchoolId) continue

    const kategori = ars.kelompok_arsip.toLowerCase().replace(/\s+/g, '_')
    const jnsDok = ars.jenis_dokumen
    const status = ars.status_validasi === 'Valid' ? 'sudah_diverifikasi' : 'belum_diverifikasi'

    docRows.push({
      id: crypto.randomUUID(),
      employee_id: empId,
      school_id: dbSchoolId,
      kategori,
      jenis_dokumen: jnsDok,
      nama_file: ars.file_name,
      mime_type: ars.file_type || 'application/pdf',
      file_size: ars.file_size || 0,
      drive_file_id: ars.storage_path,
      drive_url: ars.download_url,
      status_upload: 'sudah_diupload',
      status_verifikasi: status,
      status_kelengkapan: status === 'sudah_diverifikasi' ? 'lengkap' : 'belum_lengkap',
      catatan_revisi: ars.catatan_admin,
      uploaded_at: parseDateToTimestamp(ars.uploaded_at),
    })
  }

  await batchInsert(employeeDocuments, docRows)
  console.log(`  ✓ ${docRows.length} documents seeded`)

  // ════════════════════════════════════════════
  // STUDENTS
  // ════════════════════════════════════════════

  console.log('\nSeeding students...')

  // Build alamat & orang_tua lookup by siswaId
  const alamatBySiswaId = new Map<string, AlamatSiswaJson>()
  for (const al of alamatSiswaList) {
    alamatBySiswaId.set(al.siswaId, al)
  }
  const ortuBySiswaId = new Map<string, OrangTuaSiswaJson>()
  for (const ot of orangTuaList) {
    ortuBySiswaId.set(ot.siswaId, ot)
  }

  const studentRows: any[] = []
  for (const sw of siswaList) {
    const dbSchoolId = cmqToUuid.get(sw.sekolahId)
    if (!dbSchoolId) continue

    const almt = alamatBySiswaId.get(sw.id)
    const ortu = ortuBySiswaId.get(sw.id)

    const namaOrtu = ortu
      ? [ortu.namaAyah, ortu.namaIbu].filter(Boolean).join(' / ')
      : null

    studentRows.push({
      id: crypto.randomUUID(),
      school_id: dbSchoolId,
      tahun_pelajaran: sw.tahunPelajaran || '2025/2026',
      jenjang: mapJenjang(sw.jenjang),
      kelas_kelompok: sw.kelasKelompok || sw.rombel || '',
      nama: sw.namaLengkap,
      nik: sw.nik || null,
      nisn: sw.nisn || null,
      jenis_kelamin: sw.jenisKelamin ? mapJenisKelamin(sw.jenisKelamin) : null,
      tempat_lahir: sw.tempatLahir || null,
      tanggal_lahir: sw.tanggalLahir ? sw.tanggalLahir.split('T')[0] : null,
      alamat: almt?.alamatLengkap || null,
      nama_orang_tua: namaOrtu,
      status_siswa: sw.statusSiswa?.toLowerCase() === 'aktif' ? 'aktif' : 'aktif',
    })
  }

  await batchInsert(students, studentRows)
  console.log(`  ✓ ${studentRows.length} students seeded`)

  // ════════════════════════════════════════════
  // STUDENT RECAPS (from Rombel)
  // ════════════════════════════════════════════

  console.log('\nSeeding student recaps...')
  const recapRows: any[] = []
  for (const rmb of rombelList) {
    const dbSchoolId = cmqToUuid.get(rmb.sekolahId)
    if (!dbSchoolId) continue

    recapRows.push({
      id: crypto.randomUUID(),
      school_id: dbSchoolId,
      tahun_pelajaran: '2025/2026',
      semester: 'genap',
      kelas_kelompok: rmb.kelasKelompok,
      laki_laki: rmb.jumlahL,
      perempuan: rmb.jumlahP,
      total: rmb.totalSiswa,
      siswa_masuk: 0,
      siswa_keluar: 0,
    })
  }

  await batchInsert(studentRecaps, recapRows)
  console.log(`  ✓ ${recapRows.length} student recaps seeded`)

  // ════════════════════════════════════════════
  // SETTINGS
  // ════════════════════════════════════════════

  console.log('\nSeeding settings...')
  await db.insert(settings).values([
    { id: crypto.randomUUID(), key: 'tahun_pelajaran', value: '2025/2026' },
    { id: crypto.randomUUID(), key: 'semester', value: 'genap' },
    { id: crypto.randomUUID(), key: 'nama_kecamatan', value: 'Lemahabang' },
    { id: crypto.randomUUID(), key: 'kabupaten', value: 'Cirebon' },
    { id: crypto.randomUUID(), key: 'logo_kecamatan', value: '' },
    { id: crypto.randomUUID(), key: 'alamat_kecamatan', value: 'Jl. Raya Lemahabang No. 1, Cirebon' },
  ])
  console.log('  ✓ Settings seeded')

  // ════════════════════════════════════════════
  // ACTIVITY LOGS (minimal)
  // ════════════════════════════════════════════

  console.log('\nSeeding activity logs...')
  const now = Date.now()
  await db.insert(activityLogs).values([
    { id: crypto.randomUUID(), user_id: adminId, action: 'seed', table_name: 'system', description: 'Initial database seed from JSON exports', created_at: now },
  ])
  console.log('  ✓ Activity logs seeded')

  // ════════════════════════════════════════════
  // NOTIFICATIONS (sample)
  // ════════════════════════════════════════════

  console.log('\nSeeding notifications...')
  await db.insert(notifications).values([
    { id: crypto.randomUUID(), user_id: adminId, type: 'info', title: 'Database Siap', description: 'Seed data dari JSON berhasil dimuat.', is_read: 0, created_at: now },
  ])
  console.log('  ✓ Notifications seeded')

  // ════════════════════════════════════════════
  // TRANSITIONS (SD → SMP) — dikosongkan, diisi manual oleh operator
  // ════════════════════════════════════════════

  console.log('\nSeeding transitions... (skipped — diisi manual oleh operator)')
  const transitionRows: any[] = []

  // ════════════════════════════════════════════
  // DONE
  // ════════════════════════════════════════════

  console.log('\n══════════════════════════════════════════')
  console.log('  Seed completed successfully!')
  console.log(`  Schools:     ${schoolRows.length}`)
  console.log(`  Employees:   ${employeeRows.length}`)
  console.log(`  Users:       ${userRows.length} (1 admin, ${sekolahList.length} operators, ${pegawaiList.length} pegawai)`)
  console.log(`  Documents:   ${docRows.length}`)
  console.log(`  Students:    ${studentRows.length}`)
  console.log(`  Recaps:      ${recapRows.length}`)
  console.log(`  Transitions: ${transitionRows.length}`)
  console.log('══════════════════════════════════════════')
  console.log('\n⚠  Pegawai users use existing bcrypt passwords from the old system.')
  console.log('   Login: username = NIP (or NIK if no NIP), password = existing password.')
}

import { eq } from 'drizzle-orm'

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
