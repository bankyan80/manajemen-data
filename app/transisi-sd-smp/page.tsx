'use client'

import { useState } from 'react'
import AppShellTopbar from '@/components/layout/AppShellTopbar'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useData, fetchJson } from '@/lib/useData'
import { Search, Plus } from 'lucide-react'

const TABS = ['Calon Masuk SMP', 'Anak Lanjut SMP', 'SMP Tujuan', 'Kesiapan Anak', 'Kegiatan Transisi', 'Rekap Transisi Kecamatan']

const STATUS_LABELS: Record<string, string> = {
  calon_masuk: 'Calon Masuk',
  lanjut: 'Lanjut',
  sudah_mendaftar: 'Sudah Mendaftar',
  diterima: 'Diterima',
  belum_mendaftar: 'Belum Mendaftar',
}

const STATUS_COLORS: Record<string, string> = {
  calon_masuk: 'bg-blue-100 text-blue-700',
  lanjut: 'bg-green-100 text-green-700',
  sudah_mendaftar: 'bg-purple-100 text-purple-700',
  diterima: 'bg-teal-100 text-teal-700',
  belum_mendaftar: 'bg-amber-100 text-amber-700',
}

export default function TransisiSdSmpPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(0)
  const [search, setSearch] = useState('')
  const { data: transData, loading } = useData<any>('transitions', () => fetchJson('/api/transitions'))

  const role = (session?.user as any)?.role
  const isAdmin = role === 'admin_kecamatan'

  if (status === 'loading') return <div className="p-8 text-center text-zinc-500">Memuat...</div>
  if (!session) { router.push('/login'); return null }

  const items = transData?.data || []
  const recap = transData?.recap || []

  const filtered = items.filter((d: any) =>
    !search || d.nama.toLowerCase().includes(search.toLowerCase()) || (d.nisn || '').includes(search)
  )

  function groupBySchool(data: any[]) {
    const map = new Map<string, { school_nama: string; laki: number; perempuan: number; total: number }>()
    for (const d of data) {
      const key = d.school_id
      if (!map.has(key)) map.set(key, { school_nama: d.school_nama || 'Unknown', laki: 0, perempuan: 0, total: 0 })
      const entry = map.get(key)!
      if (d.jenis_kelamin === 'laki-laki') entry.laki++
      else if (d.jenis_kelamin === 'perempuan') entry.perempuan++
      entry.total++
    }
    return Array.from(map.values()).sort((a, b) => a.school_nama.localeCompare(b.school_nama))
  }

  const calonMasuk = filtered.filter((d: any) => d.status_transisi === 'calon_masuk' || d.status_transisi === 'belum_mendaftar')
  const anakLanjut = filtered.filter((d: any) => d.status_transisi === 'lanjut' || d.status_transisi === 'sudah_mendaftar' || d.status_transisi === 'diterima')
  const smpTujuan = Array.from(new Set(filtered.map((d: any) => d.smp_tujuan).filter(Boolean))) as string[]
  const kesiapanData = filtered.filter((d: any) => d.kesiapan)
  const kegiatanData = filtered.filter((d: any) => d.kegiatan_transisi)

  const calonMasukSekolah = groupBySchool(calonMasuk)
  const anakLanjutSekolah = groupBySchool(anakLanjut)
  const kesiapanSekolah = groupBySchool(kesiapanData)
  const kegiatanSekolah = groupBySchool(kegiatanData)

  const summaryRecap = TABS.map((tab, i) => {
    if (i === 0) return { tab, sd: isAdmin ? calonMasukSekolah.length : calonMasuk.length, kb: 0 }
    if (i === 1) return { tab, sd: isAdmin ? anakLanjutSekolah.length : anakLanjut.length, kb: 0 }
    if (i === 2) return { tab, sd: smpTujuan.length, kb: 0 }
    if (i === 3) return { tab, sd: isAdmin ? kesiapanSekolah.length : kesiapanData.length, kb: 0 }
    if (i === 4) return { tab, sd: isAdmin ? kegiatanSekolah.length : kegiatanData.length, kb: 0 }
    if (i === 5) return { tab, sd: recap.reduce((s: number, r: any) => s + r.total, 0), kb: 0 }
    return { tab, sd: 0, kb: 0 }
  })

  return (
    <AppShellTopbar>
      <div className="container-page space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-text-main">Transisi SD-SMP</h1>
          <button className="btn-primary px-4 py-2">
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
                      <><th className="text-left px-4 py-3 font-semibold text-text-muted">Nama</th><th className="text-left px-4 py-3 font-semibold text-text-muted">NISN</th><th className="text-left px-4 py-3 font-semibold text-text-muted">Jenis Kelamin</th><th className="text-left px-4 py-3 font-semibold text-text-muted">Kelas</th><th className="text-left px-4 py-3 font-semibold text-text-muted">Sekolah</th><th className="text-left px-4 py-3 font-semibold text-text-muted">Status</th></>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={isAdmin ? 4 : 6} className="px-4 py-8 text-center text-sm text-text-muted">Memuat...</td></tr>
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
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-text-muted">Belum ada data calon masuk SMP</td></tr>
                    ) : calonMasuk.map((d: any, i: number) => (
                      <tr key={d.id || i} className="border-b border-zinc-100 hover:bg-zinc-50">
                        <td className="px-4 py-3 font-medium text-text-main">{d.nama}</td>
                        <td className="px-4 py-3">{d.nisn || '-'}</td>
                        <td className="px-4 py-3">{d.jenis_kelamin || '-'}</td>
                        <td className="px-4 py-3">{d.kelas}</td>
                        <td className="px-4 py-3">{d.school_nama || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`badge ${STATUS_COLORS[d.status_transisi]?.replace('bg-', 'badge-') || 'badge-info'}`}>{STATUS_LABELS[d.status_transisi] || d.status_transisi}</span>
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
            <div className="px-4 py-3 border-b border-border font-semibold text-text-main">Kesiapan Anak</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-border">
                    {isAdmin ? (
                      <><th className="text-left px-4 py-3 font-semibold text-text-muted">Sekolah</th><th className="text-center px-4 py-3 font-semibold text-text-muted">L</th><th className="text-center px-4 py-3 font-semibold text-text-muted">P</th><th className="text-center px-4 py-3 font-semibold text-text-muted">Jumlah</th></>
                    ) : (
                      <><th className="text-left px-4 py-3 font-semibold text-text-muted">Nama</th><th className="text-left px-4 py-3 font-semibold text-text-muted">NISN</th><th className="text-left px-4 py-3 font-semibold text-text-muted">Kesiapan</th><th className="text-left px-4 py-3 font-semibold text-text-muted">Keterangan</th></>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={isAdmin ? 4 : 4} className="px-4 py-8 text-center text-sm text-text-muted">Memuat...</td></tr>
                  ) : isAdmin ? (
                    kesiapanSekolah.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-text-muted">Belum ada data kesiapan anak</td></tr>
                    ) : kesiapanSekolah.map((s, i) => (
                      <tr key={i} className="border-b border-zinc-100 hover:bg-zinc-50">
                        <td className="px-4 py-3 font-medium text-text-main">{s.school_nama}</td>
                        <td className="px-4 py-3 text-center text-text-muted">{s.laki}</td>
                        <td className="px-4 py-3 text-center text-text-muted">{s.perempuan}</td>
                        <td className="px-4 py-3 text-center font-bold text-primary">{s.total}</td>
                      </tr>
                    ))
                  ) : (
                    kesiapanData.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-text-muted">Belum ada data kesiapan anak</td></tr>
                    ) : kesiapanData.map((d: any, i: number) => (
                      <tr key={d.id || i} className="border-b border-zinc-100 hover:bg-zinc-50">
                        <td className="px-4 py-3 font-medium text-text-main">{d.nama}</td>
                        <td className="px-4 py-3">{d.nisn || '-'}</td>
                        <td className="px-4 py-3">{d.kesiapan}</td>
                        <td className="px-4 py-3">{d.keterangan || '-'}</td>
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
            <div className="px-4 py-3 border-b border-border font-semibold text-text-main">Kegiatan Transisi</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-border">
                    {isAdmin ? (
                      <><th className="text-left px-4 py-3 font-semibold text-text-muted">Sekolah</th><th className="text-center px-4 py-3 font-semibold text-text-muted">L</th><th className="text-center px-4 py-3 font-semibold text-text-muted">P</th><th className="text-center px-4 py-3 font-semibold text-text-muted">Jumlah</th></>
                    ) : (
                      <><th className="text-left px-4 py-3 font-semibold text-text-muted">Nama</th><th className="text-left px-4 py-3 font-semibold text-text-muted">Kegiatan</th><th className="text-left px-4 py-3 font-semibold text-text-muted">Keterangan</th></>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={isAdmin ? 4 : 3} className="px-4 py-8 text-center text-sm text-text-muted">Memuat...</td></tr>
                  ) : isAdmin ? (
                    kegiatanSekolah.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-text-muted">Belum ada data kegiatan transisi</td></tr>
                    ) : kegiatanSekolah.map((s, i) => (
                      <tr key={i} className="border-b border-zinc-100 hover:bg-zinc-50">
                        <td className="px-4 py-3 font-medium text-text-main">{s.school_nama}</td>
                        <td className="px-4 py-3 text-center text-text-muted">{s.laki}</td>
                        <td className="px-4 py-3 text-center text-text-muted">{s.perempuan}</td>
                        <td className="px-4 py-3 text-center font-bold text-primary">{s.total}</td>
                      </tr>
                    ))
                  ) : (
                    kegiatanData.length === 0 ? (
                      <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-text-muted">Belum ada data kegiatan transisi</td></tr>
                    ) : kegiatanData.map((d: any, i: number) => (
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
      </div>
    </AppShellTopbar>
  )
}
