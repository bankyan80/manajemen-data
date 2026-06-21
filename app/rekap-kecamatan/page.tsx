'use client'

import { useState } from 'react'
import AppShellTopbar from '@/components/layout/AppShellTopbar'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const TABS = ['Rekap Sekolah/Lembaga', 'Rekap Peserta Didik', 'Rekap GTK', 'Rekap Sarpras', 'Rekap SPMB', 'Rekap Transisi PAUD-SD', 'Rekap Bantuan', 'Rekap Kegiatan', 'Rekap Kendala', 'Rekap Dokumen Pegawai']

const SEKOLAH_REKAP = [
  { jenjang: 'SD', negeri: 3, swasta: 2, total: 5, pd: 666, ptk: 45 },
  { jenjang: 'PAUD', negeri: 0, swasta: 2, total: 2, pd: 40, ptk: 6 },
]

const PD_REKAP = [
  { jenjang: 'SD', laki: 210, perempuan: 198, total: 408, masuk: 48, keluar: 4 },
  { jenjang: 'PAUD', laki: 18, perempuan: 22, total: 40, masuk: 20, keluar: 3 },
]

const GTK_REKAP = [
  { jabatan: 'Kepala Sekolah', pns: 3, pppk: 0, non_asn: 0, total: 3 },
  { jabatan: 'Guru Kelas', pns: 5, pppk: 2, non_asn: 1, total: 8 },
  { jabatan: 'Guru Mapel', pns: 2, pppk: 1, non_asn: 0, total: 3 },
  { jabatan: 'Guru PAUD', pns: 0, pppk: 1, non_asn: 1, total: 2 },
  { jabatan: 'Tenaga Kependidikan', pns: 0, pppk: 0, non_asn: 2, total: 2 },
]

