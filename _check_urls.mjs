import 'dotenv/config'
import { createClient } from '@libsql/client'
const c = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN })
const r = await c.execute("SELECT category, COUNT(*) as total, SUM(CASE WHEN file_url IS NOT NULL AND file_url != '' THEN 1 ELSE 0 END) as file_url, SUM(CASE WHEN drive_url IS NOT NULL AND drive_url != '' THEN 1 ELSE 0 END) as drive_url, SUM(CASE WHEN storage_path IS NOT NULL AND storage_path != '' THEN 1 ELSE 0 END) as storage_path, SUM(CASE WHEN file_url IS NULL AND drive_url IS NULL AND storage_path IS NULL THEN 1 ELSE 0 END) as no_source FROM arsip_digital GROUP BY category ORDER BY total DESC")
console.log('=== Per Kategori ===')
console.table(r.rows)
const r2 = await c.execute("SELECT DISTINCT storage FROM arsip_digital GROUP BY storage")
console.log('=== Storage types ===')
console.table(r2.rows)
const r3 = await c.execute("SELECT file_url, drive_url, storage, storage_path, drive_file_id FROM arsip_digital WHERE category != 'SKP' LIMIT 5")
console.log('=== Sample non-SKP records ===')
console.table(r3.rows)
