'use client'

import { useState } from 'react'
import AppShellTopbar from '@/components/layout/AppShellTopbar'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const TABS = ['Daya Tampung', 'Data Pendaftar', 'Data Diterima', 'Jalur Domisili', 'Jalur Afirmasi', 'Jalur Mutasi', 'Rekap Usia', 'Kekurangan/Kelebihan Kuota', 'Pengumuman', 'Daftar Ulang']

const STUDENTS = [
  { tahun: '2025/2026', sekolah: 'SD Negeri 1 Margaasih', nik: '3201010106900001', nama: 'Ahmad Fauzi Jr.', tempat: 'Bandung', tgl: '15-06-2019', usia: 7, jk: 'L', ortua: 'Dr. H. Ahmad Fauzi, M.Pd.', alamat: 'Jl. Raya Margaasih No. 1', desa: 'Margaasih', jalur: 'Domisili', status: 'Diterima' },
  { tahun: '2025/2026', sekolah: 'SD Negeri 1 Margaasih', nik: '3201010106900002', nama: 'Siti Aisyah', tempat: 'Bandung', tgl: '20-07-2019', usia: 6, jk: 'P', ortua: 'Siti Nurhaliza, S.Pd.', alamat: 'Jl. Cikembang No. 10', desa: 'Margaasih', jalur: 'Domisili', status: 'Diterima' },
  { tahun: '2025/2026', sekolah: 'SD Swasta Bina Bangsa', nik: '3201010106900003', nama: 'Budi Santoso', tempat: 'Jakarta', tgl: '10-05-2019', usia: 7, jk: 'L', ortua: 'H. Rahmat Hidayat, S.Pd.', alamat: 'Jl. Pendidikan No. 15', desa: 'Margaasih', jalur: 'Afirmasi', status: 'Diterima' },
  { tahun: '2025/2026', sekolah: 'SD Negeri 2 Margaasih', nik: '3201010106900004', nama: 'Dewi Lestari', tempat: 'Bandung', tgl: '05-08-2020', usia: 5, jk: 'P', ortua: 'Euis Nuraeni', alamat: 'Jl. Mawar No. 2', desa: 'Margaasih', jalur: 'Domisili', status: 'Menunggu' },
  { tahun: '2025/2026', sekolah: 'SD Negeri 3 Cangkuang', nik: '3201010106900005', nama: 'Rudi Hermawan Jr.', tempat: 'Cimahi', tgl: '12-03-2019', usia: 7, jk: 'L', ortua: 'Rudi Hermawan, S.Pd.I.', alamat: 'Jl. Cangkuang No. 5', desa: 'Cangkuang', jalur: 'Mutasi', status: 'Diterima' },
]

