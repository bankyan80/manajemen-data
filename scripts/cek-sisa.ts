import { createClient } from '@libsql/client'
import { config } from 'dotenv'
config()
async function main() {
  const client = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN })

  // TK non-standard
  const tkNonStd = await client.execute(`
    SELECT s.kelas_kelompok, sc.nama as school_nama, COUNT(*) as total 
    FROM students s JOIN schools sc ON s.school_id = sc.id 
    WHERE s.jenjang = 'tk' AND s.status_siswa = 'aktif' 
      AND s.kelas_kelompok NOT IN ('Kelompok A', 'Kelompok B')
    GROUP BY s.kelas_kelompok, sc.nama ORDER BY total DESC
  `)
  console.log('=== TK NON-STANDARD ===')
  for (const r of tkNonStd.rows) {
    console.log(`  ${String(r.kelas_kelompok).padEnd(15)} ${String(r.school_nama).padEnd(35)} ${r.total}`)
  }

  // KB non-standard
  const kbNonStd = await client.execute(`
    SELECT s.kelas_kelompok, sc.nama as school_nama, COUNT(*) as total 
    FROM students s JOIN schools sc ON s.school_id = sc.id 
    WHERE s.jenjang = 'kb' AND s.status_siswa = 'aktif' 
      AND s.kelas_kelompok NOT IN ('Kelompok A', 'Kelompok B')
    GROUP BY s.kelas_kelompok, sc.nama ORDER BY total DESC
  `)
  console.log('\n=== KB NON-STANDARD ===')
  for (const r of kbNonStd.rows) {
    console.log(`  ${String(r.kelas_kelompok).padEnd(15)} ${String(r.school_nama).padEnd(35)} ${r.total}`)
  }
}
main().catch(console.error).then(() => process.exit(0))
