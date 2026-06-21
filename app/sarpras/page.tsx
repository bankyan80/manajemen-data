'use client'

import { useState } from 'react'
import AppShellTopbar from '@/components/layout/AppShellTopbar'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useData, fetchJson } from '@/lib/useData'
import { PackageOpen, CheckCircle2, AlertCircle, Loader2, Plus, ArrowLeft } from 'lucide-react'

const KATEGORI = ['Tanah', 'Bangunan', 'Ruang Kelas', 'Ruang Kantor', 'Laboratorium', 'Perpustakaan', 'Sanitasi', 'Penunjang', 'Alat & Buku']

const FIELDS: Record<string, { key: string; label: string; type: 'text' | 'number' | 'select' | 'checkbox'; options?: string[] }[]> = {
  Tanah: [
    { key: 'kepemilikan', label: 'Status Kepemilikan', type: 'select', options: ['', 'Milik Sendiri', 'Sewa', 'Hibah'] },
    { key: 'luas_lahan', label: 'Luas Lahan (m²)', type: 'number' },
    { key: 'luas_bangunan', label: 'Luas Bangunan (m²)', type: 'number' },
  ],
  Bangunan: [
    { key: 'kondisi', label: 'Kondisi', type: 'select', options: ['', 'Baik', 'Rusak Ringan', 'Rusak Sedang', 'Rusak Berat'] },
    { key: 'tahun_bangun', label: 'Tahun Bangun', type: 'number' },
    { key: 'tingkat_kerusakan', label: 'Tingkat Kerusakan', type: 'text' },
  ],
  'Ruang Kelas': [
    { key: 'jumlah', label: 'Jumlah', type: 'number' },
    { key: 'kondisi', label: 'Kondisi', type: 'select', options: ['', 'Baik', 'Rusak Ringan', 'Rusak Sedang', 'Rusak Berat'] },
    { key: 'luas', label: 'Luas (m²)', type: 'number' },
  ],
  'Ruang Kantor': [
    { key: 'ruang_kepsek', label: 'Ruang Kepala Sekolah', type: 'number' },
    { key: 'ruang_guru', label: 'Ruang Guru', type: 'number' },
    { key: 'ruang_tu', label: 'Ruang TU', type: 'number' },
    { key: 'ruang_bk', label: 'Ruang BK', type: 'number' },
  ],
  Laboratorium: [
    { key: 'ipa', label: 'IPA', type: 'number' },
    { key: 'komputer', label: 'Komputer', type: 'number' },
    { key: 'bahasa', label: 'Bahasa', type: 'number' },
    { key: 'multimedia', label: 'Multimedia', type: 'number' },
  ],
  Perpustakaan: [
    { key: 'ada', label: 'Ada', type: 'checkbox' },
    { key: 'luas', label: 'Luas (m²)', type: 'number' },
    { key: 'jumlah_buku', label: 'Jumlah Buku', type: 'number' },
  ],
  Sanitasi: [
    { key: 'toilet_guru', label: 'Toilet Guru', type: 'number' },
    { key: 'toilet_siswa_l', label: 'Toilet Siswa Laki-laki', type: 'number' },
    { key: 'toilet_siswa_p', label: 'Toilet Siswa Perempuan', type: 'number' },
    { key: 'sumber_air', label: 'Sumber Air', type: 'text' },
  ],
  Penunjang: [
    { key: 'uks', label: 'UKS', type: 'checkbox' },
    { key: 'ibadah', label: 'Tempat Ibadah', type: 'checkbox' },
    { key: 'kantin', label: 'Kantin', type: 'checkbox' },
    { key: 'gudang', label: 'Gudang', type: 'checkbox' },
    { key: 'parkir', label: 'Parkir', type: 'checkbox' },
  ],
  'Alat & Buku': [
    { key: 'meja', label: 'Meja', type: 'number' },
    { key: 'kursi', label: 'Kursi', type: 'number' },
    { key: 'papan_tulis', label: 'Papan Tulis', type: 'number' },
    { key: 'laptop', label: 'Laptop', type: 'number' },
    { key: 'buku_teks', label: 'Buku Teks', type: 'number' },
  ],
}

const DEFAULT_VALUES: Record<string, any> = {
  Tanah: { kepemilikan: '', luas_lahan: 0, luas_bangunan: 0 },
  Bangunan: { kondisi: '', tahun_bangun: 0, tingkat_kerusakan: '' },
  'Ruang Kelas': { jumlah: 0, kondisi: '', luas: 0 },
  'Ruang Kantor': { ruang_kepsek: 0, ruang_guru: 0, ruang_tu: 0, ruang_bk: 0 },
  Laboratorium: { ipa: 0, komputer: 0, bahasa: 0, multimedia: 0 },
  Perpustakaan: { ada: false, luas: 0, jumlah_buku: 0 },
  Sanitasi: { toilet_guru: 0, toilet_siswa_l: 0, toilet_siswa_p: 0, sumber_air: '' },
  Penunjang: { uks: false, ibadah: false, kantin: false, gudang: false, parkir: false },
  'Alat & Buku': { meja: 0, kursi: 0, papan_tulis: 0, laptop: 0, buku_teks: 0 },
}

