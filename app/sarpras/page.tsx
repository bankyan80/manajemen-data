'use client'

import { useState } from 'react'
import AppShellTopbar from '@/components/layout/AppShellTopbar'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const TABS = ['Ruang Kelas', 'Perpustakaan', 'UKS', 'Toilet/WC', 'Meja Kursi', 'APE PAUD', 'Sanitasi', 'Rumah Dinas', 'Usulan Rehab']

const DATA = [
  { sekolah: 'SD Negeri 1 Margaasih', jenis: 'Ruang Kelas', jumlah: 12, baik: 10, ringan: 1, sedang: 1, berat: 0, kebutuhan: 2 },
  { sekolah: 'SD Negeri 1 Margaasih', jenis: 'Perpustakaan', jumlah: 1, baik: 1, ringan: 0, sedang: 0, berat: 0, kebutuhan: 0 },
  { sekolah: 'SD Negeri 1 Margaasih', jenis: 'UKS', jumlah: 1, baik: 0, ringan: 1, sedang: 0, berat: 0, kebutuhan: 1 },
  { sekolah: 'SD Negeri 2 Margaasih', jenis: 'Ruang Kelas', jumlah: 8, baik: 6, ringan: 1, sedang: 0, berat: 1, kebutuhan: 2 },
  { sekolah: 'SD Negeri 2 Margaasih', jenis: 'Toilet/WC', jumlah: 4, baik: 3, ringan: 1, sedang: 0, berat: 0, kebutuhan: 1 },
  { sekolah: 'SD Negeri 3 Cangkuang', jenis: 'Ruang Kelas', jumlah: 10, baik: 8, ringan: 0, sedang: 2, berat: 0, kebutuhan: 0 },
  { sekolah: 'SD Negeri 3 Cangkuang', jenis: 'Perpustakaan', jumlah: 1, baik: 1, ringan: 0, sedang: 0, berat: 0, kebutuhan: 0 },
  { sekolah: 'SD Swasta Bina Bangsa', jenis: 'Ruang Kelas', jumlah: 15, baik: 12, ringan: 2, sedang: 1, berat: 0, kebutuhan: 3 },
  { sekolah: 'SD Swasta Bina Bangsa', jenis: 'Meja Kursi', jumlah: 210, baik: 180, ringan: 20, sedang: 10, berat: 0, kebutuhan: 30 },
  { sekolah: 'PAUD Melati Putih', jenis: 'Ruang Kelas', jumlah: 3, baik: 2, ringan: 1, sedang: 0, berat: 0, kebutuhan: 1 },
  { sekolah: 'PAUD Melati Putih', jenis: 'APE PAUD', jumlah: 15, baik: 10, ringan: 3, sedang: 2, berat: 0, kebutuhan: 5 },
  { sekolah: 'PAUD Bintang Kecil', jenis: 'Ruang Kelas', jumlah: 2, baik: 1, ringan: 0, sedang: 1, berat: 0, kebutuhan: 1 },
  { sekolah: 'PAUD Bintang Kecil', jenis: 'APE PAUD', jumlah: 10, baik: 7, ringan: 2, sedang: 1, berat: 0, kebutuhan: 3 },
]

export default function SarprasPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(0)

  if (status === 'loading') return <div className="p-8 text-center text-zinc-500">Memuat...</div>
  if (!session) { router.push('/login'); return null }

  const filtered = activeTab === 0 ? DATA : DATA.filter(d => d.jenis === TABS[activeTab])

  return (
    <AppShellTopbar>
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-zinc-900">Sarana Prasarana</h1>

        <div className="flex flex-wrap gap-1 bg-zinc-100 p-1 rounded-lg">
          <button onClick={() => setActiveTab(0)} className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${activeTab === 0 ? 'bg-white text-blue-700 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}>Semua</button>
          {TABS.map((tab, i) => (
            <button key={i} onClick={() => setActiveTab(i + 1)} className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${activeTab === i + 1 ? 'bg-white text-blue-700 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}>{tab}</button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Sekolah</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Jenis Sarpras</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Jumlah</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Kondisi Baik</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Rusak Ringan</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Rusak Sedang</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Rusak Berat</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Kebutuhan</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => (
                  <tr key={i} className="border-b border-zinc-100 hover:bg-zinc-50">
                    <td className="px-4 py-3 font-medium text-zinc-900">{d.sekolah}</td>
                    <td className="px-4 py-3">{d.jenis}</td>
                    <td className="px-4 py-3 font-semibold">{d.jumlah}</td>
                    <td className="px-4 py-3 text-green-700">{d.baik}</td>
                    <td className="px-4 py-3 text-yellow-700">{d.ringan}</td>
                    <td className="px-4 py-3 text-orange-700">{d.sedang}</td>
                    <td className="px-4 py-3 text-red-700">{d.berat}</td>
                    <td className="px-4 py-3">{d.kebutuhan}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:underline text-xs">Edit</button>
                        <button className="text-red-600 hover:underline text-xs">Hapus</button>
                      </div>
                    </td>
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
