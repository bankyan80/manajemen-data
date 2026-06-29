import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { spmbPendaftar, schools, students } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const { id } = await params
  const [row] = await db
    .select({
      id: spmbPendaftar.id,
      school_id: spmbPendaftar.school_id,
      sekolah_nama: schools.nama,
      tahun_pelajaran: spmbPendaftar.tahun_pelajaran,
      no_pendaftaran: spmbPendaftar.no_pendaftaran,
      nik: spmbPendaftar.nik,
      nama_lengkap: spmbPendaftar.nama_lengkap,
      jenis_kelamin: spmbPendaftar.jenis_kelamin,
      tempat_lahir: spmbPendaftar.tempat_lahir,
      tanggal_lahir: spmbPendaftar.tanggal_lahir,
      usia: spmbPendaftar.usia,
      alamat: spmbPendaftar.alamat,
      desa: spmbPendaftar.desa,
      asal_tk_paud: spmbPendaftar.asal_tk_paud,
      nama_orang_tua: spmbPendaftar.nama_orang_tua,
      no_hp: spmbPendaftar.no_hp,
      jalur: spmbPendaftar.jalur,
      status_seleksi: spmbPendaftar.status_seleksi,
      status_kk: spmbPendaftar.status_kk,
      status_akta: spmbPendaftar.status_akta,
      status_dokumen_tambahan: spmbPendaftar.status_dokumen_tambahan,
      catatan_verifikasi: spmbPendaftar.catatan_verifikasi,
      file_kk_url: spmbPendaftar.file_kk_url,
      file_akta_url: spmbPendaftar.file_akta_url,
      file_afirmasi_url: spmbPendaftar.file_afirmasi_url,
      file_mutasi_url: spmbPendaftar.file_mutasi_url,
      created_at: spmbPendaftar.created_at,
    })
    .from(spmbPendaftar)
    .leftJoin(schools, eq(spmbPendaftar.school_id, schools.id))
    .where(eq(spmbPendaftar.id, id))
    .limit(1)
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: row })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id
  const { id } = await params
  const body = await req.json()

  const updates: Record<string, any> = {}
  const allowedFields = [
    'nik', 'nama_lengkap', 'jenis_kelamin', 'tempat_lahir', 'tanggal_lahir',
    'alamat', 'desa', 'asal_tk_paud', 'nama_orang_tua', 'no_hp', 'jalur',
    'status_seleksi', 'status_kk', 'status_akta', 'status_dokumen_tambahan', 'status_dokumen_afirmasi', 'status_dokumen_mutasi',
    'catatan_verifikasi', 'file_kk_url', 'file_akta_url', 'file_afirmasi_url', 'file_mutasi_url',
  ]
  for (const field of allowedFields) {
    if (body[field] !== undefined) updates[field] = body[field]
  }

  if (body.tanggal_lahir) {
    const birth = new Date(body.tanggal_lahir)
    const now = new Date()
    let usia = now.getFullYear() - birth.getFullYear()
    const m = now.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) usia--
    updates.usia = usia
  }

  if (['status_kk', 'status_akta', 'status_dokumen_tambahan', 'status_dokumen_afirmasi', 'status_dokumen_mutasi', 'status_seleksi'].some(f => updates[f] !== undefined)) {
    updates.verified_by = userId
    updates.verified_at = Date.now()
  }

  const [result] = await db.update(spmbPendaftar).set(updates).where(eq(spmbPendaftar.id, id)).returning()

  // Auto-create student record when accepted
  if (updates.status_seleksi === 'diterima') {
    // Re-fetch pendaftar to get full data (returning() may not return all fields)
    const [pendaftar] = await db
      .select({
        nik: spmbPendaftar.nik,
        school_id: spmbPendaftar.school_id,
        tahun_pelajaran: spmbPendaftar.tahun_pelajaran,
        nama_lengkap: spmbPendaftar.nama_lengkap,
        jenis_kelamin: spmbPendaftar.jenis_kelamin,
        tempat_lahir: spmbPendaftar.tempat_lahir,
        tanggal_lahir: spmbPendaftar.tanggal_lahir,
        alamat: spmbPendaftar.alamat,
        no_hp: spmbPendaftar.no_hp,
        nama_orang_tua: spmbPendaftar.nama_orang_tua,
      })
      .from(spmbPendaftar)
      .where(eq(spmbPendaftar.id, id))
      .limit(1)

    if (pendaftar) {
      const existing = await db.select({ id: students.id }).from(students).where(eq(students.nik, pendaftar.nik)).limit(1)
      if (existing.length === 0) {
        const [school] = await db.select({ jenjang: schools.jenjang }).from(schools).where(eq(schools.id, pendaftar.school_id)).limit(1)
        const jenjang = school?.jenjang || 'sd'
        const kelas_kelompok = jenjang === 'sd' ? 'Kelas I' : jenjang === 'tk' ? 'Kelompok A' : '2\u20133 Tahun'
        const now = new Date().toISOString()
        const jk = pendaftar.jenis_kelamin === 'laki-laki' ? 'L' : pendaftar.jenis_kelamin === 'perempuan' ? 'P' : pendaftar.jenis_kelamin
        const { randomUUID } = await import('crypto')
        const studentId = randomUUID()
        await db.insert(students).values({
          id: studentId,
          school_id: pendaftar.school_id,
          tahun_pelajaran: pendaftar.tahun_pelajaran || '2026/2027',
          jenjang,
          kelas_kelompok,
          nama: pendaftar.nama_lengkap,
          nik: pendaftar.nik,
          nisn: null,
          jenis_kelamin: jk,
          tempat_lahir: pendaftar.tempat_lahir || '',
          tanggal_lahir: pendaftar.tanggal_lahir || '',
          alamat: pendaftar.alamat || '',
          no_hp: pendaftar.no_hp || '',
          nama_orang_tua: pendaftar.nama_orang_tua || '',
          status_siswa: 'aktif',
          created_at: now,
          updated_at: now,
        } as any)
      }
    }
  }

  return NextResponse.json({ data: result })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!db) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const { id } = await params
  await db.delete(spmbPendaftar).where(eq(spmbPendaftar.id, id))
  return NextResponse.json({ success: true })
}