export default function SpmbPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(1)
  const [filterTahun, setFilterTahun] = useState('2025/2026')
  const [filterSekolah, setFilterSekolah] = useState('')
  const [filterJalur, setFilterJalur] = useState('')

  if (status === 'loading') return <div className="p-8 text-center text-zinc-500">Memuat...</div>
  if (!session) { router.push('/login'); return null }

  const filtered = STUDENTS.filter(d => {
    if (filterTahun && d.tahun !== filterTahun) return false
    if (filterSekolah && d.sekolah !== filterSekolah) return false
    if (filterJalur && d.jalur !== filterJalur) return false
    return true
  })

  return (
    <AppShellTopbar>
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-zinc-900">SPMB / PPDB</h1>

        <div className="flex flex-wrap gap-1 bg-zinc-100 p-1 rounded-lg">
          {TABS.map((tab, i) => (
            <button key={i} onClick={() => setActiveTab(i)} className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${activeTab === i ? 'bg-white text-blue-700 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}>{tab}</button>
          ))}
        </div>

        {activeTab === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-5">
              <p className="text-sm text-zinc-500">SD Negeri 1 Margaasih</p>
              <p className="text-2xl font-bold text-zinc-900 mt-1">60</p>
              <p className="text-xs text-green-700 mt-1">Daya Tampung 2 rombel</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-5">
              <p className="text-sm text-zinc-500">SD Negeri 2 Margaasih</p>
              <p className="text-2xl font-bold text-zinc-900 mt-1">30</p>
              <p className="text-xs text-green-700 mt-1">Daya Tampung 1 rombel</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-5">
              <p className="text-sm text-zinc-500">SD Swasta Bina Bangsa</p>
              <p className="text-2xl font-bold text-zinc-900 mt-1">90</p>
              <p className="text-xs text-green-700 mt-1">Daya Tampung 3 rombel</p>
            </div>
          </div>
        )}

        {activeTab >= 1 && activeTab <= 5 && (
          <>
            <div className="flex gap-4 items-center flex-wrap">
              <select value={filterTahun} onChange={e => setFilterTahun(e.target.value)} className="px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
                <option value="">Semua Tahun</option>
                <option>2025/2026</option>
                <option>2024/2025</option>
              </select>
              <select value={filterSekolah} onChange={e => setFilterSekolah(e.target.value)} className="px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
                <option value="">Semua Sekolah</option>
                <option>SD Negeri 1 Margaasih</option>
                <option>SD Negeri 2 Margaasih</option>
                <option>SD Negeri 3 Cangkuang</option>
                <option>SD Swasta Bina Bangsa</option>
              </select>
              <select value={filterJalur} onChange={e => setFilterJalur(e.target.value)} className="px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
                <option value="">Semua Jalur</option>
                <option>Domisili</option>
                <option>Afirmasi</option>
                <option>Mutasi</option>
              </select>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">+ Tambah Pendaftar</button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200">
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Tahun Pelajaran</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Nama Sekolah</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">NIK</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Nama Siswa</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Tempat Lahir</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Tanggal Lahir</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Usia</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">JK</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Orang Tua</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Alamat</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Desa</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Jalur</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Status</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((d, i) => (
                      <tr key={i} className="border-b border-zinc-100 hover:bg-zinc-50">
                        <td className="px-4 py-3">{d.tahun}</td>
                        <td className="px-4 py-3 font-medium">{d.sekolah}</td>
                        <td className="px-4 py-3">{d.nik}</td>
                        <td className="px-4 py-3 text-zinc-900 font-medium">{d.nama}</td>
                        <td className="px-4 py-3">{d.tempat}</td>
                        <td className="px-4 py-3">{d.tgl}</td>
                        <td className="px-4 py-3">{d.usia}</td>
                        <td className="px-4 py-3">{d.jk}</td>
                        <td className="px-4 py-3">{d.ortua}</td>
                        <td className="px-4 py-3">{d.alamat}</td>
                        <td className="px-4 py-3">{d.desa}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{d.jalur}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.status === 'Diterima' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{d.status}</span>
                        </td>
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
          </>
        )}

        {activeTab === 6 && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
            <h3 className="font-semibold text-zinc-900 mb-4">Rekap Usia Calon Siswa</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="border border-zinc-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-700">5 tahun</p>
                <p className="text-sm text-zinc-500">1 calon siswa</p>
              </div>
              <div className="border border-zinc-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-700">6 tahun</p>
                <p className="text-sm text-zinc-500">1 calon siswa</p>
              </div>
              <div className="border border-zinc-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-amber-700">7 tahun</p>
                <p className="text-sm text-zinc-500">3 calon siswa</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 7 && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
            <h3 className="font-semibold text-zinc-900 mb-4">Kekurangan / Kelebihan Kuota</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Sekolah</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Daya Tampung</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Pendaftar</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Kelebihan/Kekurangan</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { sekolah: 'SD Negeri 1 Margaasih', tampung: 60, pendaftar: 2 },
                  { sekolah: 'SD Negeri 2 Margaasih', tampung: 30, pendaftar: 1 },
                  { sekolah: 'SD Negeri 3 Cangkuang', tampung: 60, pendaftar: 1 },
                  { sekolah: 'SD Swasta Bina Bangsa', tampung: 90, pendaftar: 1 },
                ].map((d, i) => {
                  const selisih = d.tampung - d.pendaftar
                  return (
                    <tr key={i} className="border-b border-zinc-100">
                      <td className="px-4 py-3 font-medium">{d.sekolah}</td>
                      <td className="px-4 py-3">{d.tampung}</td>
                      <td className="px-4 py-3">{d.pendaftar}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${selisih > 0 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                          {selisih > 0 ? `Kekurangan ${selisih} kursi` : `Kelebihan ${Math.abs(selisih)} pendaftar`}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShellTopbar>
  )
}
