'use client'

import { useState } from 'react'
import AppShellTopbar from '@/components/layout/AppShellTopbar'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const TABS = ['Kurikulum', 'Kalender Pendidikan', 'Jadwal Asesmen', 'Perangkat Ajar', 'Rekap Penilaian', 'Literasi Numerasi', 'Supervisi Akademik', 'Transisi PAUD-SD']

const SCHOOLS = [
  { sekolah: 'SD Negeri 1 Margaasih', npsn: '20245678', kurikulum: 'Kurikulum Merdeka', kelas: 'I-VI', tahun: '2025/2026', status: 'Aktif', ptk: 12, pd: 180 },
  { sekolah: 'SD Negeri 2 Margaasih', npsn: '20245679', kurikulum: 'Kurikulum Merdeka', kelas: 'I-VI', tahun: '2025/2026', status: 'Aktif', ptk: 8, pd: 120 },
  { sekolah: 'SD Negeri 3 Cangkuang', npsn: '20245681', kurikulum: 'Kurikulum 2013', kelas: 'I-VI', tahun: '2024/2025', status: 'Aktif', ptk: 10, pd: 156 },
  { sekolah: 'SD Swasta Bina Bangsa', npsn: '20245680', kurikulum: 'Kurikulum Merdeka', kelas: 'I-VI', tahun: '2025/2026', status: 'Aktif', ptk: 15, pd: 210 },
  { sekolah: 'PAUD Melati Putih', npsn: '69987654', kurikulum: 'Kurikulum PAUD 2013', kelompok: 'A-B', tahun: '2025/2026', status: 'Aktif', ptk: 4, pd: 22 },
]

const KALENDER = [
  { kegiatan: 'Hari Pertama Masuk Sekolah', tanggal: '15 Juli 2026', jenis: 'Nasional' },
  { kegiatan: 'Masa Pengenalan Lingkungan Sekolah', tanggal: '15-17 Juli 2026', jenis: 'Nasional' },
  { kegiatan: 'Penilaian Tengah Semester Ganjil', tanggal: '21-25 September 2026', jenis: 'Akademik' },
  { kegiatan: 'Penilaian Akhir Semester Ganjil', tanggal: '30 Nov - 4 Des 2026', jenis: 'Akademik' },
  { kegiatan: 'Pembagian Raport Semester Ganjil', tanggal: '18 Desember 2026', jenis: 'Akademik' },
  { kegiatan: 'Libur Semester Ganjil', tanggal: '19-31 Desember 2026', jenis: 'Libur' },
  { kegiatan: 'Hari Raya Idul Fitri 1448 H', tanggal: '16-17 Maret 2027', jenis: 'Nasional' },
  { kegiatan: 'Penilaian Akhir Semester Genap', tanggal: '7-11 Juni 2027', jenis: 'Akademik' },
  { kegiatan: 'Kenaikan Kelas', tanggal: '18 Juni 2027', jenis: 'Akademik' },
  { kegiatan: 'Libur Akhir Tahun Pelajaran', tanggal: '19 Juni - 14 Juli 2027', jenis: 'Libur' },
]

export default function KurikulumPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(0)

  if (status === 'loading') return <div className="p-8 text-center text-zinc-500">Memuat...</div>
  if (!session) { router.push('/login'); return null }

  return (
    <AppShellTopbar>
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-zinc-900">Kurikulum &amp; Penilaian</h1>

        <div className="flex flex-wrap gap-1 bg-zinc-100 p-1 rounded-lg">
          {TABS.map((tab, i) => (
            <button key={i} onClick={() => setActiveTab(i)} className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${activeTab === i ? 'bg-white text-blue-700 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}>{tab}</button>
          ))}
        </div>

        {activeTab === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-200 font-semibold text-zinc-900">Data Kurikulum Sekolah/Lembaga</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200">
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Nama Sekolah</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">NPSN</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Kurikulum</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Kelas/Kelompok</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Tahun Pelajaran</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">PTK</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">PD</th>
                  </tr>
                </thead>
                <tbody>
                  {SCHOOLS.map((s, i) => (
                    <tr key={i} className="border-b border-zinc-100 hover:bg-zinc-50">
                      <td className="px-4 py-3 font-medium text-zinc-900">{s.sekolah}</td>
                      <td className="px-4 py-3">{s.npsn}</td>
                      <td className="px-4 py-3">{s.kurikulum}</td>
                      <td className="px-4 py-3">{s.kelas || s.kelompok}</td>
                      <td className="px-4 py-3">{s.tahun}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">{s.status}</span>
                      </td>
                      <td className="px-4 py-3">{s.ptk}</td>
                      <td className="px-4 py-3">{s.pd}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-200 font-semibold text-zinc-900">Kalender Pendidikan 2025/2026</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200">
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Kegiatan</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Tanggal</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Jenis</th>
                  </tr>
                </thead>
                <tbody>
                  {KALENDER.map((k, i) => (
                    <tr key={i} className="border-b border-zinc-100 hover:bg-zinc-50">
                      <td className="px-4 py-3 font-medium">{k.kegiatan}</td>
                      <td className="px-4 py-3">{k.tanggal}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${k.jenis === 'Akademik' ? 'bg-blue-100 text-blue-700' : k.jenis === 'Nasional' ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'}`}>{k.jenis}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 2 && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
            <h3 className="font-semibold text-zinc-900 mb-4">Jadwal Asesmen 2025/2026</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="border border-zinc-200 rounded-lg p-4">
                <p className="text-sm text-zinc-500">Asesmen Nasional</p>
                <p className="font-semibold mt-1">Oktober 2026</p>
                <p className="text-xs text-zinc-500 mt-1">Kelas V SD</p>
              </div>
              <div className="border border-zinc-200 rounded-lg p-4">
                <p className="text-sm text-zinc-500">PTS Ganjil</p>
                <p className="font-semibold mt-1">21-25 September 2026</p>
                <p className="text-xs text-zinc-500 mt-1">Semua Kelas</p>
              </div>
              <div className="border border-zinc-200 rounded-lg p-4">
                <p className="text-sm text-zinc-500">PAS Ganjil</p>
                <p className="font-semibold mt-1">30 Nov - 4 Des 2026</p>
                <p className="text-xs text-zinc-500 mt-1">Semua Kelas</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 4 && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
            <h3 className="font-semibold text-zinc-900 mb-4">Rekap Penilaian</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 border border-zinc-200 rounded-lg">
                <p className="text-2xl font-bold text-blue-700">95%</p>
                <p className="text-sm text-zinc-600">Ketuntasan SD</p>
              </div>
              <div className="text-center p-4 border border-zinc-200 rounded-lg">
                <p className="text-2xl font-bold text-green-700">92%</p>
                <p className="text-sm text-zinc-600">Ketuntasan PAUD</p>
              </div>
              <div className="text-center p-4 border border-zinc-200 rounded-lg">
                <p className="text-2xl font-bold text-amber-700">88%</p>
                <p className="text-sm text-zinc-600">Rata-rata Nasional</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 5 && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
            <h3 className="font-semibold text-zinc-900 mb-4">Literasi Numerasi</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                <p className="font-semibold text-blue-900">Literasi</p>
                <p className="text-3xl font-bold text-blue-700 mt-2">78%</p>
                <p className="text-sm text-blue-600 mt-1">Rata-rata kemampuan membaca</p>
              </div>
              <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                <p className="font-semibold text-green-900">Numerasi</p>
                <p className="text-3xl font-bold text-green-700 mt-2">72%</p>
                <p className="text-sm text-green-600 mt-1">Rata-rata kemampuan berhitung</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShellTopbar>
  )
}
