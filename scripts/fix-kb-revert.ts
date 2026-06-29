import { createClient } from '@libsql/client'
import { config } from 'dotenv'
config()

async function main() {
  const url = process.env.TURSO_DATABASE_URL
  const token = process.env.TURSO_AUTH_TOKEN
  if (!url || !token) { console.error('Turso credentials not set'); return }
  const client = createClient({ url, authToken: token })

  // Revert mistaken lowercase
  let r = await client.execute(`UPDATE students SET kelas_kelompok = 'Kelompok A' WHERE jenjang = 'kb' AND kelas_kelompok = 'kelompok a' AND status_siswa = 'aktif'`)
  console.log('kelompok a → Kelompok A:', r.rowsAffected)

  r = await client.execute(`UPDATE students SET kelas_kelompok = 'Kelompok B' WHERE jenjang = 'kb' AND kelas_kelompok = 'kelompok b' AND status_siswa = 'aktif'`)
  console.log('kelompok b → Kelompok B:', r.rowsAffected)

  // Verify final state
  r = await client.execute(`SELECT kelas_kelompok, COUNT(*) as total FROM students WHERE jenjang = 'tk' AND status_siswa = 'aktif' GROUP BY kelas_kelompok ORDER BY kelas_kelompok`)
  console.log('\nTK final:', JSON.stringify(r.rows))

  r = await client.execute(`SELECT kelas_kelompok, COUNT(*) as total FROM students WHERE jenjang = 'kb' AND status_siswa = 'aktif' GROUP BY kelas_kelompok ORDER BY kelas_kelompok`)
  console.log('KB final:', JSON.stringify(r.rows))
}
main().catch(console.error).then(() => process.exit(0))
