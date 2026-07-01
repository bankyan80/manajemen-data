'use client'

import { X, Pencil, Save, Trash2, AlertCircle } from 'lucide-react'
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

const EDITABLE_FIELDS = [
  { key: 'nama', label: 'Nama' },
  { key: 'nik', label: 'NIK' },
  { key: 'nip', label: 'NIP' },
  { key: 'nuptk', label: 'NUPTK' },
  { key: 'jabatan', label: 'Jabatan' },
  { key: 'status_pegawai', label: 'Status Pegawai' },
  { key: 'pendidikan_terakhir', label: 'Pendidikan' },
  { key: 'jurusan', label: 'Jurusan' },
  { key: 'tmt_kerja', label: 'TMT Kerja' },
  { key: 'tanggal_bup', label: 'Tgl. BUP' },
]

export default function TeacherDetailModal({
  teacherId,
  onClose,
  onUpdated,
}: {
  teacherId: string
  onClose: () => void
  onUpdated?: () => void
}) {
  const [teacher, setTeacher] = useState<TeacherDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})

  const fetchTeacher = async () => {
    setLoading(true)
    try {
      const data = await safeFetch<{ teachers: TeacherDetail[] }>(`/api/v2/teachers?id=${teacherId}`)
      const t = data.teachers?.[0]
      if (t) {
        setTeacher(t)
        setForm({
          nama: t.nama || '',
          nik: t.nik || '',
          nip: t.nip || '',
          nuptk: t.nuptk || '',
          jabatan: t.jabatan || '',
          status_pegawai: t.status_pegawai || '',
          pendidikan_terakhir: t.pendidikan_terakhir || '',
          jurusan: t.jurusan || '',
          tmt_kerja: t.tmt_kerja || '',
          tanggal_bup: t.tanggal_bup || '',
        })
      }
    } catch {
      setError('Gagal memuat data guru')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTeacher() }, [teacherId])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await safeFetch(`/api/v2/teachers?id=${teacherId}`, {
        method: 'PUT',
        body: JSON.stringify(form),
      })
      setEditing(false)
      await fetchTeacher()
      onUpdated?.()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Yakin ingin menghapus guru ini? Data tidak bisa dikembalikan.')) return
    setSaving(true)
    setError(null)
    try {
      await safeFetch(`/api/v2/teachers?id=${teacherId}`, { method: 'DELETE' })
      onUpdated?.()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold">Detail Guru</h2>
          <div className="flex items-center gap-1">
            {teacher && !editing && (
              <>
                <button onClick={() => setEditing(true)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400" title="Edit">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={handleDelete} className="p-2 rounded-lg hover:bg-red-50 text-red-400" title="Hapus">
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            {editing && (
              <button onClick={handleSave} disabled={saving} className="p-2 rounded-lg hover:bg-green-50 text-green-600" title="Simpan">
                <Save className="w-4 h-4" />
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-6">
          {error && (
            <div className="p-3 mb-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-5 w-full" />
              ))}
            </div>
          ) : teacher ? (
            <div className="space-y-4">
              {editing ? (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {EDITABLE_FIELDS.map(f => (
                    <div key={f.key}>
                      <label className="block text-xs text-slate-400 mb-1">{f.label}</label>
                      <input
                        className="input"
                        value={form[f.key] || ''}
                        onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>
          ) : (
            <div className="text-center text-slate-400 py-8">Data tidak ditemukan</div>
          )}
        </div>
      </div>
    </div>
  )
}
