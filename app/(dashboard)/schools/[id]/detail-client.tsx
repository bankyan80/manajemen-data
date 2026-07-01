'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { safeFetch } from '@/lib/safe-fetch'
import {
  ArrowLeft, MapPin, School, Users, GraduationCap,
  Building2, Archive, ChevronLeft, ChevronRight, BookOpen,
  Pencil, Save, X,
} from 'lucide-react'
import { HEALTH_GRADE } from '@/constants'
import { cn } from '@/lib/utils'
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

interface StudentRow {
  id: string
  nama: string
  nik?: string
  nisn?: string
  jenjang: string
  kelas_kelompok: string
  jenis_kelamin?: string
  status_siswa: string
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
  { id: 'siswa', label: 'Siswa', icon: GraduationCap },
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

  const [students, setStudents] = useState<StudentRow[]>([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [studentPage, setStudentPage] = useState(1)
  const [studentTotalPages, setStudentTotalPages] = useState(1)

  const [rombel, setRombel] = useState<any[]>([])
  const [rombelLoading, setRombelLoading] = useState(false)
  const [rombelSummary, setRombelSummary] = useState({ totalSiswa: 0, totalRombel: 0 })

  const [editingProfil, setEditingProfil] = useState(false)
  const [profilForm, setProfilForm] = useState({ alamat: school.alamat, desa: school.desa, kepala_id: school.kepala_id || '' })
  const [savingProfil, setSavingProfil] = useState(false)

  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null)
  const [editingSiswa, setEditingSiswa] = useState<string | null>(null)
  const [siswaForm, setSiswaForm] = useState<Record<string, string>>({})

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

  useEffect(() => {
    if (activeTab === 'siswa') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStudentsLoading(true)
      safeFetch<any>(`/api/v2/students?school_id=${school.id}&page=${studentPage}&limit=10`)
        .then(result => {
          setStudents(result.students || [])
          setStudentTotalPages(result.pagination?.total_pages || 1)
        })
        .catch(console.error)
        .finally(() => setStudentsLoading(false))
    }
  }, [activeTab, studentPage, school.id])

  useEffect(() => {
    if (activeTab === 'rombel') {
      setRombelLoading(true)
      safeFetch<any>(`/api/v2/schools/${school.id}/rombel`)
        .then(result => {
          setRombel(result.rombel || [])
          setRombelSummary({ totalSiswa: result.totalSiswa || 0, totalRombel: result.totalRombel || 0 })
        })
        .catch(console.error)
        .finally(() => setRombelLoading(false))
    }
  }, [activeTab, school.id])

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
                      <GraduationCap className="w-4 h-4 text-slate-400" />
                      Data Siswa tersedia di tab Siswa
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

          {activeTab === 'siswa' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-700">Daftar Siswa</h3>
              </div>
              {studentsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <div key={i} className="h-12 skeleton w-full" />)}
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Tidak ada data siswa
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table-base">
                    <thead>
                      <tr>
                        <th>Nama</th>
                        <th>NISN</th>
                        <th>NIK</th>
                        <th>Kelas</th>
                        <th>Jenis Kelamin</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(s => (
                        <tr key={s.id}>
                          <td className="font-medium text-slate-800">
                            <button onClick={() => { setEditingSiswa(editingSiswa === s.id ? null : s.id); setSiswaForm({ nama: s.nama, nisn: s.nisn || '', nik: s.nik || '', kelas_kelompok: s.kelas_kelompok, jenis_kelamin: s.jenis_kelamin || '' }) }} className="hover:text-primary text-left">
                              {s.nama}
                            </button>
                          </td>
                          <td className="font-mono text-sm text-slate-500">{s.nisn || '-'}</td>
                          <td className="font-mono text-sm text-slate-500">{s.nik || '-'}</td>
                          <td className="text-sm text-slate-600">{s.kelas_kelompok}</td>
                          <td className="text-sm text-slate-600 capitalize">{s.jenis_kelamin || '-'}</td>
                          <td>
                            <span className={cn(
                              "badge text-[11px]",
                              s.status_siswa === 'aktif' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                            )}>
                              {s.status_siswa}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {editingSiswa && (
                        <tr>
                          <td colSpan={6} className="p-4 bg-slate-50">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                              <div>
                                <label className="block text-xs text-slate-400 mb-1">Nama</label>
                                <input className="input" value={siswaForm.nama} onChange={e => setSiswaForm(p => ({ ...p, nama: e.target.value }))} />
                              </div>
                              <div>
                                <label className="block text-xs text-slate-400 mb-1">NISN</label>
                                <input className="input" value={siswaForm.nisn} onChange={e => setSiswaForm(p => ({ ...p, nisn: e.target.value }))} />
                              </div>
                              <div>
                                <label className="block text-xs text-slate-400 mb-1">NIK</label>
                                <input className="input" value={siswaForm.nik} onChange={e => setSiswaForm(p => ({ ...p, nik: e.target.value }))} />
                              </div>
                              <div>
                                <label className="block text-xs text-slate-400 mb-1">Kelas</label>
                                <input className="input" value={siswaForm.kelas_kelompok} onChange={e => setSiswaForm(p => ({ ...p, kelas_kelompok: e.target.value }))} />
                              </div>
                              <div>
                                <label className="block text-xs text-slate-400 mb-1">Jenis Kelamin</label>
                                <select className="input" value={siswaForm.jenis_kelamin} onChange={e => setSiswaForm(p => ({ ...p, jenis_kelamin: e.target.value }))}>
                                  <option value="">Pilih</option>
                                  <option value="laki-laki">Laki-laki</option>
                                  <option value="perempuan">Perempuan</option>
                                </select>
                              </div>
                              <div className="flex items-end gap-2">
                                <button
                                  onClick={async () => {
                                    try {
                                      await safeFetch(`/api/v2/students/${editingSiswa}`, { method: 'PUT', body: JSON.stringify(siswaForm) })
                                      setEditingSiswa(null)
                                    } catch {}
                                  }}
                                  className="btn btn-primary btn-sm flex items-center gap-1"
                                ><Save className="w-3.5 h-3.5" /> Simpan</button>
                                <button onClick={() => setEditingSiswa(null)} className="btn btn-ghost btn-sm">Batal</button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              <Pagination page={studentPage} totalPages={studentTotalPages} onChange={setStudentPage} />
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
              </div>
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
                        <th>Kelas</th>
                        <th>Laki-laki</th>
                        <th>Perempuan</th>
                        <th>Total</th>
                        <th>Wali Kelas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rombel.map((r: any, i: number) => (
                        <tr key={i}>
                          <td className="font-medium text-slate-800">{school.jenjang !== 'sd' ? r.kelas_kelompok.replace(/\s*\(.*\)/, '') : r.kelas_kelompok}</td>
                          <td className="text-slate-600">{r.laki}</td>
                          <td className="text-slate-600">{r.perempuan}</td>
                          <td className="font-semibold text-slate-700">{r.total}</td>
                          <td className="text-slate-600 text-sm">{r.wali_kelas || '-'}</td>
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
            <div className="text-center py-12">
              <Archive className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-sm font-semibold text-slate-500 mb-2">Dokumen Arsip</h3>
              <p className="text-sm text-slate-400">
                Module arsip digital sedang dalam pengembangan
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
