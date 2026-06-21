'use client'

import {
  FileText,
  UserCheck,
  GraduationCap,
  Award,
  ScrollText,
  BookOpen,
  Stethoscope,
  CreditCard,
  Image,
  FilePlus,
} from 'lucide-react'
import ArchiveDocumentTile from './ArchiveDocumentTile'

const documents = [
  { icon: <FileText className="h-4 w-4" />, title: 'KTP', count: 356, color: 'blue' },
  { icon: <UserCheck className="h-4 w-4" />, title: 'Kartu Keluarga', count: 348, color: 'teal' },
  { icon: <GraduationCap className="h-4 w-4" />, title: 'Ijazah S1/S2', count: 312, color: 'purple' },
  { icon: <Award className="h-4 w-4" />, title: 'Sertifikat Pendidik', count: 198, color: 'amber' },
  { icon: <ScrollText className="h-4 w-4" />, title: 'SK CPNS/PNS', count: 156, color: 'green' },
  { icon: <BookOpen className="h-4 w-4" />, title: 'SK Pangkat', count: 142, color: 'indigo' },
  { icon: <Stethoscope className="h-4 w-4" />, title: 'BPJS Kesehatan', count: 278, color: 'pink' },
  { icon: <CreditCard className="h-4 w-4" />, title: 'NPWP', count: 265, color: 'cyan' },
  { icon: <Image className="h-4 w-4" />, title: 'Foto Formal', count: 356, color: 'orange' },
  { icon: <FilePlus className="h-4 w-4" />, title: 'Dokumen Lainnya', count: 189, color: 'red' },
]

export default function DocumentArchiveGrid() {
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-zinc-900">Arsip Dokumen</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {documents.map((doc) => (
          <ArchiveDocumentTile
            key={doc.title}
            icon={doc.icon}
            title={doc.title}
            count={doc.count}
            color={doc.color}
          />
        ))}
      </div>
    </div>
  )
}
