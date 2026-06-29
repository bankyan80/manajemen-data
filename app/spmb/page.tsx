import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { schools } from '@/db/schema'
import { eq } from 'drizzle-orm'
import SpmbClient from './_client'

export default async function SpmbPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const user = session.user as any
  const isAdmin = user?.role === 'admin_kecamatan'
  let sekolahJenjang = ''
  if (user?.sekolah_id && db) {
    const [s] = await db.select({ jenjang: schools.jenjang }).from(schools).where(eq(schools.id, user.sekolah_id)).limit(1)
    sekolahJenjang = s?.jenjang || ''
  }
  return <SpmbClient isAdmin={isAdmin} sekolahId={user?.sekolah_id ?? undefined} sekolahJenjang={sekolahJenjang} />
}
