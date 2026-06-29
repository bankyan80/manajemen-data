'use client'

import { useState, useCallback, useEffect } from 'react'
import AppShellTopbar from '@/components/layout/AppShellTopbar'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useData, fetchJson } from '@/lib/useData'
import { Search, Plus, Loader2, CheckCircle } from 'lucide-react'


const TABS = ['Calon Masuk SMP', 'Anak Lanjut SMP', 'SMP Tujuan', 'Anak Tidak Melanjutkan', 'Anak Lanjut Non Formal', 'Rekap Transisi Kecamatan']

const STATUS_LABELS: Record<string, string> = {
  calon_masuk: 'Calon Masuk',
  lanjut: 'Lanjut',
  sudah_mendaftar: 'Sudah Mendaftar',
  diterima: 'Diterima',
  belum_mendaftar: 'Belum Mendaftar',
  tidak_melanjutkan: 'Tidak Melanjutkan',
  non_formal: 'Non Formal',
}

const STATUS_COLORS: Record<string, string> = {
  calon_masuk: 'bg-blue-100 text-blue-700',
  lanjut: 'bg-green-100 text-green-700',
  sudah_mendaftar: 'bg-purple-100 text-purple-700',
  diterima: 'bg-teal-100 text-teal-700',
  belum_mendaftar: 'bg-amber-100 text-amber-700',
  tidak_melanjutkan: 'bg-red-100 text-red-700',
  non_formal: 'bg-orange-100 text-orange-700',
}

