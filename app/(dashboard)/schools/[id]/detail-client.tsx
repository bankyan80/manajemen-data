'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { safeFetch } from '@/lib/safe-fetch'
import {
  ArrowLeft, MapPin, School, Users,
  Building2, Archive, ChevronLeft, ChevronRight, BookOpen,
  Pencil, Save, X, Eye, Trash2, Plus, AlertCircle, Loader2,
} from 'lucide-react'
import { HEALTH_GRADE } from '@/constants'
import { cn, formatBytes } from '@/lib/utils'
import TeacherDetailModal from '../../teachers/teacher-detail-modal'

export interface SchoolProfile {
  id: string
  nama: string
  npsn: string
  jenjang: string
  status: string
  alamat: string
  desa: string
  kecamatan: string
  kepala_id: string | null
  latitude: number | null
  longitude: number | null
  health_score: number | null
  is_active: number | boolean
  created_at: number
  updated_at: number
}

interface TeacherRow {
  id: string
  nama: string
  nik: string
  nip?: string
  nuptk?: string
  jabatan?: string
  status_pegawai?: string
  sertifikasi?: string
  pendidikan_terakhir?: string
  tmt_kerja?: string
  tanggal_bup?: string
}

function getHealthGrade(score: number | null) {
  if (score === null || score === undefined) return { label: 'N/A', color: 'text-slate-400 bg-slate-50' }
  const grades = [HEALTH_GRADE.EXCELLENT, HEALTH_GRADE.GOOD, HEALTH_GRADE.MODERATE, HEALTH_GRADE.WARNING, HEALTH_GRADE.CRITICAL]
  for (const g of grades) {
    if (score >= g.min) return g
  }
  return HEALTH_GRADE.CRITICAL
}

function getHealthBarColor(score: number | null) {
  if (score === null) return 'bg-slate-200'
  if (score >= 90) return 'bg-green-500'
  if (score >= 75) return 'bg-blue-500'
  if (score >= 60) return 'bg-yellow-500'
  if (score >= 40) return 'bg-orange-500'
  return 'bg-red-500'
}

