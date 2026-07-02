'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { safeFetch } from '@/lib/safe-fetch'
import { Users, UserPlus, UserMinus, Building2, ChevronDown, ChevronRight } from 'lucide-react'

interface SiswaItem {
  nama: string
  nisn: string | null
  nik: string | null
  jenis_kelamin: string | null
  tempat_lahir: string | null
  tanggal_lahir: string | null
}

interface KelasGroup {
  kelas_kelompok: string
  total: number
  laki: number
  perempuan: number
  siswa: SiswaItem[]
}

interface MutasiItem {
  nama: string
  tanggal: string
  kelas_kelompok: string
  sekolah_asal?: string | null
  sekolah_tujuan?: string | null
  jenis_kelamin: string | null
}

interface PegawaiItem {
  nama: string
  nip: string | null
  nuptk: string | null
  jabatan: string | null
  status_pegawai: string | null
  jenis_kelamin: string | null
  pendidikan_terakhir: string | null
}

interface RuangItem {
  nama_ruang: string
  jenis_ruang: string | null
  kondisi_non_struktur: string | null
  kapasitas_siswa: number | null
  lantai_ke: number | null
}

interface LaporanData {
  school: { nama: string; npsn: string; jenjang: string; status: string; alamat: string; desa: string }
  periode: string
  tahun_pelajaran: string
  siswa: {
    byClass: KelasGroup[]
    totalSiswa: number
    mutasiMasuk: MutasiItem[]
    mutasiKeluar: MutasiItem[]
  }
  pegawai: {
    guru: PegawaiItem[]
    tendik: PegawaiItem[]
    total: number
  }
  infrastruktur: {
    ruang: RuangItem[]
    total: number
  }
}

function statusBadge(status: string | null) {
  if (!status) return null
  const color = status === 'baik' ? 'bg-green-50 text-green-700' :
    status === 'sedang' ? 'bg-yellow-50 text-yellow-700' :
    status === 'rusak' ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-600'
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${color}`}>{status}</span>
}

function statusPegawaiBadge(status: string | null) {
  if (!status) return null
  const colors: Record<string, string> = {
    pns: 'bg-blue-50 text-blue-700',
    pppk: 'bg-indigo-50 text-indigo-700',
    honorer: 'bg-orange-50 text-orange-700',
    gty: 'bg-purple-50 text-purple-700',
    gtt: 'bg-cyan-50 text-cyan-700',
  }
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status] || 'bg-slate-50 text-slate-600'}`}>{status.toUpperCase()}</span>
}

