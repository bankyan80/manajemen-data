import { auth } from '@/lib/auth-v2'
import { redirect } from 'next/navigation'
import SchoolDetailClient, { type SchoolProfile } from './detail-client'

async function getSchool(id: string): Promise<SchoolProfile | null> {
  try {
    const res = await fetch(`${process.env.APP_URL || 'http://localhost:3000'}/api/v2/schools?id=${id}`, {
      cache: 'no-store',
      headers: { Cookie: `next-auth.session-token=${''}` },
    })
    const json = await res.json()
    if (json.success && json.data?.length > 0) {
      return json.data[0] as unknown as SchoolProfile
    }
  } catch {}
  return null
}

export default async function SchoolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params
  const school = await getSchool(id)

  if (school) {
    return <SchoolDetailClient school={school} />
  }

  return (
    <div className="page-container">
      <div className="card p-12 text-center text-slate-500">
        Sekolah tidak ditemukan
      </div>
    </div>
  )
}
