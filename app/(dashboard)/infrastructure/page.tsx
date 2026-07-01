import { auth } from '@/lib/auth-v2'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { schools } from '@/db/schema-v2'
import { eq } from 'drizzle-orm'
import InfrastructureClient from './infrastructure-client'

export default async function InfrastructurePage() {
  const session = await auth()
  if (!session) redirect('/login')
  const user = session.user as any
  let sekolahNama = ''
  if (user?.sekolah_id && db) {
    try {
      const [s] = await db.select({ nama: schools.nama }).from(schools).where(eq(schools.id, user.sekolah_id)).limit(1)
      if (s) sekolahNama = s.nama
    } catch {}
  }
  return <InfrastructureClient role={user?.role} userSekolahId={user?.sekolah_id} userSekolahNama={sekolahNama} />
}
