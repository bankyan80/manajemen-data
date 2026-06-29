import { createClient } from '@libsql/client'
import { config } from 'dotenv'
config()

function normalizeTK(k: string): string {
  const s = k.trim().toLowerCase().replace(/\s+/g, ' ')
  // "KELAS A.1", "KELAS A.2", "KELAS B.1", etc
  if (/^kelas\s+a\.?\d*$/i.test(s)) return 'Kelompok A'
  if (/^kelas\s+b\.?\d*$/i.test(s)) return 'Kelompok B'
  // "Kelompok A", "kelompok a", "A", "A1", "A2", "A3", "kelompok A2" → Kelompok A
  if (/^(kelompok\s+)?a\d*$/i.test(s)) return 'Kelompok A'
  // "Kelompok B", "kelompok b", "B", "B1", "B2", "B3", "B4", "B5", "Kelompok b", "Kelompok B1" etc → Kelompok B
  if (/^(kelompok\s+)?b\d*$/i.test(s)) return 'Kelompok B'
  return k // unchanged
}

function normalizeKB(k: string): string {
  const s = k.trim().toLowerCase().replace(/\s+/g, ' ')
  // A, A1, A2, A3 → Kelompok A
  if (/^a\d*$/i.test(s)) return 'Kelompok A'
  // B, B1, B2, B3 → Kelompok B
  if (/^b\d*$/i.test(s)) return 'Kelompok B'
  // c → Kelompok A (single group at KB A.H. PLUS)
  if (s === 'c') return 'Kelompok A'
  // mangga, keren, istiqomah, apel → keep as-is (theme names, can't auto-map)
  return s
}

async function main() {
  const url = process.env.TURSO_DATABASE_URL
  const token = process.env.TURSO_AUTH_TOKEN
  if (!url || !token) { console.error('Turso credentials not set'); return }
  const client = createClient({ url, authToken: token })

  // STEP 1: Analyze current data
  console.log('=== CURRENT DISTRIBUTION ===')
  for (const jenjang of ['tk', 'kb']) {
    const r = await client.execute(
      `SELECT kelas_kelompok, COUNT(*) as total FROM students WHERE jenjang = '${jenjang}' AND status_siswa = 'aktif' GROUP BY kelas_kelompok ORDER BY total DESC`
    )
    console.log(`\n--- ${jenjang.toUpperCase()} (${r.rows.reduce((s: number, rw: any) => s + Number(rw.total), 0)} total) ---`)
    for (const row of r.rows) {
      const normalized = jenjang === 'tk' ? normalizeTK(String(row.kelas_kelompok)) : normalizeKB(String(row.kelas_kelompok))
      const willChange = normalized !== String(row.kelas_kelompok)
      console.log(`  ${String(row.kelas_kelompok).padEnd(20)} ${String(row.total).padStart(5)}${willChange ? ` → ${normalized}` : ' (ok)'}`)
    }
  }

  // STEP 2: Preview counts after normalization
  console.log('\n\n=== AFTER NORMALIZATION (preview) ===')
  for (const jenjang of ['tk', 'kb']) {
    const r = await client.execute(
      `SELECT kelas_kelompok, COUNT(*) as total FROM students WHERE jenjang = '${jenjang}' AND status_siswa = 'aktif' GROUP BY kelas_kelompok ORDER BY total DESC`
    )
    const grouped = new Map<string, number>()
    for (const row of r.rows) {
      const key = jenjang === 'tk' ? normalizeTK(String(row.kelas_kelompok)) : normalizeKB(String(row.kelas_kelompok))
      grouped.set(key, (grouped.get(key) || 0) + Number(row.total))
    }
    const total = [...grouped.values()].reduce((a, b) => a + b, 0)
    console.log(`\n--- ${jenjang.toUpperCase()} (${total} total) ---`)
    for (const [kelas, count] of [...grouped.entries()].sort()) {
      console.log(`  ${kelas.padEnd(20)} ${String(count).padStart(5)}`)
    }
  }

  // STEP 3: Execute update
  console.log('\n\n=== EXECUTING UPDATE ===')
  for (const jenjang of ['tk', 'kb']) {
    const r = await client.execute(
      `SELECT kelas_kelompok, COUNT(*) as total FROM students WHERE jenjang = '${jenjang}' AND status_siswa = 'aktif' GROUP BY kelas_kelompok ORDER BY total DESC`
    )
    let updated = 0
    for (const row of r.rows) {
      const oldVal = String(row.kelas_kelompok)
      const newVal = jenjang === 'tk' ? normalizeTK(oldVal) : normalizeKB(oldVal)
      if (newVal !== oldVal) {
        const result = await client.execute(
          `UPDATE students SET kelas_kelompok = '${newVal.replace(/'/g, "''")}' WHERE jenjang = '${jenjang}' AND kelas_kelompok = '${oldVal.replace(/'/g, "''")}' AND status_siswa = 'aktif'`
        )
        console.log(`  ${jenjang}: "${oldVal}" → "${newVal}" (${result.rowsAffected} rows)`)
        updated += result.rowsAffected
      }
    }
    console.log(`  ${jenjang}: ${updated} total updated`)
  }

  // STEP 4: Verify
  console.log('\n\n=== VERIFICATION ===')
  for (const jenjang of ['tk', 'kb']) {
    const r = await client.execute(
      `SELECT kelas_kelompok, COUNT(*) as total FROM students WHERE jenjang = '${jenjang}' AND status_siswa = 'aktif' GROUP BY kelas_kelompok ORDER BY total DESC`
    )
    console.log(`\n--- ${jenjang.toUpperCase()} ---`)
    for (const row of r.rows) {
      const isStandard = row.kelas_kelompok === 'Kelompok A' || row.kelas_kelompok === 'Kelompok B'
      console.log(`  ${String(row.kelas_kelompok).padEnd(20)} ${String(row.total).padStart(5)}${isStandard ? '' : ' ⚠️ NON-STANDARD'}`)
    }
  }
}

main().catch(console.error).then(() => process.exit(0))
