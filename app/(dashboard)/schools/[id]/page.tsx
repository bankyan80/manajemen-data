import { auth } from '@/lib/auth-v2'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { schools } from '@/db/schema'
import { eq } from 'drizzle-orm'
import SchoolDetailClient, { type SchoolProfile } from './detail-client'

export default async function SchoolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params

  if (!db) {
    return (
      <div className="page-container">
        <div className="card p-12 text-center text-slate-500">Database tidak tersedia</div>
      </div>
    )
  }

  const row = await db.select().from(schools).where(eq(schools.id, id)).limit(1).then(r => r[0])
  if (!row) {
    return (
      <div className="page-container">
        <div className="card p-12 text-center text-slate-500">Sekolah tidak ditemukan</div>
      </div>
    )
  }

  const school: SchoolProfile = {
    id: row.id,
    nama: row.nama,
    npsn: row.npsn,
    jenjang: row.jenjang as 'sd' | 'tk' | 'kb',
    status: row.status,
    alamat: row.alamat,
    desa: row.desa,
    kecamatan: row.kecamatan,
    kepala_id: row.kepala_id,
    latitude: row.latitude,
    longitude: row.longitude,
    health_score: null,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }

  return <SchoolDetailClient school={school} />
}
