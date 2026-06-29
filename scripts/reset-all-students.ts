import 'dotenv/config'
import { db } from '../lib/db'
import { sql } from 'drizzle-orm'

async function main() {
  if (!db) { console.log('DB not available'); process.exit(1) }

  console.log('Resetting all student data...')

  // Delete in FK-safe order
  console.log('1. Deleting transitions...')
  const r1 = await db.run(sql`DELETE FROM transitions`)
  console.log(`   => ${r1.changes} rows deleted`)

  console.log('2. Deleting student_mutations...')
  const r2 = await db.run(sql`DELETE FROM student_mutations`)
  console.log(`   => ${r2.changes} rows deleted`)

  console.log('3. Deleting spmb_pendaftar...')
  const r3 = await db.run(sql`DELETE FROM spmb_pendaftar`)
  console.log(`   => ${r3.changes} rows deleted`)

  console.log('4. Deleting students...')
  const r4 = await db.run(sql`DELETE FROM students`)
  console.log(`   => ${r4.changes} rows deleted`)

  console.log('5. Deleting student_recaps...')
  const r5 = await db.run(sql`DELETE FROM student_recaps`)
  console.log(`   => ${r5.changes} rows deleted`)

  // Verify
  const counts = await db.all<{ table: string; count: number }>(sql`
    SELECT 'students' as table, COUNT(*) as count FROM students
    UNION ALL
    SELECT 'transitions', COUNT(*) FROM transitions
    UNION ALL
    SELECT 'student_mutations', COUNT(*) FROM student_mutations
    UNION ALL
    SELECT 'spmb_pendaftar', COUNT(*) FROM spmb_pendaftar
    UNION ALL
    SELECT 'student_recaps', COUNT(*) FROM student_recaps
  `)
  console.log('\nVerification:')
  for (const row of counts) {
    if (row.count > 0) {
      console.log(`  ⚠️  ${row.table}: ${row.count} rows remaining`)
    } else {
      console.log(`  ✅ ${row.table}: 0 rows`)
    }
  }

  console.log('\nReset selesai. Semua data siswa telah dihapus.')
}

main().catch(console.error)
