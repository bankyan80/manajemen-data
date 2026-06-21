import 'dotenv/config'
import { db } from '../lib/db'
import { schools, infrastructure } from './schema'
import { eq, count } from 'drizzle-orm'

const KATEGORI = [
  'Tanah', 'Bangunan', 'Ruang Kelas', 'Ruang Kantor',
  'Laboratorium', 'Perpustakaan', 'Sanitasi', 'Penunjang', 'Alat & Buku',
]

const DEFAULT_DATA: Record<string, string> = {
  'Tanah': JSON.stringify({ kepemilikan: '', luas_lahan: 0, luas_bangunan: 0 }),
  'Bangunan': JSON.stringify({ kondisi: '', tahun_bangun: 0, tingkat_kerusakan: '' }),
  'Ruang Kelas': JSON.stringify({ jumlah: 0, kondisi: '', luas: 0 }),
  'Ruang Kantor': JSON.stringify({ ruang_kepsek: 0, ruang_guru: 0, ruang_tu: 0, ruang_bk: 0 }),
  'Laboratorium': JSON.stringify({ ipa: 0, komputer: 0, bahasa: 0, multimedia: 0 }),
  'Perpustakaan': JSON.stringify({ ada: false, luas: 0, jumlah_buku: 0 }),
  'Sanitasi': JSON.stringify({ toilet_guru: 0, toilet_siswa_l: 0, toilet_siswa_p: 0, sumber_air: '' }),
  'Penunjang': JSON.stringify({ uks: false, ibadah: false, kantin: false, gudang: false, parkir: false }),
  'Alat & Buku': JSON.stringify({ meja: 0, kursi: 0, papan_tulis: 0, laptop: 0, buku_teks: 0 }),
}

async function seedInfrastructure() {
  if (!db) { console.error('DB not configured'); process.exit(1) }

  const allSchools = await db.select({ id: schools.id }).from(schools)
  console.log(`Found ${allSchools.length} schools`)

  const existing = await db.select({ value: count() }).from(infrastructure)
  console.log(`Existing infrastructure rows: ${existing[0].value}`)

  // Hapus semua data lama
  await db.delete(infrastructure)
  console.log('Deleted old infrastructure data')

  const now = Date.now()
  const rows: any[] = []

  for (const school of allSchools) {
    for (const kategori of KATEGORI) {
      rows.push({
        school_id: school.id,
        tahun_pelajaran: '2025/2026',
        kategori,
        data: DEFAULT_DATA[kategori],
        keterangan: null,
        created_at: now,
        updated_at: now,
      })
    }
  }

  // Insert in batches
  for (let i = 0; i < rows.length; i += 50) {
    await db.insert(infrastructure).values(rows.slice(i, i + 50))
  }

  console.log(`Seeded ${rows.length} infrastructure rows (${allSchools.length} schools x ${KATEGORI.length} categories)`)
}

seedInfrastructure().catch(console.error)