const TABS = [
  { id: 'profil', label: 'Profil', icon: School },
  { id: 'guru', label: 'Guru', icon: Users },
  { id: 'tendik', label: 'Tendik', icon: Users },
  { id: 'rombel', label: 'Rombel', icon: BookOpen },
  { id: 'infrastruktur', label: 'Infrastruktur', icon: Building2 },
  { id: 'arsip', label: 'Arsip', icon: Archive },
]

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs text-slate-400 w-28 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-slate-700 font-medium">{value || '-'}</span>
    </div>
  )
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <span className="text-sm text-slate-500">Halaman {page} dari {totalPages}</span>
      <div className="flex gap-1">
        <button disabled={page <= 1} onClick={() => onChange(page - 1)} className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button disabled={page >= totalPages} onClick={() => onChange(page + 1)} className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default function SchoolDetailClient({ school }: { school: SchoolProfile }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('profil')

  const [teachers, setTeachers] = useState<TeacherRow[]>([])
  const [teachersLoading, setTeachersLoading] = useState(false)
  const [teacherPage, setTeacherPage] = useState(1)
  const [teacherTotalPages, setTeacherTotalPages] = useState(1)

  const [tendik, setTendik] = useState<TeacherRow[]>([])
  const [tendikLoading, setTendikLoading] = useState(false)
  const [tendikPage, setTendikPage] = useState(1)
  const [tendikTotalPages, setTendikTotalPages] = useState(1)

  const [rombel, setRombel] = useState<any[]>([])
  const [rombelLoading, setRombelLoading] = useState(false)
  const [rombelSummary, setRombelSummary] = useState({ totalSiswa: 0, totalRombel: 0 })
  const [rombelTeachers, setRombelTeachers] = useState<any[]>([])

  const [editingProfil, setEditingProfil] = useState(false)
  const [profilForm, setProfilForm] = useState({ alamat: school.alamat, desa: school.desa, kepala_id: school.kepala_id || '' })
  const [savingProfil, setSavingProfil] = useState(false)

  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null)
  const [editingRombel, setEditingRombel] = useState<string | null>(null)
  const [savingRombel, setSavingRombel] = useState(false)
  const [editingRombelName, setEditingRombelName] = useState<string | null>(null)
  const [editRombelNameValue, setEditRombelNameValue] = useState('')
  const [editingRombelCount, setEditingRombelCount] = useState<string | null>(null)
  const [editRombelLaki, setEditRombelLaki] = useState('')
  const [editRombelPerempuan, setEditRombelPerempuan] = useState('')
  const [showAddRombel, setShowAddRombel] = useState(false)
  const [newRombelKelas, setNewRombelKelas] = useState('')
  const [newRombelName, setNewRombelName] = useState('')
  const [addRombelError, setAddRombelError] = useState('')
  const [addRombelLoading, setAddRombelLoading] = useState(false)

  const [archivesData, setArchivesData] = useState<any[]>([])
  const [archivesLoading, setArchivesLoading] = useState(false)

  const health = getHealthGrade(school.health_score)

  useEffect(() => {
    if (activeTab === 'guru') {
      setTeachersLoading(true)
      safeFetch<any>(`/api/v2/teachers?sekolah_id=${school.id}&page=${teacherPage}&limit=10&include_swasta=true`)
        .then(result => {
          setTeachers((result.teachers || []).filter((t: any) => t.jabatan !== 'Tenaga Kependidikan'))
          setTeacherTotalPages(result.pagination?.total_pages || 1)
        })
        .catch(console.error)
        .finally(() => setTeachersLoading(false))
    }
  }, [activeTab, teacherPage, school.id])

  useEffect(() => {
    if (activeTab === 'tendik') {
      setTendikLoading(true)
      safeFetch<any>(`/api/v2/teachers?sekolah_id=${school.id}&page=${tendikPage}&limit=10&include_swasta=true`)
        .then(result => {
          setTendik((result.teachers || []).filter((t: any) => t.jabatan === 'Tenaga Kependidikan'))
          setTendikTotalPages(result.pagination?.total_pages || 1)
        })
        .catch(console.error)
        .finally(() => setTendikLoading(false))
    }
  }, [activeTab, tendikPage, school.id])

  const loadRombel = () => {
    setRombelLoading(true)
    safeFetch<any>(`/api/v2/schools/${school.id}/rombel`)
      .then(result => {
        setRombel(result.rombel || [])
        setRombelSummary({ totalSiswa: result.totalSiswa || 0, totalRombel: result.totalRombel || 0 })
        setRombelTeachers(result.teachers || [])
      })
      .catch(console.error)
      .finally(() => setRombelLoading(false))
  }

  useEffect(() => {
    if (activeTab === 'rombel') loadRombel()
  }, [activeTab, school.id])

  useEffect(() => {
    if (activeTab === 'arsip') {
      setArchivesLoading(true)
      safeFetch<any>(`/api/v2/archives?school_id=${school.id}&limit=100`)
        .then(result => setArchivesData(result.archives || []))
        .catch(console.error)
        .finally(() => setArchivesLoading(false))
    }
  }, [activeTab, school.id])

  const handleAddRombel = async () => {
    const rombel = newRombelName.trim()
    if (school.jenjang === 'sd') {
      if (!newRombelKelas) { setAddRombelError('Pilih kelas terlebih dahulu'); return }
      if (!rombel) { setAddRombelError('Nama rombel tidak boleh kosong'); return }
    } else {
      if (!rombel) { setAddRombelError('Nama rombel tidak boleh kosong'); return }
    }
    const name = school.jenjang === 'sd' ? `${newRombelKelas}${rombel}` : rombel
    setAddRombelLoading(true)
    setAddRombelError('')
    try {
      await safeFetch(`/api/v2/schools/${school.id}/rombel`, {
        method: 'POST',
        body: JSON.stringify({ kelas_kelompok: name }),
      })
      setShowAddRombel(false)
      setNewRombelKelas('')
      setNewRombelName('')
      loadRombel()
    } catch (err: unknown) {
      setAddRombelError(err instanceof Error ? err.message : 'Gagal menambahkan rombel')
    } finally {
      setAddRombelLoading(false)
    }
  }

  const handleSaveRombelCounts = async (kelas_kelompok: string) => {
    const laki = parseInt(editRombelLaki)
    const perempuan = parseInt(editRombelPerempuan)
    if (isNaN(laki) || isNaN(perempuan) || laki < 0 || perempuan < 0) return
    try {
      await safeFetch(`/api/v2/schools/${school.id}/rombel`, {
        method: 'PUT',
        body: JSON.stringify({ kelas_kelompok, jumlah_laki: laki, jumlah_perempuan: perempuan }),
      })
      setEditingRombelCount(null)
      loadRombel()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menyimpan jumlah siswa')
    }
  }

  const handleRenameRombel = async (oldName: string, newName: string) => {
    if (!newName.trim() || newName === oldName) { setEditingRombelName(null); return }
    try {
      await safeFetch(`/api/v2/schools/${school.id}/rombel`, {
        method: 'PUT',
        body: JSON.stringify({ kelas_kelompok: oldName, nama_baru: newName.trim() }),
      })
      setEditingRombelName(null)
      loadRombel()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal mengubah nama rombel')
    }
  }

  const handleDeleteRombel = async (kelas_kelompok: string) => {
    if (!confirm(`Yakin ingin menghapus rombel "${kelas_kelompok}"?`)) return
    try {
      await safeFetch(`/api/v2/schools/${school.id}/rombel?kelas_kelompok=${encodeURIComponent(kelas_kelompok)}`, { method: 'DELETE' })
      loadRombel()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus rombel')
    }
  }

  return (
    <div className="page-container">
      <button
        onClick={() => router.push('/schools')}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke daftar sekolah
      </button>

      <div className="card p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-slate-800">{school.nama}</h1>
              <span className={cn(
                "badge",
                school.jenjang === 'sd' && "bg-blue-50 text-blue-700",
                school.jenjang === 'tk' && "bg-purple-50 text-purple-700",
                school.jenjang === 'kb' && "bg-pink-50 text-pink-700",
              )}>
                {school.jenjang.toUpperCase()}
              </span>
              <span className={cn(
                "badge",
                school.status === 'negeri' ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"
              )}>
                {school.status}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <MapPin className="w-3.5 h-3.5" />
              {school.alamat}, {school.desa}, {school.kecamatan}
            </div>
            <div className="text-sm text-slate-400 font-mono">
              NPSN: {school.npsn}
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-50 min-w-[140px]">
            <div className="text-3xl font-bold font-heading" style={{ color: school.health_score !== null ? (school.health_score >= 75 ? '#10B981' : school.health_score >= 60 ? '#F59E0B' : school.health_score >= 40 ? '#F97316' : '#EF4444') : '#94A3B8' }}>
              {school.health_score ?? 'N/A'}
            </div>
            <span className={cn("badge text-xs", health.color)}>{health.label}</span>
            <div className="text-[10px] text-slate-400">Health Score</div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
              <div
                className={cn("h-full rounded-full", getHealthBarColor(school.health_score))}
                style={{ width: `${school.health_score || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <div className="border-b border-border">
          <div className="flex overflow-x-auto">
            {TABS.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'profil' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">Informasi Sekolah</h3>
                <button
                  onClick={() => { setEditingProfil(!editingProfil); setProfilForm({ alamat: school.alamat, desa: school.desa, kepala_id: school.kepala_id || '' }) }}
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"
                  title={editingProfil ? 'Batal' : 'Edit'}
                >
                  {editingProfil ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                </button>
              </div>
              {editingProfil ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Alamat</label>
                    <textarea
                      className="input"
                      rows={2}
                      value={profilForm.alamat}
                      onChange={e => setProfilForm(p => ({ ...p, alamat: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Desa</label>
                    <input
                      className="input"
                      value={profilForm.desa}
                      onChange={e => setProfilForm(p => ({ ...p, desa: e.target.value }))}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-slate-400 mb-1">Kepala Sekolah ID</label>
                    <input
                      className="input"
                      value={profilForm.kepala_id}
                      onChange={e => setProfilForm(p => ({ ...p, kepala_id: e.target.value }))}
                    />
                  </div>
                  <div className="sm:col-span-2 flex justify-end">
                    <button
                      onClick={async () => {
                        setSavingProfil(true)
                        try {
                          await safeFetch(`/api/v2/schools?id=${school.id}`, {
                            method: 'PUT',
                            body: JSON.stringify(profilForm),
                          })
                          setEditingProfil(false)
                        } catch { }
                        finally { setSavingProfil(false) }
                      }}
                      disabled={savingProfil}
                      className="btn btn-primary btn-sm flex items-center gap-2"
                    >
                      {savingProfil ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                      Simpan
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InfoRow label="NPSN" value={school.npsn} />
                    <InfoRow label="Jenjang" value={school.jenjang.toUpperCase()} />
                    <InfoRow label="Status" value={school.status} />
                    <InfoRow label="Desa" value={school.desa} />
                    <InfoRow label="Kecamatan" value={school.kecamatan} />
                    <InfoRow label="Latitude" value={school.latitude?.toString() || '-'} />
                    <InfoRow label="Longitude" value={school.longitude?.toString() || '-'} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">Alamat</h3>
                    <p className="text-sm text-slate-600">{school.alamat}</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-4 py-2 rounded-xl">
                      <Users className="w-4 h-4 text-slate-400" />
                      Data Guru & Tendik tersedia di tab Guru
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-4 py-2 rounded-xl">
                      <BookOpen className="w-4 h-4 text-slate-400" />
                      Data Siswa & Rombel tersedia di tab Rombel
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'guru' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-700">Daftar Guru & Tendik</h3>
              </div>
              {teachersLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <div key={i} className="h-12 skeleton w-full" />)}
                </div>
              ) : teachers.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Tidak ada data guru
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table-base">
                    <thead>
                      <tr>
                        <th>Nama</th>
                        <th>NIK</th>
                        <th>Jabatan</th>
                        <th>Status</th>
                        <th>Sertifikasi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teachers.map(t => (
                        <tr key={t.id} className="cursor-pointer" onClick={() => setSelectedTeacherId(t.id)}>
                          <td className="font-medium text-slate-800">{t.nama}</td>
                          <td className="font-mono text-sm text-slate-500">{t.nik}</td>
                          <td className="text-slate-600 text-sm">{t.jabatan || '-'}</td>
                          <td>
                            <span className="badge bg-slate-100 text-slate-600 text-[11px]">
                              {t.status_pegawai?.replace(/_/g, ' ') || '-'}
                            </span>
                          </td>
                          <td>
                            {t.sertifikasi ? (
                              <span className="badge bg-green-50 text-green-700 text-[11px]">
                                Tersertifikasi
                              </span>
                            ) : (
                              <span className="badge bg-yellow-50 text-yellow-700 text-[11px]">
                                Belum
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <Pagination page={teacherPage} totalPages={teacherTotalPages} onChange={setTeacherPage} />
            </div>
          )}

          {activeTab === 'tendik' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-700">Tenaga Kependidikan</h3>
              </div>
              {tendikLoading ? (
                <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-12 skeleton w-full" />)}</div>
              ) : tendik.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Tidak ada data tendik
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table-base">
                    <thead>
                      <tr><th>Nama</th><th>NIK</th><th>Jabatan</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {tendik.map(t => (
                        <tr key={t.id} className="cursor-pointer" onClick={() => setSelectedTeacherId(t.id)}>
                          <td className="font-medium text-slate-800">{t.nama}</td>
                          <td className="font-mono text-sm text-slate-500">{t.nik}</td>
                          <td className="text-slate-600 text-sm">{t.jabatan || '-'}</td>
                          <td><span className="badge bg-slate-100 text-slate-600 text-[11px]">{t.status_pegawai?.replace(/_/g, ' ') || '-'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <Pagination page={tendikPage} totalPages={tendikTotalPages} onChange={setTendikPage} />
            </div>
          )}

          {activeTab === 'rombel' && (
            <div>
              <div className="flex items-center gap-4 mb-4">
                <h3 className="text-sm font-semibold text-slate-700">Rombongan Belajar</h3>
                <div className="flex gap-3 text-xs">
                  <span className="text-slate-500">Total Rombel: <strong>{rombelSummary.totalRombel}</strong></span>
                  <span className="text-slate-500">Total Siswa: <strong>{rombelSummary.totalSiswa}</strong></span>
                </div>
                <div className="ml-auto">
                  <button onClick={() => { setShowAddRombel(true); setNewRombelKelas(''); setNewRombelName(''); setAddRombelError('') }} className="btn btn-primary btn-sm flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Tambah Rombel
                  </button>
                </div>
              </div>

              {showAddRombel && (
                <div className="p-4 mb-4 rounded-xl bg-slate-50 border border-border">
                  <div className="flex items-end gap-3">
                    {school.jenjang === 'sd' ? (
                      <>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Kelas</label>
                          <select className="input" value={newRombelKelas} onChange={e => setNewRombelKelas(e.target.value)}>
                            <option value="">Pilih Kelas</option>
                            {['I', 'II', 'III', 'IV', 'V', 'VI'].map(k => (
                              <option key={k} value={k}>{k}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs text-slate-400 mb-1">Nama Rombel</label>
                          <input
                            className="input"
                            value={newRombelName}
                            onChange={e => setNewRombelName(e.target.value)}
                            placeholder="Contoh: A, B"
                            onKeyDown={e => { if (e.key === 'Enter') { handleAddRombel() } }}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="flex-1">
                        <label className="block text-xs text-slate-400 mb-1">Nama Rombel</label>
                        <input
                          className="input"
                          value={newRombelName}
                          onChange={e => setNewRombelName(e.target.value)}
                          placeholder="Contoh: A, A1, B, B1"
                          onKeyDown={e => { if (e.key === 'Enter') { handleAddRombel() } }}
                        />
                      </div>
                    )}
                    <button onClick={handleAddRombel} disabled={addRombelLoading} className="btn btn-primary btn-sm flex items-center gap-1">
                      {addRombelLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      Simpan
                    </button>
                    <button onClick={() => setShowAddRombel(false)} className="btn btn-ghost btn-sm">Batal</button>
                  </div>
                  {addRombelError && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
                      <AlertCircle className="w-3 h-3" /> {addRombelError}
                    </div>
                  )}
                </div>
              )}
              {rombelLoading ? (
                <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-12 skeleton w-full" />)}</div>
              ) : rombel.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Tidak ada data rombel
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table-base">
                    <thead>
                      <tr>
                        {school.jenjang === 'sd' && <th>Kelas</th>}
                        <th>Rombel</th>
                        <th>Laki-laki</th>
                        <th>Perempuan</th>
                        <th>Total</th>
                        <th>Wali Kelas</th>
                        <th className="w-16">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rombel.map((r: any, i: number) => (
                        <tr key={i}>
                          {school.jenjang === 'sd' && <td className="font-medium text-slate-800">{r.kelas_kelompok.match(/^[IVXLCDM]+/)?.[0] || r.kelas_kelompok}</td>}
                          <td className="text-slate-600 text-sm">
                            {editingRombelName === r.kelas_kelompok ? (
                              <div className="flex gap-1 items-center">
                                <input
                                  className="input text-xs py-1 px-2 w-36"
                                  value={editRombelNameValue}
                                  onChange={e => setEditRombelNameValue(e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter') handleRenameRombel(r.kelas_kelompok, editRombelNameValue); if (e.key === 'Escape') setEditingRombelName(null) }}
                                  autoFocus
                                />
                                <button onClick={() => handleRenameRombel(r.kelas_kelompok, editRombelNameValue)} className="text-green-600 hover:text-green-700">
                                  <Save className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setEditingRombelName(null)} className="text-slate-400 hover:text-slate-600">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : r.kelas_kelompok}
                          </td>
                          <td className="text-slate-600">
                            {editingRombelCount === r.kelas_kelompok ? (
                              <input
                                className="input text-xs py-1 px-2 w-16 text-center"
                                type="number"
                                min="0"
                                value={editRombelLaki}
                                onChange={e => setEditRombelLaki(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleSaveRombelCounts(r.kelas_kelompok); if (e.key === 'Escape') setEditingRombelCount(null) }}
                                autoFocus
                              />
                            ) : (
                              <button
                                onClick={() => { setEditingRombelCount(r.kelas_kelompok); setEditRombelLaki(String(r.laki)); setEditRombelPerempuan(String(r.perempuan)) }}
                                className="hover:text-primary text-right w-full"
                              >
                                {r.laki}
                              </button>
                            )}
                          </td>
                          <td className="text-slate-600">
                            {editingRombelCount === r.kelas_kelompok ? (
                              <input
                                className="input text-xs py-1 px-2 w-16 text-center"
                                type="number"
                                min="0"
                                value={editRombelPerempuan}
                                onChange={e => setEditRombelPerempuan(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleSaveRombelCounts(r.kelas_kelompok); if (e.key === 'Escape') setEditingRombelCount(null) }}
                              />
                            ) : (
                              <button
                                onClick={() => { setEditingRombelCount(r.kelas_kelompok); setEditRombelLaki(String(r.laki)); setEditRombelPerempuan(String(r.perempuan)) }}
                                className="hover:text-primary text-right w-full"
                              >
                                {r.perempuan}
                              </button>
                            )}
                          </td>
                          <td className="font-semibold text-slate-700">{r.total}</td>
                          <td className="text-slate-600 text-sm">
                            {editingRombel === r.kelas_kelompok ? (
                              <div className="flex gap-1 items-center">
                                <select
                                  className="input text-xs py-1 px-2 w-44"
                                  defaultValue={r.wali_kelas_id || ''}
                                  ref={el => { if (el && !el.dataset.set) { el.dataset.set = '1'; } }}
                                  onChange={async e => {
                                    const waliId = e.target.value
                                    setSavingRombel(true)
                                    try {
                                      await safeFetch(`/api/v2/schools/${school.id}/rombel`, {
                                        method: 'PUT',
                                        body: JSON.stringify({ kelas_kelompok: r.kelas_kelompok, wali_kelas_id: waliId || null }),
                                      })
                                      setEditingRombel(null)
                                      loadRombel()
                                    } catch {} finally { setSavingRombel(false) }
                                  }}
                                >
                                  <option value="">— Tanpa Wali —</option>
                                  {(rombelTeachers || []).map((t: any) => (
                                    <option key={t.id} value={t.id}>{t.nama}</option>
                                  ))}
                                </select>
                                <button onClick={() => setEditingRombel(null)} className="text-slate-400 hover:text-slate-600">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                                {savingRombel && <span className="text-xs text-primary animate-pulse">Menyimpan...</span>}
                              </div>
                            ) : (
                              <button
                                onClick={() => setEditingRombel(r.kelas_kelompok)}
                                className="hover:text-primary text-left flex items-center gap-1 group"
                              >
                                {r.wali_kelas || <span className="text-slate-300 italic">Klik atur</span>}
                                <Pencil className="w-3 h-3 text-slate-300 group-hover:text-primary hidden sm:inline" />
                              </button>
                            )}
                          </td>
                          <td>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => { setEditingRombelName(r.kelas_kelompok); setEditRombelNameValue(r.kelas_kelompok) }}
                                className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-500 transition-colors"
                                title="Edit nama rombel"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteRombel(r.kelas_kelompok)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                                title="Hapus rombel"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'infrastruktur' && (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-sm font-semibold text-slate-500 mb-2">Data Infrastruktur</h3>
              <p className="text-sm text-slate-400">
                Module infrastruktur sedang dalam pengembangan
              </p>
            </div>
          )}

          {activeTab === 'arsip' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-700">Dokumen Arsip</h3>
              </div>
              {archivesLoading ? (
                <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-12 skeleton w-full" />)}</div>
              ) : archivesData.length === 0 ? (
                <div className="text-center py-12">
                  <Archive className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-sm text-slate-400">Belum ada dokumen arsip</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table-base">
                    <thead>
                      <tr><th>Nama Dokumen</th><th>Kategori</th><th>Tipe</th><th>Ukuran</th><th>Aksi</th></tr>
                    </thead>
                    <tbody>
                      {archivesData.map((a: any) => (
                        <tr key={a.id}>
                          <td className="font-medium text-slate-800 text-sm">{a.file_name}</td>
                          <td><span className="badge bg-slate-100 text-slate-600 text-[11px]">{a.category}</span></td>
                          <td className="text-xs text-slate-500 uppercase">{a.file_type?.split('/').pop()}</td>
                          <td className="text-xs text-slate-500">{formatBytes(a.file_size)}</td>
                          <td>
                            {(a.file_url || a.drive_url) ? (
                              <a href={a.file_url || a.drive_url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-xs flex items-center gap-1">
                                <Eye className="w-3 h-3" /> Lihat
                              </a>
                            ) : <span className="text-xs text-slate-300">-</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