export default function RekapKecamatanPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(0)
  const [filterJenjang, setFilterJenjang] = useState('')

  if (status === 'loading') return <div className="p-8 text-center text-zinc-500">Memuat...</div>
  if (!session) { router.push('/login'); return null }

  return (
    <AppShellTopbar>
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-zinc-900">Rekap Kecamatan</h1>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">7</p>
            <p className="text-xs text-zinc-500">Total SD</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4 text-center">
            <p className="text-2xl font-bold text-purple-700">2</p>
            <p className="text-xs text-zinc-500">Total PAUD</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4 text-center">
            <p className="text-2xl font-bold text-green-700">18</p>
            <p className="text-xs text-zinc-500">Total GTK</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4 text-center">
            <p className="text-2xl font-bold text-amber-700">156</p>
            <p className="text-xs text-zinc-500">Total Dokumen</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4 text-center">
            <p className="text-2xl font-bold text-red-700">12</p>
            <p className="text-xs text-zinc-500">Total Laporan</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4 text-center">
            <p className="text-2xl font-bold text-cyan-700">448</p>
            <p className="text-xs text-zinc-500">Total Peserta Didik</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 bg-zinc-100 p-1 rounded-lg">
          {TABS.map((tab, i) => (
            <button key={i} onClick={() => setActiveTab(i)} className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${activeTab === i ? 'bg-white text-blue-700 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}>{tab}</button>
          ))}
        </div>

        <div className="flex gap-4 items-center flex-wrap">
          <select value={filterJenjang} onChange={e => setFilterJenjang(e.target.value)} className="px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
            <option value="">Semua Jenjang</option>
            <option value="SD">SD</option>
            <option value="PAUD">PAUD</option>
          </select>
          <select className="px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
            <option value="">Semua Sekolah</option>
          </select>
          <select className="px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
            <option value="">2025/2026</option>
            <option>2024/2025</option>
          </select>
          <select className="px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
            <option value="">Semester Ganjil</option>
            <option>Semester Genap</option>
          </select>
          <select className="px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
            <option value="">Semua Bulan</option>
          </select>
        </div>

        {activeTab === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-200 font-semibold text-zinc-900">Rekap Sekolah / Lembaga</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200">
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Jenjang</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Negeri</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Swasta</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Total</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Peserta Didik</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">PTK</th>
                  </tr>
                </thead>
                <tbody>
                  {SEKOLAH_REKAP.filter(d => !filterJenjang || d.jenjang === filterJenjang).map((d, i) => (
                    <tr key={i} className="border-b border-zinc-100">
                      <td className="px-4 py-3 font-medium">{d.jenjang}</td>
                      <td className="px-4 py-3">{d.negeri}</td>
                      <td className="px-4 py-3">{d.swasta}</td>
                      <td className="px-4 py-3 font-bold">{d.total}</td>
                      <td className="px-4 py-3">{d.pd}</td>
                      <td className="px-4 py-3">{d.ptk}</td>
                    </tr>
                  ))}
                  <tr className="bg-blue-50 font-bold">
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3">{SEKOLAH_REKAP.reduce((a, d) => a + d.negeri, 0)}</td>
                    <td className="px-4 py-3">{SEKOLAH_REKAP.reduce((a, d) => a + d.swasta, 0)}</td>
                    <td className="px-4 py-3">{SEKOLAH_REKAP.reduce((a, d) => a + d.total, 0)}</td>
                    <td className="px-4 py-3">{SEKOLAH_REKAP.reduce((a, d) => a + d.pd, 0)}</td>
                    <td className="px-4 py-3">{SEKOLAH_REKAP.reduce((a, d) => a + d.ptk, 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-200 font-semibold text-zinc-900">Rekap Peserta Didik</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200">
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Jenjang</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Laki-laki</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Perempuan</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Total</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Siswa Masuk</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Siswa Keluar</th>
                  </tr>
                </thead>
                <tbody>
                  {PD_REKAP.filter(d => !filterJenjang || d.jenjang === filterJenjang).map((d, i) => (
                    <tr key={i} className="border-b border-zinc-100">
                      <td className="px-4 py-3 font-medium">{d.jenjang}</td>
                      <td className="px-4 py-3">{d.laki}</td>
                      <td className="px-4 py-3">{d.perempuan}</td>
                      <td className="px-4 py-3 font-bold">{d.total}</td>
                      <td className="px-4 py-3">{d.masuk}</td>
                      <td className="px-4 py-3">{d.keluar}</td>
                    </tr>
                  ))}
                  <tr className="bg-blue-50 font-bold">
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3">{PD_REKAP.reduce((a, d) => a + d.laki, 0)}</td>
                    <td className="px-4 py-3">{PD_REKAP.reduce((a, d) => a + d.perempuan, 0)}</td>
                    <td className="px-4 py-3">{PD_REKAP.reduce((a, d) => a + d.total, 0)}</td>
                    <td className="px-4 py-3">{PD_REKAP.reduce((a, d) => a + d.masuk, 0)}</td>
                    <td className="px-4 py-3">{PD_REKAP.reduce((a, d) => a + d.keluar, 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 2 && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-200 font-semibold text-zinc-900">Rekap GTK</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200">
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Jabatan</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">PNS</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">PPPK</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Non ASN</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {GTK_REKAP.map((d, i) => (
                    <tr key={i} className="border-b border-zinc-100">
                      <td className="px-4 py-3 font-medium">{d.jabatan}</td>
                      <td className="px-4 py-3">{d.pns}</td>
                      <td className="px-4 py-3">{d.pppk}</td>
                      <td className="px-4 py-3">{d.non_asn}</td>
                      <td className="px-4 py-3 font-bold">{d.total}</td>
                    </tr>
                  ))}
                  <tr className="bg-blue-50 font-bold">
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3">{GTK_REKAP.reduce((a, d) => a + d.pns, 0)}</td>
                    <td className="px-4 py-3">{GTK_REKAP.reduce((a, d) => a + d.pppk, 0)}</td>
                    <td className="px-4 py-3">{GTK_REKAP.reduce((a, d) => a + d.non_asn, 0)}</td>
                    <td className="px-4 py-3">{GTK_REKAP.reduce((a, d) => a + d.total, 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 3 && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
            <h3 className="font-semibold text-zinc-900 mb-4">Rekap Sarpras per Jenis</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[{ jenis: 'Ruang Kelas', total: 50, baik: 39 }, { jenis: 'Perpustakaan', total: 4, baik: 3 }, { jenis: 'UKS', total: 4, baik: 2 }, { jenis: 'Toilet/WC', total: 12, baik: 9 }, { jenis: 'Meja Kursi', total: 420, baik: 380 }, { jenis: 'APE PAUD', total: 25, baik: 17 }, { jenis: 'Sanitasi', total: 8, baik: 6 }, { jenis: 'Rumah Dinas', total: 2, baik: 1 }].map((d, i) => (
                <div key={i} className="border border-zinc-200 rounded-lg p-4">
                  <p className="text-sm text-zinc-500">{d.jenis}</p>
                  <p className="text-xl font-bold text-zinc-900">{d.total}</p>
                  <p className="text-xs text-green-700">{d.baik} kondisi baik</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 9 && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-200 font-semibold text-zinc-900">Rekap Dokumen Pegawai</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200">
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Kategori</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Total Dibutuhkan</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Sudah Upload</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Belum Upload</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Terverifikasi</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Persentase</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { kategori: 'Dokumen Identitas', total: 24, sudah: 22, verif: 20 },
                    { kategori: 'Dokumen Kepegawaian', total: 80, sudah: 60, verif: 50 },
                    { kategori: 'Dokumen Pendidikan', total: 64, sudah: 48, verif: 45 },
                    { kategori: 'Dokumen Sertifikasi', total: 40, sudah: 25, verif: 20 },
                    { kategori: 'Dokumen Lainnya', total: 56, sudah: 30, verif: 25 },
                  ].map((d, i) => (
                    <tr key={i} className="border-b border-zinc-100">
                      <td className="px-4 py-3 font-medium">{d.kategori}</td>
                      <td className="px-4 py-3">{d.total}</td>
                      <td className="px-4 py-3 text-green-700">{d.sudah}</td>
                      <td className="px-4 py-3 text-red-700">{d.total - d.sudah}</td>
                      <td className="px-4 py-3">{d.verif}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-zinc-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(d.sudah / d.total) * 100}%` }} />
                          </div>
                          <span className="text-xs">{Math.round((d.sudah / d.total) * 100)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab >= 4 && activeTab <= 8 && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-8 text-center">
            <p className="text-zinc-500">Data {TABS[activeTab]} belum tersedia.</p>
          </div>
        )}
      </div>
    </AppShellTopbar>
  )
}
