'use client'

import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { safeFetch } from '@/lib/safe-fetch'

interface TeacherDetail {
  id: string
  nama: string
  nik: string
  nip?: string
  nuptk?: string
  jabatan?: string
  status_pegawai?: string
  sertifikasi?: string
  pendidikan_terakhir?: string
  jurusan?: string
  tmt_kerja?: string
  tanggal_bup?: string
  school_nama?: string
}

export default function TeacherDetailModal({
  teacherId,
  onClose,
}: {
  teacherId: string
  onClose: () => void
}) {
  const [teacher, setTeacher] = useState<TeacherDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    safeFetch<TeacherDetail[]>(`/api/v2/teachers?id=${teacherId}`)
      .then(data => { if (data?.[0]) setTeacher(data[0]) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [teacherId])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold">Detail Guru</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-5 w-full" />
              ))}
            </div>
          ) : teacher ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold">{teacher.nama}</h3>
                <p className="text-sm text-slate-500">{teacher.school_nama}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  ['NIK', teacher.nik],
                  ['NIP', teacher.nip || '-'],
                  ['NUPTK', teacher.nuptk || '-'],
                  ['Jabatan', teacher.jabatan || '-'],
                  ['Status', teacher.status_pegawai?.replace(/_/g, ' ') || '-'],
                  ['Sertifikasi', teacher.sertifikasi || '-'],
                  ['Pendidikan', teacher.pendidikan_terakhir || '-'],
                  ['Jurusan', teacher.jurusan || '-'],
                  ['TMT Kerja', teacher.tmt_kerja || '-'],
                  ['Tgl. BUP', teacher.tanggal_bup || '-'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div className="text-xs text-slate-400">{label}</div>
                    <div className="font-medium capitalize">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400 py-8">Data tidak ditemukan</div>
          )}
        </div>
      </div>
    </div>
  )
}