export default function TransisiSdSmpPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(0)
  const [search, setSearch] = useState('')
  const [prosesModal, setProsesModal] = useState<any>(null)
  const [prosesForm, setProsesForm] = useState({ status_transisi: 'lanjut', smp_tujuan: '', kegiatan_transisi: '', keterangan: '' })
  const [prosesLoading, setProsesLoading] = useState(false)
  const { data: transData, loading, mutate } = useData<any>('transitions', () => fetchJson('/api/transitions'))

  const role = (session?.user as any)?.role
  const isAdmin = role === 'admin_kecamatan'

  const handleProses = async () => {
    if (!prosesModal) return
    setProsesLoading(true)
    try {
      const body = {
        school_id: prosesModal.school_id,
        student_id: prosesModal.student_id,
        tahun_pelajaran: prosesModal.tahun_pelajaran || '2026/2027',
        nama: prosesModal.nama,
        nisn: prosesModal.nisn,
        jenis_kelamin: prosesModal.jenis_kelamin,
        kelas: prosesModal.kelas,
        status_transisi: prosesForm.status_transisi,
        smp_tujuan: prosesForm.smp_tujuan || null,
        kegiatan_transisi: prosesForm.kegiatan_transisi || null,
        keterangan: prosesForm.keterangan || null,
      }
      const res = await fetch('/api/transitions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Gagal') }
      setProsesModal(null)
      setProsesForm({ status_transisi: 'lanjut', smp_tujuan: '', kegiatan_transisi: '', keterangan: '' })
      mutate()
    } catch (err: any) {
      alert('Gagal: ' + err.message)
    } finally {
      setProsesLoading(false)
    }
  }

  const isVirtual = (d: any) => typeof d.id === 'string' && d.id.endsWith('-auto')

  if (status === 'loading') return <div className="p-8 text-center text-zinc-500">Memuat...</div>

  if (!session) { router.push('/login'); return null }

  const items = transData?.data || []
  const recap = transData?.recap || []

  const filtered = items.filter((d: any) =>
    !search || d.nama.toLowerCase().includes(search.toLowerCase()) || (d.nisn || '').includes(search)
  )

  function normalizeGender(jk: string) {
    if (!jk) return ''
    const g = jk.toLowerCase()
    if (g === 'l' || g === 'laki-laki') return 'laki-laki'
    if (g === 'p' || g === 'perempuan') return 'perempuan'
    return jk
  }

  function groupBySchool(data: any[]) {
    const map = new Map<string, { school_nama: string; laki: number; perempuan: number; total: number }>()
    for (const d of data) {
      const key = d.school_id
      if (!map.has(key)) map.set(key, { school_nama: d.school_nama || 'Unknown', laki: 0, perempuan: 0, total: 0 })
      const entry = map.get(key)!
      const gender = normalizeGender(d.jenis_kelamin)
      if (gender === 'laki-laki') entry.laki++
      else if (gender === 'perempuan') entry.perempuan++
      entry.total++
    }
    return Array.from(map.values()).sort((a, b) => a.school_nama.localeCompare(b.school_nama))
  }

  const calonMasuk = filtered.filter((d: any) => d.status_transisi === 'calon_masuk' || d.status_transisi === 'belum_mendaftar')
  const anakLanjut = filtered.filter((d: any) => d.status_transisi === 'lanjut' || d.status_transisi === 'sudah_mendaftar' || d.status_transisi === 'diterima')
  const smpTujuan = Array.from(new Set(anakLanjut.map((d: any) => d.smp_tujuan).filter(Boolean))) as string[]
  const tidakMelanjutkan = filtered.filter((d: any) => d.status_transisi === 'tidak_melanjutkan')
  const lanjutNonFormal = filtered.filter((d: any) => d.status_transisi === 'non_formal')

  const calonMasukSekolah = groupBySchool(calonMasuk)
  const anakLanjutSekolah = groupBySchool(anakLanjut)
  const tidakMelanjutkanSekolah = groupBySchool(tidakMelanjutkan)
  const lanjutNonFormalSekolah = groupBySchool(lanjutNonFormal)

  const summaryRecap = TABS.map((tab, i) => {
    if (i === 0) return { tab, sd: isAdmin ? calonMasukSekolah.length : calonMasuk.length, kb: 0 }
    if (i === 1) return { tab, sd: isAdmin ? anakLanjutSekolah.length : anakLanjut.length, kb: 0 }
    if (i === 2) return { tab, sd: smpTujuan.length, kb: 0 }
    if (i === 3) return { tab, sd: isAdmin ? tidakMelanjutkanSekolah.length : tidakMelanjutkan.length, kb: 0 }
    if (i === 4) return { tab, sd: isAdmin ? lanjutNonFormalSekolah.length : lanjutNonFormal.length, kb: 0 }
    if (i === 5) return { tab, sd: recap.reduce((s: number, r: any) => s + r.total, 0), kb: 0 }
    return { tab, sd: 0, kb: 0 }
  })

  return (
    <AppShellTopbar>
      <div className="container-page space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-text-main">Transisi SD-SMP</h1>
          <button onClick={() => alert('Fitur tambah data transisi akan tersedia dalam versi mendatang')} className="btn-primary px-4 py-2">
            <Plus className="w-4 h-4" /> Tambah Data
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {summaryRecap.map((s) => (
            <div key={s.tab} className="card p-4 text-center">
              <p className="text-2xl font-bold text-primary">{s.sd}</p>
              <p className="text-xs text-text-muted truncate">{s.tab}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-1 bg-zinc-100 p-1 rounded-[14px]">
          {TABS.map((tab, i) => (
            <button key={i} onClick={() => setActiveTab(i)} className={`px-3 py-1.5 rounded-[10px] text-xs font-medium whitespace-nowrap transition-all ${activeTab === i ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text-main'}`}>{tab}</button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama atau NISN..." className="w-full pl-9 pr-3 py-2" />
          </div>
        </div>

        {activeTab === 0 && (
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-border font-semibold text-text-main">Calon Masuk SMP</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-border">
                    {isAdmin ? (
                      <><th className="text-left px-4 py-3 font-semibold text-text-muted">Sekolah</th><th className="text-center px-4 py-3 font-semibold text-text-muted">L</th><th className="text-center px-4 py-3 font-semibold text-text-muted">P</th><th className="text-center px-4 py-3 font-semibold text-text-muted">Jumlah</th></>
                    ) : (
                      <><th className="text-left px-4 py-3 font-semibold text-text-muted">Nama</th><th className="text-left px-4 py-3 font-semibold text-text-muted">NISN</th><th className="text-left px-4 py-3 font-semibold text-text-muted">Jenis Kelamin</th><th className="text-left px-4 py-3 font-semibold text-text-muted">Kelas</th><th className="text-left px-4 py-3 font-semibold text-text-muted">Sekolah</th><th className="text-left px-4 py-3 font-semibold text-text-muted">Status</th><th className="text-center px-4 py-3 font-semibold text-text-muted">Aksi</th></>
                    )}
                  </tr>
                </thead>
                <tbody>
                    {loading ? (
                      <tr><td colSpan={isAdmin ? 4 : 7} className="px-4 py-8 text-center text-sm text-text-muted">Memuat...</td></tr>
                    ) : isAdmin ? (
                    calonMasukSekolah.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-text-muted">Belum ada data calon masuk SMP</td></tr>
                    ) : calonMasukSekolah.map((s, i) => (
                      <tr key={i} className="border-b border-zinc-100 hover:bg-zinc-50">
                        <td className="px-4 py-3 font-medium text-text-main">{s.school_nama}</td>
                        <td className="px-4 py-3 text-center text-text-muted">{s.laki}</td>
                        <td className="px-4 py-3 text-center text-text-muted">{s.perempuan}</td>
                        <td className="px-4 py-3 text-center font-bold text-primary">{s.total}</td>
                      </tr>
                    ))
                  ) : (
                    calonMasuk.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-text-muted">Belum ada data calon masuk SMP</td></tr>
                    ) : calonMasuk.map((d: any, i: number) => (
                      <tr key={d.id || i} className="border-b border-zinc-100 hover:bg-zinc-50">
                        <td className="px-4 py-3 font-medium text-text-main">{d.nama}</td>
                        <td className="px-4 py-3">{d.nisn || '-'}</td>
                        <td className="px-4 py-3">{(() => { const g = normalizeGender(d.jenis_kelamin); return g === 'laki-laki' ? 'Laki-laki' : g === 'perempuan' ? 'Perempuan' : d.jenis_kelamin || '-' })()}</td>
                        <td className="px-4 py-3">{d.kelas}</td>
                        <td className="px-4 py-3">{d.school_nama || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[d.status_transisi] || 'bg-zinc-100 text-zinc-700'}`}>{STATUS_LABELS[d.status_transisi] || d.status_transisi}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isVirtual(d) && (
                            <button onClick={() => { setProsesModal(d); setProsesForm(p => ({ ...p, status_transisi: 'lanjut' })) }} className="text-primary-light hover:text-primary text-xs font-medium">Lanjutkan Proses</button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-border font-semibold text-text-main">Anak Lanjut SMP</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-border">
                    {isAdmin ? (
                      <><th className="text-left px-4 py-3 font-semibold text-text-muted">Sekolah</th><th className="text-center px-4 py-3 font-semibold text-text-muted">L</th><th className="text-center px-4 py-3 font-semibold text-text-muted">P</th><th className="text-center px-4 py-3 font-semibold text-text-muted">Jumlah</th></>
                    ) : (
                      <><th className="text-left px-4 py-3 font-semibold text-text-muted">Nama</th><th className="text-left px-4 py-3 font-semibold text-text-muted">NISN</th><th className="text-left px-4 py-3 font-semibold text-text-muted">Sekolah Asal</th><th className="text-left px-4 py-3 font-semibold text-text-muted">SMP Tujuan</th><th className="text-left px-4 py-3 font-semibold text-text-muted">Status</th></>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={isAdmin ? 4 : 5} className="px-4 py-8 text-center text-sm text-text-muted">Memuat...</td></tr>
                  ) : isAdmin ? (
                    anakLanjutSekolah.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-text-muted">Belum ada data anak lanjut SMP</td></tr>
                    ) : anakLanjutSekolah.map((s, i) => (
                      <tr key={i} className="border-b border-zinc-100 hover:bg-zinc-50">
                        <td className="px-4 py-3 font-medium text-text-main">{s.school_nama}</td>
                        <td className="px-4 py-3 text-center text-text-muted">{s.laki}</td>
                        <td className="px-4 py-3 text-center text-text-muted">{s.perempuan}</td>
                        <td className="px-4 py-3 text-center font-bold text-primary">{s.total}</td>
                      </tr>
                    ))
                  ) : (
                    anakLanjut.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-text-muted">Belum ada data anak lanjut SMP</td></tr>
                    ) : anakLanjut.map((d: any, i: number) => (
                      <tr key={d.id || i} className="border-b border-zinc-100 hover:bg-zinc-50">
                        <td className="px-4 py-3 font-medium text-text-main">{d.nama}</td>
                        <td className="px-4 py-3">{d.nisn || '-'}</td>
                        <td className="px-4 py-3">{d.school_nama || '-'}</td>
                        <td className="px-4 py-3">{d.smp_tujuan || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[d.status_transisi] || 'bg-zinc-100 text-zinc-700'}`}>{STATUS_LABELS[d.status_transisi] || d.status_transisi}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 2 && (
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-border font-semibold text-text-main">SMP Tujuan</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-border">
                    <th className="text-left px-4 py-3 font-semibold text-text-muted">Nama SMP Tujuan</th>
                    <th className="text-left px-4 py-3 font-semibold text-text-muted">Jumlah Siswa</th>
                  </tr>
                </thead>
                <tbody>
                  {smpTujuan.length === 0 ? (
                    <tr><td colSpan={2} className="px-4 py-8 text-center text-sm text-text-muted">Belum ada data SMP tujuan</td></tr>
                  ) : smpTujuan.map((tujuan: string, i: number) => {
                    const count = filtered.filter((d: any) => d.smp_tujuan === tujuan).length
                    return (
                      <tr key={i} className="border-b border-zinc-100 hover:bg-zinc-50">
                        <td className="px-4 py-3 font-medium text-text-main">{tujuan}</td>
                        <td className="px-4 py-3 font-bold text-primary">{count}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 3 && (
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-border font-semibold text-text-main">Anak Tidak Melanjutkan</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-border">
                    {isAdmin ? (
                      <><th className="text-left px-4 py-3 font-semibold text-text-muted">Sekolah</th><th className="text-center px-4 py-3 font-semibold text-text-muted">L</th><th className="text-center px-4 py-3 font-semibold text-text-muted">P</th><th className="text-center px-4 py-3 font-semibold text-text-muted">Jumlah</th></>
                    ) : (
                      <><th className="text-left px-4 py-3 font-semibold text-text-muted">Nama</th><th className="text-left px-4 py-3 font-semibold text-text-muted">NISN</th><th className="text-left px-4 py-3 font-semibold text-text-muted">Kelas</th><th className="text-left px-4 py-3 font-semibold text-text-muted">Sekolah</th></>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={isAdmin ? 4 : 4} className="px-4 py-8 text-center text-sm text-text-muted">Memuat...</td></tr>
                  ) : isAdmin ? (
                    tidakMelanjutkanSekolah.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-text-muted">Belum ada data anak tidak melanjutkan</td></tr>
                    ) : tidakMelanjutkanSekolah.map((s, i) => (
                      <tr key={i} className="border-b border-zinc-100 hover:bg-zinc-50">
                        <td className="px-4 py-3 font-medium text-text-main">{s.school_nama}</td>
                        <td className="px-4 py-3 text-center text-text-muted">{s.laki}</td>
                        <td className="px-4 py-3 text-center text-text-muted">{s.perempuan}</td>
                        <td className="px-4 py-3 text-center font-bold text-primary">{s.total}</td>
                      </tr>
                    ))
                  ) : (
                    tidakMelanjutkan.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-text-muted">Belum ada data anak tidak melanjutkan</td></tr>
                    ) : tidakMelanjutkan.map((d: any, i: number) => (
                      <tr key={d.id || i} className="border-b border-zinc-100 hover:bg-zinc-50">
                        <td className="px-4 py-3 font-medium text-text-main">{d.nama}</td>
                        <td className="px-4 py-3">{d.nisn || '-'}</td>
                        <td className="px-4 py-3">{d.kelas}</td>
                        <td className="px-4 py-3">{d.school_nama || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 4 && (
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-border font-semibold text-text-main">Anak Lanjut Non Formal</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-border">
                    {isAdmin ? (
                      <><th className="text-left px-4 py-3 font-semibold text-text-muted">Sekolah</th><th className="text-center px-4 py-3 font-semibold text-text-muted">L</th><th className="text-center px-4 py-3 font-semibold text-text-muted">P</th><th className="text-center px-4 py-3 font-semibold text-text-muted">Jumlah</th></>
                    ) : (
                      <><th className="text-left px-4 py-3 font-semibold text-text-muted">Nama</th><th className="text-left px-4 py-3 font-semibold text-text-muted">Kegiatan Transisi</th><th className="text-left px-4 py-3 font-semibold text-text-muted">Keterangan</th></>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={isAdmin ? 4 : 3} className="px-4 py-8 text-center text-sm text-text-muted">Memuat...</td></tr>
                  ) : isAdmin ? (
                    lanjutNonFormalSekolah.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-text-muted">Belum ada data anak lanjut non formal</td></tr>
                    ) : lanjutNonFormalSekolah.map((s, i) => (
                      <tr key={i} className="border-b border-zinc-100 hover:bg-zinc-50">
                        <td className="px-4 py-3 font-medium text-text-main">{s.school_nama}</td>
                        <td className="px-4 py-3 text-center text-text-muted">{s.laki}</td>
                        <td className="px-4 py-3 text-center text-text-muted">{s.perempuan}</td>
                        <td className="px-4 py-3 text-center font-bold text-primary">{s.total}</td>
                      </tr>
                    ))
                  ) : (
                    lanjutNonFormal.length === 0 ? (
                      <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-text-muted">Belum ada data anak lanjut non formal</td></tr>
                    ) : lanjutNonFormal.map((d: any, i: number) => (
                      <tr key={d.id || i} className="border-b border-zinc-100 hover:bg-zinc-50">
                        <td className="px-4 py-3 font-medium text-text-main">{d.nama}</td>
                        <td className="px-4 py-3">{d.kegiatan_transisi}</td>
                        <td className="px-4 py-3">{d.keterangan || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 5 && (
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-border font-semibold text-text-main">Rekap Transisi Kecamatan</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-border">
                    <th className="text-left px-4 py-3 font-semibold text-text-muted">Status Transisi</th>
                    <th className="text-left px-4 py-3 font-semibold text-text-muted">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {recap.length === 0 ? (
                    <tr><td colSpan={2} className="px-4 py-8 text-center text-sm text-text-muted">Belum ada data rekap transisi</td></tr>
                  ) : (
                    recap.map((r: any, i: number) => (
                      <tr key={i} className="border-b border-zinc-100 hover:bg-zinc-50">
                        <td className="px-4 py-3 font-medium text-text-main">{STATUS_LABELS[r.status_transisi] || r.status_transisi}</td>
                        <td className="px-4 py-3 font-bold text-primary">{r.total}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Proses Modal */}
        {prosesModal && (
          <div className="modal-overlay" onClick={() => !prosesLoading && setProsesModal(null)}>
            <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h3 className="font-semibold text-text-main">Proses Transisi — {prosesModal.nama}</h3>
                <button onClick={() => setProsesModal(null)} className="text-text-muted hover:text-text-main text-xl leading-none">&times;</button>
              </div>
              <div className="px-6 py-4 space-y-4 text-sm">
                <div>
                  <label className="block text-text-muted mb-1">Status Transisi</label>
                  <select value={prosesForm.status_transisi} onChange={e => setProsesForm(f => ({ ...f, status_transisi: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg bg-white">
                    <option value="lanjut">Lanjut ke SMP</option>
                    <option value="tidak_melanjutkan">Tidak Melanjutkan</option>
                    <option value="non_formal">Lanjut Non Formal</option>
                  </select>
                </div>
                {prosesForm.status_transisi === 'lanjut' && (
                  <div>
                    <label className="block text-text-muted mb-1">SMP Tujuan</label>
                    <input type="text" value={prosesForm.smp_tujuan} onChange={e => setProsesForm(f => ({ ...f, smp_tujuan: e.target.value }))} placeholder="Nama SMP..." className="w-full px-3 py-2 border border-border rounded-lg" />
                  </div>
                )}
                {prosesForm.status_transisi === 'non_formal' && (
                  <div>
                    <label className="block text-text-muted mb-1">Kegiatan Transisi</label>
                    <input type="text" value={prosesForm.kegiatan_transisi} onChange={e => setProsesForm(f => ({ ...f, kegiatan_transisi: e.target.value }))} placeholder="Contoh: Pondok Pesantren, Kursus, dll" className="w-full px-3 py-2 border border-border rounded-lg" />
                  </div>
                )}
                <div>
                  <label className="block text-text-muted mb-1">Keterangan (opsional)</label>
                  <input type="text" value={prosesForm.keterangan} onChange={e => setProsesForm(f => ({ ...f, keterangan: e.target.value }))} placeholder="Catatan..." className="w-full px-3 py-2 border border-border rounded-lg" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
                <button onClick={() => setProsesModal(null)} disabled={prosesLoading} className="btn-ghost btn-sm">Batal</button>
                <button onClick={handleProses} disabled={prosesLoading} className="btn-primary btn-sm flex items-center gap-1">
                  {prosesLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Simpan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShellTopbar>
  )
}
