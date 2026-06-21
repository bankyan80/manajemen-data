'use client'

import { useState } from 'react'
import AppShellTopbar from '@/components/layout/AppShellTopbar'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const DATA = [
  { nama: 'SD Negeri 1 Margaasih', npsn: '20245678', jenjang: 'SD', status: 'NEGERI', alamat: 'Jl. Raya Margaasih No. 1', desa: 'Margaasih', kecamatan: 'Margaasih', kepala: 'Dr. H. Ahmad Fauzi, M.Pd.', akreditasi: 'A', izin: '421/1/SK/I/1998' },
  { nama: 'SD Negeri 2 Margaasih', npsn: '20245679', jenjang: 'SD', status: 'NEGERI', alamat: 'Jl. Cikembang No. 10', desa: 'Margaasih', kecamatan: 'Margaasih', kepala: 'Hj. Euis Nuraeni, S.Pd.', akreditasi: 'A', izin: '421/2/SK/I/2000' },
  { nama: 'SD Negeri 3 Cangkuang', npsn: '20245681', jenjang: 'SD', status: 'NEGERI', alamat: 'Jl. Cangkuang No. 5', desa: 'Cangkuang', kecamatan: 'Cangkuang', kepala: 'Asep Saepuloh, S.Pd., M.M.', akreditasi: 'B', izin: '421/3/SK/II/2005' },
  { nama: 'SD Swasta Bina Bangsa', npsn: '20245680', jenjang: 'SD', status: 'SWASTA', alamat: 'Jl. Pendidikan No. 15', desa: 'Margaasih', kecamatan: 'Margaasih', kepala: 'H. Rahmat Hidayat, S.Pd.', akreditasi: 'A', izin: '421/4/SK/III/2010' },
  { nama: 'SD Swasta Al-Ikhlas', npsn: '20245682', jenjang: 'SD', status: 'SWASTA', alamat: 'Jl. Masjid No. 8', desa: 'Cibeureum', kecamatan: 'Cangkuang', kepala: 'Ust. Ahmad Sanusi, S.Pd.I.', akreditasi: 'B', izin: '421/5/SK/I/2012' },
  { nama: 'PAUD Melati Putih', npsn: '69987654', jenjang: 'PAUD', status: 'SWASTA', alamat: 'Jl. Bunga No. 3', desa: 'Margaasih', kecamatan: 'Margaasih', kepala: 'Yuni Rahmawati, S.Pd.AUD.', akreditasi: 'B', izin: '503/1/SK/VI/2015' },
  { nama: 'PAUD Bintang Kecil', npsn: '69987655', jenjang: 'PAUD', status: 'SWASTA', alamat: 'Jl. Mawar No. 1', desa: 'Cangkuang', kecamatan: 'Cangkuang', kepala: 'Teti Suhartini, S.Pd.AUD.', akreditasi: 'B', izin: '503/2/SK/VI/2016' },
]

export default function KelembagaanPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [filterJenjang, setFilterJenjang] = useState('')

  if (status === 'loading') return <div className="p-8 text-center text-zinc-500">Memuat...</div>
  if (!session) { router.push('/login'); return null }

  const filtered = filterJenjang ? DATA.filter(d => d.jenjang === filterJenjang) : DATA

  return (
    <AppShellTopbar>
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-zinc-900">Kelembagaan</h1>

        <div className="flex items-center gap-4">
          <select value={filterJenjang} onChange={e => setFilterJenjang(e.target.value)} className="px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
            <option value="">Semua Jenjang</option>
            <option value="SD">SD</option>
            <option value="PAUD">PAUD</option>
          </select>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">Tambah Lembaga</button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Nama</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">NPSN</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Jenjang</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Alamat</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Desa</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Kepala</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Akreditasi</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Izin Operasional</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => (
                  <tr key={i} className="border-b border-zinc-100 hover:bg-zinc-50">
                    <td className="px-4 py-3 font-medium text-zinc-900">{d.nama}</td>
                    <td className="px-4 py-3">{d.npsn}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.jenjang === 'SD' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{d.jenjang}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.status === 'NEGERI' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{d.status}</span>
                    </td>
                    <td className="px-4 py-3">{d.alamat}</td>
                    <td className="px-4 py-3">{d.desa}</td>
                    <td className="px-4 py-3">{d.kepala}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${d.akreditasi === 'A' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{d.akreditasi}</span>
                    </td>
                    <td className="px-4 py-3">{d.izin}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:underline text-xs">Detail</button>
                        <button className="text-amber-600 hover:underline text-xs">Edit</button>
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
