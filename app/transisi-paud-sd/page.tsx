'use client'

import { useState } from 'react'
import AppShellTopbar from '@/components/layout/AppShellTopbar'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const TABS = ['Calon Masuk SD', 'Anak Lanjut SD', 'SD Tujuan', 'Kesiapan Anak', 'Kegiatan Transisi', 'Rekap Transisi Kecamatan']

const CHILDREN = [
  { nama: 'Ahmad Fauzi Jr.', nik: '3201010106900001', paud: 'PAUD Melati Putih', usia: 7, sdTujuan: 'SD Negeri 1 Margaasih', melanjutkan: 'Sudah', sosial: 'Baik', emosional: 'Baik', motorik: 'Cukup', bahasa: 'Baik', catatan: 'Anak aktif dan percaya diri' },
  { nama: 'Siti Aisyah', nik: '3201010106900002', paud: 'PAUD Melati Putih', usia: 6, sdTujuan: 'SD Negeri 1 Margaasih', melanjutkan: 'Sudah', sosial: 'Baik', emosional: 'Baik', motorik: 'Baik', bahasa: 'Baik', catatan: 'Persiapan sudah matang' },
  { nama: 'Budi Santoso', nik: '3201010106900003', paud: 'PAUD Bintang Kecil', usia: 7, sdTujuan: 'SD Swasta Bina Bangsa', melanjutkan: 'Sudah', sosial: 'Cukup', emosional: 'Baik', motorik: 'Baik', bahasa: 'Cukup', catatan: 'Perlu pendampingan bahasa' },
  { nama: 'Rudi Hermawan Jr.', nik: '3201010106900005', paud: 'KB Ceria', usia: 7, sdTujuan: 'SD Negeri 3 Cangkuang', melanjutkan: 'Belum', sosial: 'Kurang', emosional: 'Cukup', motorik: 'Baik', bahasa: 'Cukup', catatan: 'Masih perlu adaptasi sosial' },
  { nama: 'Nia Kurnia', nik: '3201010106900006', paud: 'PAUD Melati Putih', usia: 6, sdTujuan: 'SD Negeri 2 Margaasih', melanjutkan: 'Sudah', sosial: 'Baik', emosional: 'Baik', motorik: 'Baik', bahasa: 'Baik', catatan: 'Siap masuk SD' },
]

export default function TransisiPaudSdPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(0)

  if (status === 'loading') return <div className="p-8 text-center text-zinc-500">Memuat...</div>
  if (!session) { router.push('/login'); return null }

  return (
    <AppShellTopbar>
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-zinc-900">Transisi PAUD-SD</h1>

        <div className="flex flex-wrap gap-1 bg-zinc-100 p-1 rounded-lg">
          {TABS.map((tab, i) => (
            <button key={i} onClick={() => setActiveTab(i)} className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${activeTab === i ? 'bg-white text-blue-700 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}>{tab}</button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-200 font-semibold text-zinc-900">{TABS[activeTab]}</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Nama Anak</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">NIK</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">PAUD Asal</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Usia</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">SD Tujuan</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Status Melanjutkan</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Sosial</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Emosional</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Motorik</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Bahasa</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Catatan Guru</th>
                </tr>
              </thead>
              <tbody>
                {CHILDREN.map((d, i) => (
                  <tr key={i} className="border-b border-zinc-100 hover:bg-zinc-50">
                    <td className="px-4 py-3 font-medium text-zinc-900">{d.nama}</td>
                    <td className="px-4 py-3">{d.nik}</td>
                    <td className="px-4 py-3">{d.paud}</td>
                    <td className="px-4 py-3">{d.usia} th</td>
                    <td className="px-4 py-3">{d.sdTujuan}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.melanjutkan === 'Sudah' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{d.melanjutkan}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.sosial === 'Baik' ? 'bg-green-100 text-green-700' : d.sosial === 'Cukup' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{d.sosial}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.emosional === 'Baik' ? 'bg-green-100 text-green-700' : d.emosional === 'Cukup' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{d.emosional}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.motorik === 'Baik' ? 'bg-green-100 text-green-700' : d.motorik === 'Cukup' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{d.motorik}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.bahasa === 'Baik' ? 'bg-green-100 text-green-700' : d.bahasa === 'Cukup' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{d.bahasa}</span>
                    </td>
                    <td className="px-4 py-3 max-w-[200px] truncate" title={d.catatan}>{d.catatan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {activeTab === 4 && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
            <h3 className="font-semibold text-zinc-900 mb-4">Kegiatan Transisi Terbaru</h3>
            <div className="space-y-3">
              {[
                { kegiatan: 'Kunjungan Anak PAUD ke SD Negeri 1 Margaasih', tgl: '10 Mei 2026', paud: 'PAUD Melati Putih', sd: 'SD Negeri 1 Margaasih', peserta: 12 },
                { kegiatan: 'Pengenalan Lingkungan Sekolah', tgl: '15 Mei 2026', paud: 'PAUD Bintang Kecil', sd: 'SD Swasta Bina Bangsa', peserta: 10 },
                { kegiatan: 'Workshop Transisi bagi Orang Tua', tgl: '20 Mei 2026', paud: 'KB Ceria', sd: 'SD Negeri 3 Cangkuang', peserta: 25 },
              ].map((k, i) => (
                <div key={i} className="border border-zinc-200 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-zinc-900">{k.kegiatan}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{k.tgl} | {k.paud} &rarr; {k.sd}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{k.peserta} peserta</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 5 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-zinc-200 rounded-xl p-5 text-center">
              <p className="text-3xl font-bold text-blue-700">4</p>
              <p className="text-sm text-zinc-600">Sudah Melanjutkan</p>
            </div>
            <div className="bg-white border border-zinc-200 rounded-xl p-5 text-center">
              <p className="text-3xl font-bold text-amber-700">1</p>
              <p className="text-sm text-zinc-600">Belum Melanjutkan</p>
            </div>
            <div className="bg-white border border-zinc-200 rounded-xl p-5 text-center">
              <p className="text-3xl font-bold text-green-700">80%</p>
              <p className="text-sm text-zinc-600">Tingkat Kesiapan</p>
            </div>
          </div>
        )}
      </div>
    </AppShellTopbar>
  )
}
