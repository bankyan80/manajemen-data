'use client'

import ArchiveDocumentTile from './ArchiveDocumentTile'
import { FileText, UserCheck, GraduationCap, Award, ScrollText, BookOpen, Stethoscope, CreditCard, Image, FilePlus } from 'lucide-react'

const FALLBACK_ICONS: Record<string, { icon: React.ReactNode; color: string }> = {
  'ktp': { icon: <FileText className="h-4 w-4" />, color: 'blue' },
  'kartu keluarga': { icon: <UserCheck className="h-4 w-4" />, color: 'teal' },
  'ijazah': { icon: <GraduationCap className="h-4 w-4" />, color: 'purple' },
  'sertifikat pendidik': { icon: <Award className="h-4 w-4" />, color: 'amber' },
  'sk cpns/pns': { icon: <ScrollText className="h-4 w-4" />, color: 'green' },
  'sk kenaikan pangkat': { icon: <BookOpen className="h-4 w-4" />, color: 'indigo' },
  'bpjs': { icon: <Stethoscope className="h-4 w-4" />, color: 'pink' },
  'npwp': { icon: <CreditCard className="h-4 w-4" />, color: 'cyan' },
  'pass foto': { icon: <Image className="h-4 w-4" />, color: 'orange' },
  'default': { icon: <FilePlus className="h-4 w-4" />, color: 'red' },
}

function getIcon(jenis: string) {
  const key = Object.keys(FALLBACK_ICONS).find(k => jenis.toLowerCase().includes(k))
  return FALLBACK_ICONS[key || 'default']
}

export default function DocumentArchiveGrid({ archives, loading }: { archives?: { jenis: string; total: number }[]; loading?: boolean }) {
  const items = archives?.map(a => ({ ...getIcon(a.jenis), title: a.jenis, count: a.total })) || []
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-zinc-900">Arsip Dokumen</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {(loading ? Array.from({ length: 10 }).map((_, i) => ({ icon: <FileText className="h-4 w-4" />, title: '...', count: 0, color: 'gray' as const })) : items).map((doc, i) => (
          <ArchiveDocumentTile key={doc.title || i} icon={doc.icon} title={doc.title} count={doc.count} color={doc.color as any} />
        ))}
      </div>
    </div>
  )
}