function hasData(obj: any): boolean {
  if (!obj) return false
  if (obj.ada !== undefined) return obj.ada === true || obj.luas > 0 || obj.jumlah_buku > 0
  if (obj.kepemilikan !== undefined) return obj.kepemilikan !== '' || obj.luas_lahan > 0
  if (obj.kondisi !== undefined) return obj.kondisi !== '' || obj.jumlah > 0
  return Object.values(obj).some(v => v !== '' && v !== 0 && v !== false)
}

export default function SarprasPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [refreshKey, setRefreshKey] = useState(0)
  const [detailSekolah, setDetailSekolah] = useState<any | null>(null)
  const [editingKat, setEditingKat] = useState<string | null>(null)
  const [formData, setFormData] = useState<any>({})
  const [formKeterangan, setFormKeterangan] = useState('')
  const [saving, setSaving] = useState(false)

  const { data: sarpras } = useData<any[]>(`sarpras-${refreshKey}`, () => fetchJson('/api/sarpras'))
  const { data: allSchools } = useData<any[]>('schools', () => fetchJson('/api/schools'))

  if (status === 'loading') return <div className="p-8 text-center text-zinc-500">Memuat...</div>
  if (!session) { router.push('/login'); return null }

  const role = session.user?.role
  const userSchoolId = session.user?.sekolah_id

  const sekolahList = (allSchools || []).filter(s => role !== 'operator_sekolah' || s.id === userSchoolId)

  const openEdit = (kategori: string) => {
    const existing = (sarpras || []).find(s => s.kategori === kategori && (role !== 'operator_sekolah' || s.school_id === userSchoolId))
    if (existing) {
      setFormData(JSON.parse(existing.data || '{}'))
      setFormKeterangan(existing.keterangan || '')
    } else {
      setFormData({ ...DEFAULT_VALUES[kategori] })
      setFormKeterangan('')
    }
    setEditingKat(kategori)
  }

  const closeEdit = () => { setEditingKat(null); setFormData({}); setFormKeterangan('') }

  const handleSave = async () => {
    setSaving(true)
    try {
      const existing = (sarpras || []).find(s => s.kategori === editingKat && (role !== 'operator_sekolah' || s.school_id === userSchoolId))
      const body = {
        school_id: userSchoolId,
        tahun_pelajaran: '2025/2026',
        kategori: editingKat,
        data: formData,
        keterangan: formKeterangan || null,
      }
      if (existing) {
        const res = await fetch(`/api/sarpras/${existing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        if (!res.ok) throw new Error('Gagal menyimpan')
      } else {
        const res = await fetch('/api/sarpras', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        if (!res.ok) throw new Error('Gagal menyimpan')
      }
      closeEdit()
      setRefreshKey(k => k + 1)
    } catch (err: any) {
      alert('Gagal: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const getDataForSchool = (schoolId: string, kategori: string) => {
    const s = (sarpras || []).find(x => x.school_id === schoolId && x.kategori === kategori)
    return s ? JSON.parse(s.data || '{}') : null
  }

  const getDataForKat = (kategori: string) => {
    const s = (sarpras || []).find(x => x.kategori === kategori && (role !== 'operator_sekolah' || x.school_id === userSchoolId))
    return s ? JSON.parse(s.data || '{}') : null
  }

  const sekolahWithData = new Set((sarpras || []).filter(s => hasData(JSON.parse(s.data || '{}'))).map(s => s.school_id))

  return (
    <AppShellTopbar>
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-zinc-900">Sarana Prasarana</h1>

        {/* Admin: daftar sekolah */}
        {role === 'admin_kecamatan' && !detailSekolah && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200">
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">NPSN</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Nama Sekolah</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Jenjang</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Status Input</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Kategori Terisi</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {sekolahList.map(s => {
                    const ada = sekolahWithData.has(s.id)
                    const katTerisi = (sarpras || [])
                      .filter(x => x.school_id === s.id && hasData(JSON.parse(x.data || '{}')))
                      .map(x => x.kategori)
                    return (
                      <tr key={s.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                        <td className="px-4 py-3">{s.npsn}</td>
                        <td className="px-4 py-3 font-medium text-zinc-900">{s.nama}</td>
                        <td className="px-4 py-3">{s.jenjang || '-'}</td>
                        <td className="px-4 py-3">
                          {ada ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3" />Sudah Input</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700"><AlertCircle className="w-3 h-3" />Belum Input</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-500">{katTerisi.length ? katTerisi.join(', ') : '-'}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => setDetailSekolah(s)} className="text-blue-600 hover:underline text-xs">Lihat Detail</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Admin: detail per sekolah */}
        {role === 'admin_kecamatan' && detailSekolah && (
          <>
            <div className="flex items-center gap-3">
              <button onClick={() => setDetailSekolah(null)} className="text-zinc-500 hover:text-zinc-800"><ArrowLeft className="w-5 h-5" /></button>
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">{detailSekolah.nama}</h2>
                <p className="text-sm text-zinc-500">NPSN: {detailSekolah.npsn} &middot; {detailSekolah.jenjang}</p>
              </div>
            </div>
            <div className="grid gap-4">
              {KATEGORI.map(kat => {
                const d = getDataForSchool(detailSekolah.id, kat)
                return (
                  <div key={kat} className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-zinc-900">{kat}</h3>
                      {d && hasData(d) ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Terisi</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-500">Kosong</span>
                      )}
                    </div>
                    {d && hasData(d) ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                        {FIELDS[kat].map(f => {
                          const val = d[f.key]
                          if (f.type === 'checkbox') {
                            return val ? <span key={f.key} className="text-zinc-700"><span className="text-zinc-400">{f.label}:</span> ✓</span> : null
                          }
                          if (!val && val !== 0) return null
                          return <span key={f.key} className="text-zinc-700"><span className="text-zinc-400">{f.label}:</span> {val}</span>
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-400">Belum diisi</p>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Operator: ringkasan + tabel */}
        {role === 'operator_sekolah' && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white border border-zinc-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-blue-700">{KATEGORI.length}</p>
                <p className="text-xs text-zinc-500">Total Kategori</p>
              </div>
              <div className="bg-white border border-zinc-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-700">{(sarpras || []).filter(s => s.school_id === userSchoolId && hasData(JSON.parse(s.data || '{}'))).length}</p>
                <p className="text-xs text-zinc-500">Sudah Diinput</p>
              </div>
              <div className="bg-white border border-zinc-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-amber-700">{KATEGORI.length - (sarpras || []).filter(s => s.school_id === userSchoolId && hasData(JSON.parse(s.data || '{}'))).length}</p>
                <p className="text-xs text-zinc-500">Belum Diinput</p>
              </div>
              <div className="bg-white border border-zinc-200 rounded-xl p-4 text-center" />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200">
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Kategori</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Status</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {KATEGORI.map(kat => {
                      const d = getDataForKat(kat)
                      const filled = d && hasData(d)
                      return (
                        <tr key={kat} className="border-b border-zinc-100 hover:bg-zinc-50">
                          <td className="px-4 py-3 font-medium text-zinc-900">{kat}</td>
                          <td className="px-4 py-3">
                            {filled ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3" />Sudah</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700"><AlertCircle className="w-3 h-3" />Belum</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => openEdit(kat)} className="text-blue-600 hover:underline text-xs">{filled ? 'Edit' : 'Input'}</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Fallback */}
        {role !== 'admin_kecamatan' && role !== 'operator_sekolah' && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-12 text-center">
            <PackageOpen className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
            <h3 className="font-semibold text-zinc-900 mb-2">Belum Ada Data Sarpras</h3>
            <p className="text-sm text-zinc-500 max-w-md mx-auto">Data sarana dan prasarana sekolah/lembaga belum diinput.</p>
          </div>
        )}

        {/* Modal form per kategori */}
        {editingKat && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={closeEdit}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
                <h3 className="font-semibold text-zinc-900">{editingKat}</h3>
                <button onClick={closeEdit} className="text-zinc-400 hover:text-zinc-600 text-xl leading-none">&times;</button>
              </div>
              <div className="px-6 py-4 space-y-4 text-sm">
                {FIELDS[editingKat].map(f => (
                  <div key={f.key} className="flex items-start gap-4">
                    <span className="w-36 shrink-0 text-zinc-500 pt-2">{f.label}</span>
                    {f.type === 'select' ? (
                      <select value={formData[f.key] ?? ''} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })} className="flex-1 px-3 py-1.5 border border-zinc-300 rounded-lg bg-white">
                        {f.options?.map(o => <option key={o} value={o}>{o || 'Pilih...'}</option>)}
                      </select>
                    ) : f.type === 'checkbox' ? (
                      <input type="checkbox" checked={!!formData[f.key]} onChange={e => setFormData({ ...formData, [f.key]: e.target.checked })} className="mt-2 w-4 h-4 rounded border-zinc-300" />
                    ) : (
                      <input type={f.type} value={formData[f.key] ?? ''} onChange={e => setFormData({ ...formData, [f.key]: f.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value })} className="flex-1 px-3 py-1.5 border border-zinc-300 rounded-lg bg-white" />
                    )}
                  </div>
                ))}
                <div className="flex items-start gap-4">
                  <span className="w-36 shrink-0 text-zinc-500 pt-2">Keterangan</span>
                  <textarea value={formKeterangan} onChange={e => setFormKeterangan(e.target.value)} className="flex-1 px-3 py-1.5 border border-zinc-300 rounded-lg bg-white" rows={2} />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-200">
                <button onClick={closeEdit} className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900">Batal</button>
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShellTopbar>
  )
}