export default function LaporanBulananClient() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role as string
  const userSekolahId = (session?.user as any)?.sekolah_id as string | undefined

  const [data, setData] = useState<LaporanData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedKelas, setExpandedKelas] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const params = role !== 'admin_kecamatan' && userSekolahId
          ? `?sekolah_id=${userSekolahId}`
          : ''
        const result = await safeFetch<LaporanData>(`/api/v2/laporan-bulanan${params}`)
        setData(result)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [role, userSekolahId])

  const toggleKelas = (k: string) => {
    setExpandedKelas(prev => {
      const next = new Set(prev)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })
  }

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-64" />
          <div className="h-4 bg-slate-200 rounded w-96" />
          <div className="h-64 bg-slate-100 rounded" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium">Gagal memuat laporan</p>
          <p className="text-red-500 text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Laporan Bulanan</h1>
            <p className="text-slate-500 mt-1">
              {data.school.nama} &middot; {data.periode}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              NPSN: {data.school.npsn} &middot; {data.school.desa} &middot; {data.school.status.charAt(0).toUpperCase() + data.school.status.slice(1)}
            </p>
          </div>
          <div className="text-right text-sm text-slate-500">
            <div className="font-medium">Tahun Pelajaran</div>
            <div className="text-lg font-bold text-primary">{data.tahun_pelajaran}</div>
          </div>
        </div>
      </div>

      {/* Section 1: Siswa */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-border flex items-center gap-3">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-slate-900">Daftar Siswa</h2>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{data.siswa.totalSiswa} siswa aktif</span>
        </div>

        {/* Per kelas */}
        <div className="divide-y divide-border">
          {data.siswa.byClass.map((kelas) => {
            const isOpen = expandedKelas.has(kelas.kelas_kelompok)
            return (
              <div key={kelas.kelas_kelompok}>
                <button
                  onClick={() => toggleKelas(kelas.kelas_kelompok)}
                  className="w-full flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                    <span className="font-medium text-slate-900">{kelas.kelas_kelompok}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-blue-600">{kelas.laki} L</span>
                    <span className="text-pink-600">{kelas.perempuan} P</span>
                    <span className="text-slate-500 font-medium">{kelas.total} siswa</span>
                  </div>
                </button>
                {isOpen && (
                  <div className="px-6 pb-3">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-t border-border">
                          <th className="text-left py-2 px-2 text-slate-500 font-medium">No</th>
                          <th className="text-left py-2 px-2 text-slate-500 font-medium">Nama</th>
                          <th className="text-left py-2 px-2 text-slate-500 font-medium">NISN</th>
                          <th className="text-left py-2 px-2 text-slate-500 font-medium">NIK</th>
                          <th className="text-left py-2 px-2 text-slate-500 font-medium">JK</th>
                          <th className="text-left py-2 px-2 text-slate-500 font-medium">Tempat Lahir</th>
                          <th className="text-left py-2 px-2 text-slate-500 font-medium">Tgl Lahir</th>
                        </tr>
                      </thead>
                      <tbody>
                        {kelas.siswa.map((s, i) => (
                          <tr key={i} className="border-t border-border/50 hover:bg-slate-50">
                            <td className="py-2 px-2 text-slate-400">{i + 1}</td>
                            <td className="py-2 px-2 font-medium text-slate-900">{s.nama}</td>
                            <td className="py-2 px-2 text-slate-600">{s.nisn || '-'}</td>
                            <td className="py-2 px-2 text-slate-600">{s.nik || '-'}</td>
                            <td className="py-2 px-2 text-slate-600">{s.jenis_kelamin === 'laki-laki' ? 'L' : 'P'}</td>
                            <td className="py-2 px-2 text-slate-600">{s.tempat_lahir || '-'}</td>
                            <td className="py-2 px-2 text-slate-600">{s.tanggal_lahir || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
          {data.siswa.byClass.length === 0 && (
            <div className="px-6 py-8 text-center text-slate-400">Tidak ada siswa aktif</div>
          )}
        </div>
      </div>

      {/* Mutasi Masuk & Keluar side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mutasi Masuk */}
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="bg-green-50 px-6 py-4 border-b border-border flex items-center gap-3">
            <UserPlus className="w-5 h-5 text-green-600" />
            <h2 className="font-semibold text-slate-900">Siswa Masuk</h2>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">{data.siswa.mutasiMasuk.length}</span>
          </div>
          {data.siswa.mutasiMasuk.length > 0 ? (
            <div className="divide-y divide-border">
              {data.siswa.mutasiMasuk.map((m, i) => (
                <div key={i} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-900">{m.nama}</div>
                    <div className="text-xs text-slate-400">{m.kelas_kelompok} &middot; Dari: {m.sekolah_asal || '-'}</div>
                  </div>
                  <div className="text-xs text-slate-500">{m.tanggal}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-slate-400 text-sm">Tidak ada siswa masuk bulan ini</div>
          )}
        </div>

        {/* Mutasi Keluar */}
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="bg-red-50 px-6 py-4 border-b border-border flex items-center gap-3">
            <UserMinus className="w-5 h-5 text-red-600" />
            <h2 className="font-semibold text-slate-900">Siswa Keluar</h2>
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">{data.siswa.mutasiKeluar.length}</span>
          </div>
          {data.siswa.mutasiKeluar.length > 0 ? (
            <div className="divide-y divide-border">
              {data.siswa.mutasiKeluar.map((m, i) => (
                <div key={i} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-900">{m.nama}</div>
                    <div className="text-xs text-slate-400">{m.kelas_kelompok} &middot; Ke: {m.sekolah_tujuan || '-'}</div>
                  </div>
                  <div className="text-xs text-slate-500">{m.tanggal}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-slate-400 text-sm">Tidak ada siswa keluar bulan ini</div>
          )}
        </div>
      </div>

      {/* Section 2: Pegawai */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-border flex items-center gap-3">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-slate-900">Daftar Pegawai</h2>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{data.pegawai.total} pegawai</span>
        </div>

        {/* Guru */}
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Guru & Kepala Sekolah ({data.pegawai.guru.length})</h3>
          {data.pegawai.guru.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 text-slate-500 font-medium">No</th>
                    <th className="text-left py-2 px-2 text-slate-500 font-medium">Nama</th>
                    <th className="text-left py-2 px-2 text-slate-500 font-medium">NIP</th>
                    <th className="text-left py-2 px-2 text-slate-500 font-medium">NUPTK</th>
                    <th className="text-left py-2 px-2 text-slate-500 font-medium">Jabatan</th>
                    <th className="text-left py-2 px-2 text-slate-500 font-medium">Status</th>
                    <th className="text-left py-2 px-2 text-slate-500 font-medium">JK</th>
                    <th className="text-left py-2 px-2 text-slate-500 font-medium">Pendidikan</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pegawai.guru.map((e, i) => (
                    <tr key={i} className="border-t border-border/50 hover:bg-slate-50">
                      <td className="py-2 px-2 text-slate-400">{i + 1}</td>
                      <td className="py-2 px-2 font-medium text-slate-900">{e.nama}</td>
                      <td className="py-2 px-2 text-slate-600">{e.nip || '-'}</td>
                      <td className="py-2 px-2 text-slate-600">{e.nuptk || '-'}</td>
                      <td className="py-2 px-2 text-slate-600">{e.jabatan || '-'}</td>
                      <td className="py-2 px-2">{statusPegawaiBadge(e.status_pegawai)}</td>
                      <td className="py-2 px-2 text-slate-600">{e.jenis_kelamin === 'laki-laki' ? 'L' : 'P'}</td>
                      <td className="py-2 px-2 text-slate-600">{e.pendidikan_terakhir || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-400 text-sm py-4 text-center">Tidak ada data guru</p>
          )}
        </div>

        {/* Tendik */}
        <div className="px-6 py-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Tenaga Kependidikan ({data.pegawai.tendik.length})</h3>
          {data.pegawai.tendik.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 text-slate-500 font-medium">No</th>
                    <th className="text-left py-2 px-2 text-slate-500 font-medium">Nama</th>
                    <th className="text-left py-2 px-2 text-slate-500 font-medium">NIP</th>
                    <th className="text-left py-2 px-2 text-slate-500 font-medium">NUPTK</th>
                    <th className="text-left py-2 px-2 text-slate-500 font-medium">Jabatan</th>
                    <th className="text-left py-2 px-2 text-slate-500 font-medium">Status</th>
                    <th className="text-left py-2 px-2 text-slate-500 font-medium">JK</th>
                    <th className="text-left py-2 px-2 text-slate-500 font-medium">Pendidikan</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pegawai.tendik.map((e, i) => (
                    <tr key={i} className="border-t border-border/50 hover:bg-slate-50">
                      <td className="py-2 px-2 text-slate-400">{i + 1}</td>
                      <td className="py-2 px-2 font-medium text-slate-900">{e.nama}</td>
                      <td className="py-2 px-2 text-slate-600">{e.nip || '-'}</td>
                      <td className="py-2 px-2 text-slate-600">{e.nuptk || '-'}</td>
                      <td className="py-2 px-2 text-slate-600">{e.jabatan || '-'}</td>
                      <td className="py-2 px-2">{statusPegawaiBadge(e.status_pegawai)}</td>
                      <td className="py-2 px-2 text-slate-600">{e.jenis_kelamin === 'laki-laki' ? 'L' : 'P'}</td>
                      <td className="py-2 px-2 text-slate-600">{e.pendidikan_terakhir || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-400 text-sm py-4 text-center">Tidak ada data tendik</p>
          )}
        </div>
      </div>

      {/* Section 3: Infrastruktur */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-border flex items-center gap-3">
          <Building2 className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-slate-900">Daftar Infrastruktur</h2>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{data.infrastruktur.total} ruang</span>
        </div>
        {data.infrastruktur.ruang.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-6 text-slate-500 font-medium">No</th>
                  <th className="text-left py-3 px-2 text-slate-500 font-medium">Nama Ruang</th>
                  <th className="text-left py-3 px-2 text-slate-500 font-medium">Jenis</th>
                  <th className="text-left py-3 px-2 text-slate-500 font-medium">Lantai</th>
                  <th className="text-left py-3 px-2 text-slate-500 font-medium">Kapasitas</th>
                  <th className="text-left py-3 px-2 text-slate-500 font-medium">Kondisi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.infrastruktur.ruang.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-3 px-6 text-slate-400">{i + 1}</td>
                    <td className="py-3 px-2 font-medium text-slate-900">{r.nama_ruang}</td>
                    <td className="py-3 px-2 text-slate-600">{r.jenis_ruang || '-'}</td>
                    <td className="py-3 px-2 text-slate-600">Lantai {r.lantai_ke || 1}</td>
                    <td className="py-3 px-2 text-slate-600">{r.kapasitas_siswa ? `${r.kapasitas_siswa} siswa` : '-'}</td>
                    <td className="py-3 px-2">{statusBadge(r.kondisi_non_struktur)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-8 text-center text-slate-400">Tidak ada data infrastruktur</div>
        )}
      </div>
    </div>
  )
}
