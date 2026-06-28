import { config } from 'dotenv'
config({ path: '.env' })

import { createClient } from '@libsql/client'

const url = process.env.TURSO_DATABASE_URL
const token = process.env.TURSO_AUTH_TOKEN
if (!url || !token) {
  console.error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN')
  process.exit(1)
}

const client = createClient({ url, authToken: token })

const indexes = [
  `CREATE INDEX IF NOT EXISTS idx_employees_sekolah_id ON employees(sekolah_id)`,
  `CREATE INDEX IF NOT EXISTS idx_ed_employee_id ON employee_documents(employee_id)`,
  `CREATE INDEX IF NOT EXISTS idx_ed_school_id ON employee_documents(school_id)`,
  `CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(school_id)`,
  `CREATE INDEX IF NOT EXISTS idx_students_nik ON students(nik)`,
  `CREATE INDEX IF NOT EXISTS idx_students_nisn ON students(nisn)`,
  `CREATE INDEX IF NOT EXISTS idx_students_tp_jenjang ON students(tahun_pelajaran, jenjang)`,
  `CREATE INDEX IF NOT EXISTS idx_sr_school_id ON student_recaps(school_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sr_tp_semester ON student_recaps(tahun_pelajaran, semester)`,
  `CREATE INDEX IF NOT EXISTS idx_tanah_school_id ON tanah(school_id)`,
  `CREATE INDEX IF NOT EXISTS idx_bangunan_school_id ON bangunan(school_id)`,
  `CREATE INDEX IF NOT EXISTS idx_ruang_school_id ON ruang(school_id)`,
  `CREATE INDEX IF NOT EXISTS idx_ruang_bangunan_id ON ruang(bangunan_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sub_ruang_ruang_id ON sub_ruang(ruang_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sarana_school_id ON sarana(school_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sarana_ruang_id ON sarana(ruang_id)`,
  `CREATE INDEX IF NOT EXISTS idx_buku_school_id ON buku(school_id)`,
  `CREATE INDEX IF NOT EXISTS idx_reports_school_id ON reports(school_id)`,
  `CREATE INDEX IF NOT EXISTS idx_reports_periode ON reports(tahun, periode_bulan)`,
  `CREATE INDEX IF NOT EXISTS idx_al_user_id ON activity_logs(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_al_created_at ON activity_logs(created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_notif_user_id ON notifications(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_notif_unread ON notifications(user_id, is_read)`,
  `CREATE INDEX IF NOT EXISTS idx_alumni_school_id ON alumni(school_id)`,
  `CREATE INDEX IF NOT EXISTS idx_alumni_tahun_lulus ON alumni(tahun_lulus)`,
  `CREATE INDEX IF NOT EXISTS idx_sm_school_id ON student_mutations(school_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sm_student_id ON student_mutations(student_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sm_nik ON student_mutations(nik)`,
  `CREATE INDEX IF NOT EXISTS idx_ppdb_school_id ON ppdb(school_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sdt_school_id ON spmb_daya_tampung(school_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sp_school_id ON spmb_pendaftar(school_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sp_nik ON spmb_pendaftar(nik)`,
  `CREATE INDEX IF NOT EXISTS idx_sp_no_pendaftaran ON spmb_pendaftar(no_pendaftaran)`,
  `CREATE INDEX IF NOT EXISTS idx_sp_status_seleksi ON spmb_pendaftar(status_seleksi)`,
  `CREATE INDEX IF NOT EXISTS idx_trans_school_id ON transitions(school_id)`,
  `CREATE INDEX IF NOT EXISTS idx_trans_student_id ON transitions(student_id)`,
  `CREATE INDEX IF NOT EXISTS idx_arsip_school_id ON arsip_digital(school_id)`,
  `CREATE INDEX IF NOT EXISTS idx_arsip_employee_id ON arsip_digital(employee_id)`,
  `CREATE INDEX IF NOT EXISTS idx_arsip_module_type ON arsip_digital(module_type)`,
  `CREATE INDEX IF NOT EXISTS idx_users_sekolah_id ON users(sekolah_id)`,
  `CREATE INDEX IF NOT EXISTS idx_users_pegawai_id ON users(pegawai_id)`,
  `CREATE INDEX IF NOT EXISTS idx_schools_jenjang ON schools(jenjang)`,
  `CREATE INDEX IF NOT EXISTS idx_schools_desa ON schools(desa)`,
]

async function main() {
  console.log(`Adding ${indexes.length} indexes...`)
  for (const sql of indexes) {
    try {
      await client.execute(sql)
      console.log(`  ✔ ${sql.match(/ON\s+(\w+)/)?.[1] || sql}`)
    } catch (err: any) {
      console.error(`  ✘ ${err?.message || err}`)
    }
  }
  console.log('Done!')
  process.exit(0)
}

main()
