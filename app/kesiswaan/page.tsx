'use client'

import { useState } from 'react'
import AppShellTopbar from '@/components/layout/AppShellTopbar'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const SD_DATA = [
  { tahun: '2025/2026', sekolah: 'SD Negeri 1 Margaasih', npsn: '20245678', kelas: 'I', rombel: 2, laki: 14, perempuan: 16, total: 30, masuk: 30, keluar: 0, ket: '-' },
  { tahun: '2025/2026', sekolah: 'SD Negeri 1 Margaasih', npsn: '20245678', kelas: 'II', rombel: 2, laki: 15, perempuan: 15, total: 30, masuk: 0, keluar: 1, ket: 'Pindah' },
  { tahun: '2025/2026', sekolah: 'SD Negeri 2 Margaasih', npsn: '20245679', kelas: 'I', rombel: 1, laki: 8, perempuan: 7, total: 15, masuk: 15, keluar: 0, ket: '-' },
  { tahun: '2025/2026', sekolah: 'SD Negeri 2 Margaasih', npsn: '20245679', kelas: 'III', rombel: 1, laki: 7, perempuan: 9, total: 16, masuk: 0, keluar: 0, ket: '-' },
  { tahun: '2024/2025', sekolah: 'SD Swasta Bina Bangsa', npsn: '20245680', kelas: 'VI', rombel: 3, laki: 22, perempuan: 20, total: 42, masuk: 0, keluar: 2, ket: 'Lulus' },
  { tahun: '2024/2025', sekolah: 'SD Negeri 3 Cangkuang', npsn: '20245681', kelas: 'IV', rombel: 2, laki: 12, perempuan: 14, total: 26, masuk: 3, keluar: 0, ket: '-' },
  { tahun: '2024/2025', sekolah: 'SD Negeri 3 Cangkuang', npsn: '20245681', kelas: 'V', rombel: 2, laki: 13, perempuan: 13, total: 26, masuk: 0, keluar: 1, ket: 'Drop Out' },
]

const PAUD_DATA = [
  { tahun: '2025/2026', sekolah: 'PAUD Melati Putih', npsn: '69987654', kelompok: 'A', rombel: 1, laki: 6, perempuan: 4, total: 10, masuk: 10, keluar: 0, ket: '-' },
  { tahun: '2025/2026', sekolah: 'PAUD Melati Putih', npsn: '69987654', kelompok: 'B', rombel: 1, laki: 5, perempuan: 7, total: 12, masuk: 0, keluar: 1, ket: 'Pindah' },
  { tahun: '2025/2026', sekolah: 'PAUD Bintang Kecil', npsn: '69987655', kelompok: 'A', rombel: 1, laki: 4, perempuan: 6, total: 10, masuk: 10, keluar: 0, ket: '-' },
  { tahun: '2024/2025', sekolah: 'PAUD Bintang Kecil', npsn: '69987655', kelompok: 'B', rombel: 1, laki: 7, perempuan: 5, total: 12, masuk: 0, keluar: 2, ket: 'Lanjut SD' },
  { tahun: '2024/2025', sekolah: 'KB Ceria', npsn: '69987656', kelompok: 'B', rombel: 2, laki: 10, perempuan: 8, total: 18, masuk: 5, keluar: 0, ket: '-' },
]

export default function KesiswaanPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'sd' | 'paud'>('sd')
  const [filterTahun, setFilterTahun] = useState('2025/2026')
  const [filterSekolah, setFilterSekolah] = useState('')

  if (status === 'loading') return <div className="p-8 text-center text-zinc-500">Memuat...</div>
  if (!session) { router.push('/login'); return null }

  const data = activeTab === 'sd' ? SD_DATA : PAUD_DATA
  const filtered = data.filter(d => {
    if (filterTahun && d.tahun !== filterTahun) return false
    if (filterSekolah && !d.sekolah.toLowerCase().includes(filterSekolah.toLowerCase())) return false
    return true
  })

  const allTahun = [...SD_DATA.map(d => d.tahun), ...PAUD_DATA.map(d => d.tahun)]
  const allSekolah = [...SD_DATA.map(d => d.sekolah), ...PAUD_DATA.map(d => d.sekolah)]
  const tahunList = [...new Set(allTahun)]
  const sekolahList = [...new Set(allSekolah)]

  return (
    <AppShellTopbar>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">Kesiswaan - SD &amp; PAUD</h1>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">Tambah Data</button>
        </div>

        <div className="flex gap-1 bg-zinc-100 p-1 rounded-lg w-fit">
          <button onClick={() => setActiveTab('sd')} className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'sd' ? 'bg-white text-blue-700 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}>SD</button>
          <button onClick={() => setActiveTab('paud')} className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'paud' ? 'bg-white text-blue-700 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}>PAUD</button>
        </div>

        <div className="flex gap-4 items-center">
          <select value={filterTahun} onChange={e => setFilterTahun(e.target.value)} className="px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
            <option value="">Semua Tahun</option>
            {tahunList.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filterSekolah} onChange={e => setFilterSekolah(e.target.value)} className="px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
            <option value="">Semua Sekolah</option>
            {sekolahList.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Tahun Pelajaran</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Nama Sekolah</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">NPSN</th>
                  {activeTab === 'sd' ? (
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Kelas</th>
                  ) : (
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Kelompok</th>
                  )}
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Rombel</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Laki-laki</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Perempuan</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Total</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Siswa Masuk</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Siswa Keluar</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => (
                  <tr key={i} className="border-b border-zinc-100 hover:bg-zinc-50">
                    <td className="px-4 py-3">{d.tahun}</td>
                    <td className="px-4 py-3 font-medium text-zinc-900">{d.sekolah}</td>
                    <td className="px-4 py-3">{d.npsn}</td>
                    <td className="px-4 py-3">{activeTab === 'sd' ? (d as typeof SD_DATA[0]).kelas : (d as typeof PAUD_DATA[0]).kelompok}</td>
                    <td className="px-4 py-3">{d.rombel}</td>
                    <td className="px-4 py-3">{d.laki}</td>
                    <td className="px-4 py-3">{d.perempuan}</td>
                    <td className="px-4 py-3 font-semibold">{d.total}</td>
                    <td className="px-4 py-3">{d.masuk}</td>
                    <td className="px-4 py-3">{d.keluar}</td>
                    <td className="px-4 py-3">{d.ket}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShellTopbar>
  )
}
