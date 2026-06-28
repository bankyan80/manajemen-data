'use client'

import { useState, useEffect, useCallback } from 'react'
import AppShellTopbar from '@/components/layout/AppShellTopbar'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { fetchJson } from '@/lib/useData'
import { Plus, Edit2, Trash2, Eye, X, ChevronLeft, ChevronRight, Loader2, Search } from 'lucide-react'


const KELAS_OPTIONS: Record<string, string[]> = {
  sd: ['Kelas I', 'Kelas II', 'Kelas III', 'Kelas IV', 'Kelas V', 'Kelas VI'],
  tk: ['Kelompok A', 'Kelompok B'],
  kb: ['2\u20133 Tahun', '3\u20134 Tahun', '4\u20135 Tahun'],
}

const KELAS_LABEL: Record<string, string> = {
  sd: 'Kelas / Rombel',
  tk: 'Kelompok Belajar',
  kb: 'Kelompok Usia',
}

interface Student {
  id: string; school_id: string; tahun_pelajaran: string; jenjang: string
  kelas_kelompok: string; nama: string; nik: string; nisn: string
  jenis_kelamin: string; tempat_lahir: string; tanggal_lahir: string
  alamat: string; nama_orang_tua: string; no_hp: string; status_siswa: string
  created_at: number; school_nama?: string
}

