'use client'

import { X, AlertCircle, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { safeFetch } from '@/lib/safe-fetch'

const JABATAN_SD = [
  'Kepala Sekolah',
  'Guru Kelas',
  'Guru Pendidikan Agama', 'Guru PJOK', 'Guru Bahasa Inggris',
  'Guru Matematika', 'Guru Bahasa Indonesia', 'Guru IPA', 'Guru IPS',
  'Guru PPKn', 'Guru Seni Budaya', 'Guru BK', 'Guru TIK',
  'Guru Muatan Lokal',
  'Tenaga Kependidikan',
]

const JABATAN_TK_KB = ['Guru', 'Kepala Sekolah', 'Tenaga Kependidikan']
const STATUS_OPTIONS = ['pns', 'pppk', 'pppk_paruh_waktu', 'honorer', 'gty']
const PENDIDIKAN_OPTIONS = [
  'SD Sederajat', 'SMP Sederajat', 'SMA Sederajat',
  'D1', 'D2', 'D3', 'D4/S1', 'S2', 'S3',
]
const JENIS_KELAMIN = ['L', 'P']

export default function AddTeacherModal({
  onClose,
  onAdded,
}: {
  onClose: () => void
  onAdded?: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string, string>>({
    nama: '',
    nik: '',
    nip: '',
    nuptk: '',
    email: '',
    no_hp: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    jenis_kelamin: '',
    jabatan: '',
    status_pegawai: '',
    pangkat_golongan: '',
    pendidikan_terakhir: '',
    jurusan: '',
    tmt_kerja: '',
    tanggal_bup: '',
  })

  const setField = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async () => {
    if (!form.nama || !form.nik) {
      setError('Nama dan NIK wajib diisi')
      return
    }

    setSaving(true)
    setError(null)
    try {
      await safeFetch('/api/employees', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      onAdded?.()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold">Tambah Guru / Tendik Baru</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-3 mb-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {([
              { key: 'nama', label: 'Nama *', required: true },
              { key: 'nik', label: 'NIK *', required: true },
              { key: 'nip', label: 'NIP' },
              { key: 'nuptk', label: 'NUPTK' },
              { key: 'email', label: 'Email' },
              { key: 'no_hp', label: 'No. HP' },
              { key: 'tempat_lahir', label: 'Tempat Lahir' },
              { key: 'tanggal_lahir', label: 'Tanggal Lahir', type: 'date' },
              { key: 'jenis_kelamin', label: 'Jenis Kelamin', options: JENIS_KELAMIN },
              { key: 'jabatan', label: 'Jabatan', options: [...new Set([...JABATAN_SD, ...JABATAN_TK_KB])] },
              { key: 'status_pegawai', label: 'Status Pegawai', options: STATUS_OPTIONS },
              { key: 'pangkat_golongan', label: 'Pangkat/Golongan' },
              { key: 'pendidikan_terakhir', label: 'Pendidikan', options: PENDIDIKAN_OPTIONS },
              { key: 'jurusan', label: 'Jurusan' },
              { key: 'tmt_kerja', label: 'TMT Kerja', type: 'date' },
              { key: 'tanggal_bup', label: 'Tgl. BUP', type: 'date' },
            ] as const).map(f => (
              <div key={f.key} className={f.key === 'nama' || f.key === 'nik' ? 'col-span-2' : ''}>
                <label className="block text-xs text-slate-400 mb-1">{f.label}</label>
                {'options' in f && f.options ? (
                  <select
                    className="input"
                    value={form[f.key]}
                    onChange={e => setField(f.key, e.target.value)}
                  >
                    <option value="">Pilih {f.label}</option>
                    {f.options.map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="input"
                    type={'type' in f && f.type ? f.type : 'text'}
                    value={form[f.key]}
                    onChange={e => setField(f.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <button onClick={onClose} className="btn btn-secondary" disabled={saving}>Batal</button>
          <button onClick={handleSubmit} className="btn btn-primary" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Simpan
          </button>
        </div>
      </div>
    </div>
  )
}