interface Mutation {
  id: string; school_id: string; student_id?: string
  tanggal: string; nama: string; nisn: string; nik: string; jenis_kelamin: string
  kelas_kelompok: string; sekolah_asal?: string; sekolah_tujuan?: string
  alasan: string; dokumen_url?: string; keterangan: string
  created_at: string; school_nama: string
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-zinc-100 rounded-lg"><X className="w-5 h-5 text-zinc-500" /></button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  )
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200">
      <span className="text-sm text-zinc-500">Halaman {page} dari {totalPages}</span>
      <div className="flex gap-1">
        <button disabled={page <= 1} onClick={() => onChange(page - 1)} className="p-1.5 rounded-lg hover:bg-zinc-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
        <button disabled={page >= totalPages} onClick={() => onChange(page + 1)} className="p-1.5 rounded-lg hover:bg-zinc-100 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
      <div className="p-4 space-y-3">
        {[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-zinc-100 rounded animate-pulse" />)}
      </div>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <div className="text-center py-12 text-zinc-400 text-sm">{text}</div>
}

type Submenu = 'peserta-didik' | 'mutasi-masuk' | 'mutasi-keluar'
export type Jenjang = 'sd' | 'tk' | 'kb'
type TabMode = 'list' | 'add' | 'edit' | 'detail'

interface KesiswaanContentProps {
  allowedJenjang?: Jenjang[]
  defaultJenjang?: Jenjang
}

export default function KesiswaanContent({ allowedJenjang, defaultJenjang }: KesiswaanContentProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const role = (session?.user as any)?.role
  const userSekolahId = (session?.user as any)?.sekolah_id

  const jenjangList = allowedJenjang ?? (['sd', 'tk', 'kb'] as Jenjang[])
  const [jenjang, setJenjang] = useState<Jenjang>(defaultJenjang ?? 'sd')
  const [submenu, setSubmenu] = useState<Submenu>('peserta-didik')
  const [mode, setMode] = useState<TabMode>('list')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Filters
  const [filterKelas, setFilterKelas] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [searchQ, setSearchQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')

  // Data
  const [students, setStudents] = useState<Student[]>([])
  const [studentsTotal, setStudentsTotal] = useState(0)
  const [studentsPage, setStudentsPage] = useState(1)
  const [studentsPages, setStudentsPages] = useState(1)
  const [loading, setLoading] = useState(false)

  const [mutMasuk, setMutMasuk] = useState<Mutation[]>([])
  const [mutMasukTotal, setMutMasukTotal] = useState(0)
  const [mutMasukPage, setMutMasukPage] = useState(1)
  const [mutMasukPages, setMutMasukPages] = useState(1)

  const [mutKeluar, setMutKeluar] = useState<Mutation[]>([])
  const [mutKeluarTotal, setMutKeluarTotal] = useState(0)
  const [mutKeluarPage, setMutKeluarPage] = useState(1)
  const [mutKeluarPages, setMutKeluarPages] = useState(1)

  const [mutating, setMutating] = useState(false)

  // Auto-detect operator's school jenjang from session
  const sekolahJenjang = (session?.user as any)?.sekolah_jenjang
  useEffect(() => {
    if (status !== 'authenticated' || defaultJenjang) return
    if (role === 'operator_sekolah' && sekolahJenjang && jenjangList.includes(sekolahJenjang) && jenjang !== sekolahJenjang) {
      setJenjang(sekolahJenjang)
    }
  }, [status, defaultJenjang, role, sekolahJenjang, jenjang, jenjangList])

  // Forms
  const emptyForm = () => ({
    nama: '', nik: '', nisn: '', jenis_kelamin: 'laki-laki',
    tempat_lahir: '', tanggal_lahir: '', alamat: '', nama_orang_tua: '', no_hp: '',
    kelas_kelompok: '', status_siswa: 'aktif', tahun_pelajaran: '2026/2027',
  })
  const [form, setForm] = useState(emptyForm())
  const [nikLookupLoading, setNikLookupLoading] = useState(false)
  const [nikLookupMsg, setNikLookupMsg] = useState('')

  const emptyMutasiForm = (jenis: 'masuk' | 'keluar') => ({
    tanggal: new Date().toISOString().split('T')[0],
    nama: '', nisn: '', nik: '', jenis_kelamin: 'laki-laki',
    kelas_kelompok: '',
    sekolah_asal: '', sekolah_tujuan: '',
    alasan: '', dokumen_url: '', keterangan: '',
  })
  const [mutForm, setMutForm] = useState(emptyMutasiForm('masuk'))

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchQ), 400)
    return () => clearTimeout(t)
  }, [searchQ])

  // NIK autofill lookup
  useEffect(() => {
    const nik = form.nik?.trim()
    if (!nik || nik.length < 10) {
      setNikLookupMsg('')
      return
    }
    setNikLookupLoading(true)
    setNikLookupMsg('')
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/kesiswaan/students/lookup-nik?nik=${encodeURIComponent(nik)}&jenjang=${jenjang}`)
        const json = await res.json()
        if (json.data) {
          setForm(f => ({
            ...f,
            nama: json.data.nama || f.nama,
            nisn: json.data.nisn || f.nisn,
            jenis_kelamin: json.data.jenis_kelamin || f.jenis_kelamin,
            tempat_lahir: json.data.tempat_lahir || f.tempat_lahir,
            tanggal_lahir: json.data.tanggal_lahir || f.tanggal_lahir,
            alamat: json.data.alamat || f.alamat,
            nama_orang_tua: json.data.nama_orang_tua || f.nama_orang_tua,
            no_hp: json.data.no_hp || f.no_hp,
          }))
          setNikLookupMsg('Data ditemukan, field terisi otomatis ✓')
        } else {
          setNikLookupMsg('Data tidak ditemukan, isi manual')
        }
      } catch {
        setNikLookupMsg('Gagal mencari data')
      } finally {
        setNikLookupLoading(false)
      }
    }, 600)
    return () => clearTimeout(t)
  }, [form.nik, jenjang])

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        jenjang, page: String(studentsPage), limit: '20',
        tahun_pelajaran: '2026/2027',
      })
      if (filterKelas) params.set('kelas', filterKelas)
      if (filterStatus) params.set('status', filterStatus)
      if (debouncedQ) params.set('q', debouncedQ)
      const res = await fetchJson<{ data: Student[]; total: number; total_pages: number }>(
        `/api/kesiswaan/students?${params}`
      )
      setStudents(res.data)
      setStudentsTotal(res.total)
      setStudentsPages(res.total_pages)
    } finally { setLoading(false) }
  }, [jenjang, studentsPage, filterKelas, filterStatus, debouncedQ, role])

  const fetchMutMasuk = useCallback(async () => {
    const params = new URLSearchParams({ page: String(mutMasukPage), limit: '20' })
    if (debouncedQ) params.set('q', debouncedQ)
    const res = await fetchJson<{ data: Mutation[]; total: number; total_pages: number }>(
      `/api/kesiswaan/mutasi-masuk?${params}`
    )
    setMutMasuk(res.data)
    setMutMasukTotal(res.total)
    setMutMasukPages(res.total_pages)
  }, [mutMasukPage, debouncedQ])

  const fetchMutKeluar = useCallback(async () => {
    const params = new URLSearchParams({ page: String(mutKeluarPage), limit: '20' })
    if (debouncedQ) params.set('q', debouncedQ)
    const res = await fetchJson<{ data: Mutation[]; total: number; total_pages: number }>(
      `/api/kesiswaan/mutasi-keluar?${params}`
    )
    setMutKeluar(res.data)
    setMutKeluarTotal(res.total)
    setMutKeluarPages(res.total_pages)
  }, [mutKeluarPage, debouncedQ])

  useEffect(() => {
    if (submenu === 'peserta-didik') fetchStudents()
    else if (submenu === 'mutasi-masuk') fetchMutMasuk()
    else fetchMutKeluar()
  }, [submenu, fetchStudents, fetchMutMasuk, fetchMutKeluar])

  // Stats
  const totalL = students.filter(s => s.jenis_kelamin === 'laki-laki').length
  const totalP = students.filter(s => s.jenis_kelamin === 'perempuan').length
  const totalAktif = students.filter(s => s.status_siswa === 'aktif').length

  const kelasOptions = KELAS_OPTIONS[jenjang] || []

  // CRUD Students
  const handleSaveStudent = async () => {
    setMutating(true)
    try {
      if (mode === 'add') {
        await fetch('/api/kesiswaan/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, jenjang }),
        })
      } else if (mode === 'edit' && selectedId) {
        await fetch(`/api/kesiswaan/students/${selectedId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      }
      setMode('list')
      setSelectedId(null)
      fetchStudents()
    } finally { setMutating(false) }
  }

  const handleDeleteStudent = async (id: string) => {
    if (!confirm('Hapus data peserta didik ini?')) return
    await fetch(`/api/kesiswaan/students/${id}`, { method: 'DELETE' })
    fetchStudents()
  }

  const handleEditStudent = async (id: string) => {
    const s = students.find(x => x.id === id)
    if (!s) return
    setForm({
      nama: s.nama, nik: s.nik || '', nisn: s.nisn || '',
      jenis_kelamin: s.jenis_kelamin || 'laki-laki',
      tempat_lahir: s.tempat_lahir || '', tanggal_lahir: s.tanggal_lahir || '',
      alamat: s.alamat || '', nama_orang_tua: s.nama_orang_tua || '',
      no_hp: s.no_hp || '', kelas_kelompok: s.kelas_kelompok,
      status_siswa: s.status_siswa, tahun_pelajaran: s.tahun_pelajaran,
    })
    setSelectedId(id)
    setMode('edit')
  }

  const handleDetailStudent = (id: string) => {
    setSelectedId(id)
    setMode('detail')
  }

  // CRUD Mutasi Masuk
  const handleSaveMutMasuk = async () => {
    setMutating(true)
    try {
      if (mode === 'add') {
        await fetch('/api/kesiswaan/mutasi-masuk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mutForm),
        })
      } else if (mode === 'edit' && selectedId) {
        await fetch(`/api/kesiswaan/mutasi-masuk/${selectedId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mutForm),
        })
      }
      setMode('list')
      setSelectedId(null)
      fetchMutMasuk()
    } finally { setMutating(false) }
  }

  const handleDeleteMutMasuk = async (id: string) => {
    if (!confirm('Hapus data mutasi masuk ini?')) return
    await fetch(`/api/kesiswaan/mutasi-masuk/${id}`, { method: 'DELETE' })
    fetchMutMasuk()
  }

  const handleEditMutMasuk = (m: Mutation) => {
    setMutForm({
      tanggal: m.tanggal, nama: m.nama, nisn: m.nisn || '', nik: m.nik || '',
      jenis_kelamin: m.jenis_kelamin || 'laki-laki',
      kelas_kelompok: m.kelas_kelompok,
      sekolah_asal: m.sekolah_asal || '', sekolah_tujuan: m.sekolah_tujuan || '',
      alasan: m.alasan || '',
      dokumen_url: m.dokumen_url || '', keterangan: m.keterangan || '',
    })
    setSelectedId(m.id)
    setMode('edit')
  }

  // CRUD Mutasi Keluar
  const handleSaveMutKeluar = async () => {
    setMutating(true)
    try {
      if (mode === 'add') {
        await fetch('/api/kesiswaan/mutasi-keluar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mutForm),
        })
      } else if (mode === 'edit' && selectedId) {
        await fetch(`/api/kesiswaan/mutasi-keluar/${selectedId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mutForm),
        })
      }
      setMode('list')
      setSelectedId(null)
      fetchMutKeluar()
    } finally { setMutating(false) }
  }

  const handleDeleteMutKeluar = async (id: string) => {
    if (!confirm('Hapus data mutasi keluar ini?')) return
    await fetch(`/api/kesiswaan/mutasi-keluar/${id}`, { method: 'DELETE' })
    fetchMutKeluar()
  }

  const handleEditMutKeluar = (m: Mutation) => {
    setMutForm({
      tanggal: m.tanggal, nama: m.nama, nisn: m.nisn || '', nik: m.nik || '',
      jenis_kelamin: m.jenis_kelamin || 'laki-laki',
      kelas_kelompok: m.kelas_kelompok,
      sekolah_asal: m.sekolah_asal || '', sekolah_tujuan: m.sekolah_tujuan || '',
      alasan: m.alasan || '',
      dokumen_url: m.dokumen_url || '', keterangan: m.keterangan || '',
    })
    setSelectedId(m.id)
    setMode('edit')
  }

  const openAdd = (sub: Submenu) => {
    if (sub === 'peserta-didik') {
      setForm(emptyForm())
      setNikLookupMsg('')
    } else {
      setMutForm(emptyMutasiForm(sub === 'mutasi-masuk' ? 'masuk' : 'keluar'))
    }
    setSelectedId(null)
    setMode('add')
  }

  if (status === 'loading') return <div className="p-8 text-center text-zinc-500">Memuat...</div>

  if (!session) { router.push('/login'); return null }

  const selectedStudent = selectedId ? students.find(s => s.id === selectedId) : null
  const selectedMut = selectedId
    ? (submenu === 'mutasi-masuk' ? mutMasuk : mutKeluar).find(m => m.id === selectedId)
    : null

  return (
    <AppShellTopbar>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Title */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">Kesiswaan</h1>
        </div>

        {/* Jenjang Tabs */}
        {jenjangList.length > 1 && (
          <div className="flex gap-1 bg-zinc-100 p-1 rounded-lg w-fit">
            {jenjangList.map(j => (
              <button key={j} onClick={() => { setJenjang(j); setMode('list') }}
                className={`px-4 py-2 rounded-md text-sm font-medium uppercase ${jenjang === j ? 'bg-white text-blue-700 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}>
                {j}
              </button>
            ))}
          </div>
        )}

        {/* Submenu Tabs */}
        <div className="flex gap-1 border-b border-zinc-200">
          {([
            { key: 'peserta-didik', label: 'Data Peserta Didik' },
            { key: 'mutasi-masuk', label: 'Mutasi Masuk' },
            { key: 'mutasi-keluar', label: 'Mutasi Keluar' },
          ] as { key: Submenu; label: string }[]).map(sm => (
            <button key={sm.key} onClick={() => { setSubmenu(sm.key); setMode('list') }}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${submenu === sm.key ? 'border-blue-600 text-blue-700' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}>
              {sm.label}
            </button>
          ))}
        </div>

        {/* ========== DATA PESERTA DIDIK ========== */}
        {submenu === 'peserta-didik' && mode === 'list' && (
          <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Peserta Didik', value: studentsTotal, color: 'bg-blue-50 text-blue-700' },
                { label: 'Laki-laki', value: totalL, color: 'bg-indigo-50 text-indigo-700' },
                { label: 'Perempuan', value: totalP, color: 'bg-pink-50 text-pink-700' },
                { label: 'Peserta Aktif', value: totalAktif, color: 'bg-green-50 text-green-700' },
              ].map((c, i) => (
                <div key={i} className={`rounded-xl p-4 ${c.color}`}>
                  <div className="text-2xl font-bold">{c.value}</div>
                  <div className="text-sm mt-1 opacity-80">{c.label}</div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <input type="text" placeholder={jenjang === 'sd' ? "Cari nama/NISN/NIK..." : "Cari nama/NIK..."} value={searchQ} onChange={e => { setSearchQ(e.target.value); setStudentsPage(1) }}
                className="px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white w-64" />
              <select value={filterKelas} onChange={e => { setFilterKelas(e.target.value); setStudentsPage(1) }}
                className="px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
                <option value="">{KELAS_LABEL[jenjang]}</option>
                {kelasOptions.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
              <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setStudentsPage(1) }}
                className="px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
                <option value="">Semua Status</option>
                <option value="aktif">Aktif</option>
                <option value="pindah">Pindah</option>
                <option value="keluar">Keluar</option>
              </select>
              <button onClick={() => openAdd('peserta-didik')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Tambah Data
              </button>
            </div>

            {/* Table */}
            {loading ? <LoadingSkeleton /> : students.length === 0 ? <EmptyState text="Tidak ada data peserta didik" /> : (
              <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-200">
                        <th className="text-left px-3 py-3 font-semibold text-zinc-700 w-10">No</th>
                        <th className="text-left px-3 py-3 font-semibold text-zinc-700">{jenjang === 'sd' ? 'NIS' : 'NIK'}</th>
                        {jenjang === 'sd' && <th className="text-left px-3 py-3 font-semibold text-zinc-700">NISN</th>}
                        <th className="text-left px-3 py-3 font-semibold text-zinc-700">Nama</th>
                        <th className="text-left px-3 py-3 font-semibold text-zinc-700">JK</th>
                        <th className="text-left px-3 py-3 font-semibold text-zinc-700">TTL</th>
                        <th className="text-left px-3 py-3 font-semibold text-zinc-700">{KELAS_LABEL[jenjang]}</th>
                        <th className="text-left px-3 py-3 font-semibold text-zinc-700">Status</th>
                        <th className="text-left px-3 py-3 font-semibold text-zinc-700">Ortu</th>
                        <th className="text-left px-3 py-3 font-semibold text-zinc-700">No HP</th>
                        <th className="text-left px-3 py-3 font-semibold text-zinc-700 w-24">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s, i) => (
                        <tr key={s.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                          <td className="px-3 py-2.5 text-zinc-400">{(studentsPage - 1) * 20 + i + 1}</td>
                          <td className="px-3 py-2.5">{s.nik || '-'}</td>
                          {jenjang === 'sd' && <td className="px-3 py-2.5">{s.nisn || '-'}</td>}
                          <td className="px-3 py-2.5 font-medium text-zinc-900">{s.nama}</td>
                          <td className="px-3 py-2.5">{s.jenis_kelamin === 'laki-laki' ? 'L' : 'P'}</td>
                          <td className="px-3 py-2.5 text-xs">{s.tempat_lahir ? `${s.tempat_lahir}, ${s.tanggal_lahir || ''}` : '-'}</td>
                          <td className="px-3 py-2.5">{s.kelas_kelompok}</td>
                          <td className="px-3 py-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.status_siswa === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-600'}`}>
                              {s.status_siswa}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-xs">{s.nama_orang_tua || '-'}</td>
                          <td className="px-3 py-2.5 text-xs">{s.no_hp || '-'}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex gap-1">
                              <button onClick={() => handleDetailStudent(s.id)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600" title="Detail"><Eye className="w-4 h-4" /></button>
                              <button onClick={() => handleEditStudent(s.id)} className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-600" title="Edit"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => handleDeleteStudent(s.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-600" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination page={studentsPage} totalPages={studentsPages} onChange={setStudentsPage} />
              </div>
            )}
          </div>
        )}

        {/* ========== MUTASI MASUK ========== */}
        {submenu === 'mutasi-masuk' && mode === 'list' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <input type="text" placeholder={jenjang === 'sd' ? "Cari nama/NISN..." : "Cari nama/NIK..."} value={searchQ} onChange={e => { setSearchQ(e.target.value); setMutMasukPage(1) }}
                className="px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white w-64" />
              <button onClick={() => openAdd('mutasi-masuk')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Tambah Mutasi Masuk
              </button>
            </div>

            {mutMasuk.length === 0 ? <EmptyState text="Tidak ada data mutasi masuk" /> : (
              <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-200">
                        <th className="text-left px-3 py-3 font-semibold text-zinc-700 w-10">No</th>
                        <th className="text-left px-3 py-3 font-semibold text-zinc-700">Tanggal</th>
                        <th className="text-left px-3 py-3 font-semibold text-zinc-700">Nama</th>
                        <th className="text-left px-3 py-3 font-semibold text-zinc-700">{jenjang === 'sd' ? 'NISN' : 'NIK'}</th>
                        <th className="text-left px-3 py-3 font-semibold text-zinc-700">Asal Sekolah</th>
                        <th className="text-left px-3 py-3 font-semibold text-zinc-700">{KELAS_LABEL[jenjang]} Tujuan</th>
                        <th className="text-left px-3 py-3 font-semibold text-zinc-700">Alasan</th>
                        <th className="text-left px-3 py-3 font-semibold text-zinc-700">Dokumen</th>
                        <th className="text-left px-3 py-3 font-semibold text-zinc-700 w-24">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mutMasuk.map((m, i) => (
                        <tr key={m.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                          <td className="px-3 py-2.5 text-zinc-400">{(mutMasukPage - 1) * 20 + i + 1}</td>
                          <td className="px-3 py-2.5">{m.tanggal}</td>
                          <td className="px-3 py-2.5 font-medium text-zinc-900">{m.nama}</td>
                          <td className="px-3 py-2.5">{jenjang === 'sd' ? (m.nisn || '-') : (m.nik || '-')}</td>
                          <td className="px-3 py-2.5">{m.sekolah_asal || '-'}</td>
                          <td className="px-3 py-2.5">{m.kelas_kelompok}</td>
                          <td className="px-3 py-2.5 text-xs">{m.alasan || '-'}</td>
                          <td className="px-3 py-2.5">
                            {m.dokumen_url ? <a href={m.dokumen_url} target="_blank" className="text-blue-600 underline text-xs">Lihat</a> : '-'}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex gap-1">
                              <button onClick={() => handleDetailStudent(m.id)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600" title="Detail"><Eye className="w-4 h-4" /></button>
                              <button onClick={() => handleEditMutMasuk(m)} className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-600" title="Edit"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => handleDeleteMutMasuk(m.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-600" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination page={mutMasukPage} totalPages={mutMasukPages} onChange={setMutMasukPage} />
              </div>
            )}
          </div>
        )}

        {/* ========== MUTASI KELUAR ========== */}
        {submenu === 'mutasi-keluar' && mode === 'list' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <input type="text" placeholder={jenjang === 'sd' ? "Cari nama/NISN..." : "Cari nama/NIK..."} value={searchQ} onChange={e => { setSearchQ(e.target.value); setMutKeluarPage(1) }}
                className="px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white w-64" />
              <button onClick={() => openAdd('mutasi-keluar')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Tambah Mutasi Keluar
              </button>
            </div>

            {mutKeluar.length === 0 ? <EmptyState text="Tidak ada data mutasi keluar" /> : (
              <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-200">
                        <th className="text-left px-3 py-3 font-semibold text-zinc-700 w-10">No</th>
                        <th className="text-left px-3 py-3 font-semibold text-zinc-700">Tanggal</th>
                        <th className="text-left px-3 py-3 font-semibold text-zinc-700">Nama</th>
                        <th className="text-left px-3 py-3 font-semibold text-zinc-700">{jenjang === 'sd' ? 'NISN' : 'NIK'}</th>
                        <th className="text-left px-3 py-3 font-semibold text-zinc-700">{KELAS_LABEL[jenjang]}</th>
                        <th className="text-left px-3 py-3 font-semibold text-zinc-700">Sekolah Tujuan</th>
                        <th className="text-left px-3 py-3 font-semibold text-zinc-700">Alasan</th>
                        <th className="text-left px-3 py-3 font-semibold text-zinc-700">Dokumen</th>
                        <th className="text-left px-3 py-3 font-semibold text-zinc-700 w-24">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mutKeluar.map((m, i) => (
                        <tr key={m.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                          <td className="px-3 py-2.5 text-zinc-400">{(mutKeluarPage - 1) * 20 + i + 1}</td>
                          <td className="px-3 py-2.5">{m.tanggal}</td>
                          <td className="px-3 py-2.5 font-medium text-zinc-900">{m.nama}</td>
                          <td className="px-3 py-2.5">{jenjang === 'sd' ? (m.nisn || '-') : (m.nik || '-')}</td>
                          <td className="px-3 py-2.5">{m.kelas_kelompok}</td>
                          <td className="px-3 py-2.5">{m.sekolah_tujuan || '-'}</td>
                          <td className="px-3 py-2.5 text-xs">{m.alasan || '-'}</td>
                          <td className="px-3 py-2.5">
                            {m.dokumen_url ? <a href={m.dokumen_url} target="_blank" className="text-blue-600 underline text-xs">Lihat</a> : '-'}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex gap-1">
                              <button onClick={() => handleDetailStudent(m.id)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600" title="Detail"><Eye className="w-4 h-4" /></button>
                              <button onClick={() => handleEditMutKeluar(m)} className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-600" title="Edit"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => handleDeleteMutKeluar(m.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-600" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination page={mutKeluarPage} totalPages={mutKeluarPages} onChange={setMutKeluarPage} />
              </div>
            )}
          </div>
        )}

        {/* ========== MODAL: ADD/EDIT STUDENT ========== */}
        <Modal open={submenu === 'peserta-didik' && (mode === 'add' || mode === 'edit')}
          onClose={() => setMode('list')}
          title={mode === 'add' ? 'Tambah Peserta Didik' : 'Edit Peserta Didik'}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 mb-1">Nama Lengkap *</label>
              <input value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                {jenjang === 'sd' ? 'NIS / NIK' : 'NIK'} <span className="text-xs text-blue-500 font-normal"> (isi NIK untuk autofill)</span>
              </label>
              <div className="relative">
                <input value={form.nik} onChange={e => setForm(f => ({ ...f, nik: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm pr-8" />
                {nikLookupLoading && <Loader2 className="w-4 h-4 absolute right-2.5 top-3 animate-spin text-zinc-400" />}
              </div>
              {nikLookupMsg && (
                <p className={`text-xs mt-1 ${nikLookupMsg.includes('✓') ? 'text-green-600' : 'text-amber-600'}`}>
                  {nikLookupMsg}
                </p>
              )}
            </div>
            {jenjang === 'sd' && <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">NISN</label>
              <input value={form.nisn} onChange={e => setForm(f => ({ ...f, nisn: e.target.value }))} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm" />
            </div>}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Jenis Kelamin *</label>
              <select value={form.jenis_kelamin} onChange={e => setForm(f => ({ ...f, jenis_kelamin: e.target.value }))} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
                <option value="laki-laki">Laki-laki</option>
                <option value="perempuan">Perempuan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">{KELAS_LABEL[jenjang]} *</label>
              <select value={form.kelas_kelompok} onChange={e => setForm(f => ({ ...f, kelas_kelompok: e.target.value }))} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
                <option value="">Pilih</option>
                {kelasOptions.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Tempat Lahir</label>
              <input value={form.tempat_lahir} onChange={e => setForm(f => ({ ...f, tempat_lahir: e.target.value }))} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Tanggal Lahir</label>
              <input type="date" value={form.tanggal_lahir} onChange={e => setForm(f => ({ ...f, tanggal_lahir: e.target.value }))} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 mb-1">Alamat</label>
              <textarea value={form.alamat} onChange={e => setForm(f => ({ ...f, alamat: e.target.value }))} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm" rows={2} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Nama Orang Tua</label>
              <input value={form.nama_orang_tua} onChange={e => setForm(f => ({ ...f, nama_orang_tua: e.target.value }))} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">No HP</label>
              <input value={form.no_hp} onChange={e => setForm(f => ({ ...f, no_hp: e.target.value }))} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Status</label>
              <select value={form.status_siswa} onChange={e => setForm(f => ({ ...f, status_siswa: e.target.value }))} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
                <option value="aktif">Aktif</option>
                <option value="pindah">Pindah</option>
                <option value="keluar">Keluar</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setMode('list')} className="px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 rounded-lg">Batal</button>
            <button onClick={handleSaveStudent} disabled={mutating || !form.nama || !form.kelas_kelompok} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5">
              {mutating && <Loader2 className="w-4 h-4 animate-spin" />} Simpan
            </button>
          </div>
        </Modal>

        {/* ========== MODAL: DETAIL STUDENT ========== */}
        <Modal open={mode === 'detail' && submenu === 'peserta-didik' && !!selectedStudent}
          onClose={() => setMode('list')} title="Detail Peserta Didik">
          {selectedStudent && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ['Nama', selectedStudent.nama],
                [selectedStudent.jenjang === 'sd' ? 'NIS' : 'NIK', selectedStudent.nik || '-'],
                ...(selectedStudent.jenjang === 'sd' ? [['NISN', selectedStudent.nisn || '-']] as const : []),
                ['Jenis Kelamin', selectedStudent.jenis_kelamin || '-'],
                ['Tempat Lahir', selectedStudent.tempat_lahir || '-'],
                ['Tanggal Lahir', selectedStudent.tanggal_lahir || '-'],
                ['Alamat', selectedStudent.alamat || '-'],
                [KELAS_LABEL[jenjang], selectedStudent.kelas_kelompok],
                ['Status', selectedStudent.status_siswa],
                ['Nama Orang Tua', selectedStudent.nama_orang_tua || '-'],
                ['No HP', selectedStudent.no_hp || '-'],
                ['Tahun Pelajaran', selectedStudent.tahun_pelajaran],
              ].map(([l, v]) => (
                <div key={l} className={l === 'Alamat' ? 'md:col-span-2' : ''}>
                  <div className="text-zinc-500 mb-0.5">{l}</div>
                  <div className="font-medium">{v}</div>
                </div>
              ))}
            </div>
          )}
        </Modal>

        {/* ========== MODAL: ADD/EDIT MUTASI MASUK ========== */}
        <Modal open={submenu === 'mutasi-masuk' && (mode === 'add' || mode === 'edit')}
          onClose={() => setMode('list')}
          title={mode === 'add' ? 'Tambah Mutasi Masuk' : 'Edit Mutasi Masuk'}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Tanggal Masuk *</label>
              <input type="date" value={mutForm.tanggal} onChange={e => setMutForm(f => ({ ...f, tanggal: e.target.value }))} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">{KELAS_LABEL[jenjang]} Tujuan *</label>
              <select value={mutForm.kelas_kelompok} onChange={e => setMutForm(f => ({ ...f, kelas_kelompok: e.target.value }))} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
                <option value="">Pilih</option>
                {kelasOptions.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 mb-1">Nama Lengkap *</label>
              <input value={mutForm.nama} onChange={e => setMutForm(f => ({ ...f, nama: e.target.value }))} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm" />
            </div>
            {jenjang === 'sd' && <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">NISN</label>
              <input value={mutForm.nisn} onChange={e => setMutForm(f => ({ ...f, nisn: e.target.value }))} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm" />
            </div>}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">NIK</label>
              <input value={mutForm.nik} onChange={e => setMutForm(f => ({ ...f, nik: e.target.value }))} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Jenis Kelamin</label>
              <select value={mutForm.jenis_kelamin} onChange={e => setMutForm(f => ({ ...f, jenis_kelamin: e.target.value }))} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
                <option value="laki-laki">Laki-laki</option>
                <option value="perempuan">Perempuan</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 mb-1">Asal Sekolah</label>
              <input value={mutForm.sekolah_asal} onChange={e => setMutForm(f => ({ ...f, sekolah_asal: e.target.value }))} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 mb-1">Alasan Mutasi</label>
              <textarea value={mutForm.alasan} onChange={e => setMutForm(f => ({ ...f, alasan: e.target.value }))} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm" rows={2} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 mb-1">URL Dokumen</label>
              <input value={mutForm.dokumen_url} onChange={e => setMutForm(f => ({ ...f, dokumen_url: e.target.value }))} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm" placeholder="https://..." />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 mb-1">Keterangan</label>
              <textarea value={mutForm.keterangan} onChange={e => setMutForm(f => ({ ...f, keterangan: e.target.value }))} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm" rows={2} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setMode('list')} className="px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 rounded-lg">Batal</button>
            <button onClick={handleSaveMutMasuk} disabled={mutating || !mutForm.tanggal || !mutForm.nama || !mutForm.kelas_kelompok}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5">
              {mutating && <Loader2 className="w-4 h-4 animate-spin" />} Simpan
            </button>
          </div>
        </Modal>

        {/* ========== MODAL: ADD/EDIT MUTASI KELUAR ========== */}
        <Modal open={submenu === 'mutasi-keluar' && (mode === 'add' || mode === 'edit')}
          onClose={() => setMode('list')}
          title={mode === 'add' ? 'Tambah Mutasi Keluar' : 'Edit Mutasi Keluar'}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Tanggal Keluar *</label>
              <input type="date" value={mutForm.tanggal} onChange={e => setMutForm(f => ({ ...f, tanggal: e.target.value }))} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">{KELAS_LABEL[jenjang]} *</label>
              <select value={mutForm.kelas_kelompok} onChange={e => setMutForm(f => ({ ...f, kelas_kelompok: e.target.value }))} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
                <option value="">Pilih</option>
                {kelasOptions.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 mb-1">Nama Lengkap *</label>
              <input value={mutForm.nama} onChange={e => setMutForm(f => ({ ...f, nama: e.target.value }))} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm" />
            </div>
            {jenjang === 'sd' && <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">NISN</label>
              <input value={mutForm.nisn} onChange={e => setMutForm(f => ({ ...f, nisn: e.target.value }))} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm" />
            </div>}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">NIK</label>
              <input value={mutForm.nik} onChange={e => setMutForm(f => ({ ...f, nik: e.target.value }))} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Jenis Kelamin</label>
              <select value={mutForm.jenis_kelamin} onChange={e => setMutForm(f => ({ ...f, jenis_kelamin: e.target.value }))} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
                <option value="laki-laki">Laki-laki</option>
                <option value="perempuan">Perempuan</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 mb-1">Sekolah Tujuan</label>
              <input value={mutForm.sekolah_tujuan} onChange={e => setMutForm(f => ({ ...f, sekolah_tujuan: e.target.value }))} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 mb-1">Alasan Keluar</label>
              <textarea value={mutForm.alasan} onChange={e => setMutForm(f => ({ ...f, alasan: e.target.value }))} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm" rows={2} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 mb-1">URL Dokumen</label>
              <input value={mutForm.dokumen_url} onChange={e => setMutForm(f => ({ ...f, dokumen_url: e.target.value }))} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm" placeholder="https://..." />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 mb-1">Keterangan</label>
              <textarea value={mutForm.keterangan} onChange={e => setMutForm(f => ({ ...f, keterangan: e.target.value }))} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm" rows={2} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setMode('list')} className="px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 rounded-lg">Batal</button>
            <button onClick={handleSaveMutKeluar} disabled={mutating || !mutForm.tanggal || !mutForm.nama || !mutForm.kelas_kelompok}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5">
              {mutating && <Loader2 className="w-4 h-4 animate-spin" />} Simpan
            </button>
          </div>
        </Modal>

        {/* ========== MODAL: DETAIL MUTASI ========== */}
        <Modal open={mode === 'detail' && submenu !== 'peserta-didik' && !!selectedMut}
          onClose={() => setMode('list')} title={submenu === 'mutasi-masuk' ? 'Detail Mutasi Masuk' : 'Detail Mutasi Keluar'}>
          {selectedMut && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ['Tanggal', selectedMut.tanggal],
                ['Nama', selectedMut.nama],
                ...(jenjang === 'sd' ? [['NISN', selectedMut.nisn || '-'], ['NIK', selectedMut.nik || '-']] as const : [['NIK', selectedMut.nik || '-']] as const),
                ['Jenis Kelamin', selectedMut.jenis_kelamin || '-'],
                [KELAS_LABEL[jenjang], selectedMut.kelas_kelompok],
                ...(submenu === 'mutasi-masuk'
                  ? [['Asal Sekolah', selectedMut.sekolah_asal || '-']]
                  : [['Sekolah Tujuan', selectedMut.sekolah_tujuan || '-']]),
                ['Alasan', selectedMut.alasan || '-'],
                ['Dokumen', selectedMut.dokumen_url ? <a href={selectedMut.dokumen_url} target="_blank" className="text-blue-600 underline">Lihat Dokumen</a> : '-'],
                ['Keterangan', selectedMut.keterangan || '-'],
              ].map(([l, v]) => (
                <div key={l as string} className={l === 'Alasan' || l === 'Keterangan' ? 'md:col-span-2' : ''}>
                  <div className="text-zinc-500 mb-0.5">{l}</div>
                  <div className="font-medium">{v}</div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      </div>
    </AppShellTopbar>
  )
}
