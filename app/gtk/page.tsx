'use client'

import { useState } from 'react'
import AppShellTopbar from '@/components/layout/AppShellTopbar'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const TABS = ['Data Kepala Sekolah', 'Data Guru', 'Data Tenaga Kependidikan', 'Status Pegawai', 'Sertifikasi', 'Pendidikan Terakhir', 'Diklat/Pelatihan', 'Kebutuhan Guru', 'Mutasi Pegawai', 'BUP/Pensiun', 'Absensi Pegawai']

const EMPLOYEES = [
  { nama: 'Dr. H. Ahmad Fauzi, M.Pd.', nik: '3201010101900001', nip: '197001011998031002', nuptk: '1234567890123456', jabatan: 'Kepala Sekolah', unit: 'SD Negeri 1 Margaasih', status: 'PNS', sertifikasi: 'Sudah' },
  { nama: 'Siti Nurhaliza, S.Pd.', nik: '3201010102900002', nip: '197505102005012003', nuptk: '2345678901234567', jabatan: 'Guru Kelas', unit: 'SD Negeri 1 Margaasih', status: 'PNS', sertifikasi: 'Sudah' },
  { nama: 'Rudi Hermawan, S.Pd.I.', nik: '3201010103900003', nip: '198003152008011004', nuptk: '3456789012345678', jabatan: 'Guru PAI', unit: 'SD Negeri 2 Margaasih', status: 'PPPK', sertifikasi: 'Belum' },
  { nama: 'Dewi Sartika, S.Pd.', nik: '3201010104900004', nip: null, nuptk: '4567890123456789', jabatan: 'Guru Kelas', unit: 'SD Swasta Bina Bangsa', status: 'Non ASN', sertifikasi: 'Belum' },
  { nama: 'Asep Saepuloh, S.Pd., M.M.', nik: '3201010105900005', nip: '197812102006041005', nuptk: '5678901234567890', jabatan: 'Kepala Sekolah', unit: 'SD Negeri 3 Cangkuang', status: 'PNS', sertifikasi: 'Sudah' },
  { nama: 'Yuni Rahmawati, S.Pd.AUD.', nik: '3201010106900006', nip: null, nuptk: '6789012345678901', jabatan: 'Guru PAUD', unit: 'PAUD Melati Putih', status: 'PPPK', sertifikasi: 'Sudah' },
  { nama: 'Indra Gunawan, S.Pd.', nik: '3201010107900007', nip: '198507012010011006', nuptk: '7890123456789012', jabatan: 'Guru Penjaskes', unit: 'SD Negeri 1 Margaasih', status: 'PNS', sertifikasi: 'Belum' },
  { nama: 'Fitri Handayani, S.Pd.', nik: '3201010108900008', nip: null, nuptk: '8901234567890123', jabatan: 'Tenaga Administrasi', unit: 'SD Negeri 2 Margaasih', status: 'Non ASN', sertifikasi: 'Belum' },
]

export default function GtkPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(1)
  const [search, setSearch] = useState('')

  if (status === 'loading') return <div className="p-8 text-center text-zinc-500">Memuat...</div>
  if (!session) { router.push('/login'); return null }

  const filtered = EMPLOYEES.filter(e =>
    e.nama.toLowerCase().includes(search.toLowerCase()) ||
    e.nik.includes(search) ||
    (e.nip && e.nip.includes(search)) ||
    e.jabatan.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AppShellTopbar>
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-zinc-900">GTK / Kepegawaian</h1>

        <div className="flex flex-wrap gap-1 bg-zinc-100 p-1 rounded-lg">
          {TABS.map((tab, i) => (
            <button key={i} onClick={() => setActiveTab(i + 1)} className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${activeTab === i + 1 ? 'bg-white text-blue-700 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}>{tab}</button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama, NIK, NIP, NUPTK..." className="w-80 px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white" />
          <select className="px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
            <option value="">Semua Status</option>
            <option>PNS</option>
            <option>PPPK</option>
            <option>Non ASN</option>
          </select>
          <select className="px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
            <option value="">Semua Unit</option>
            <option>SD Negeri 1 Margaasih</option>
            <option>SD Negeri 2 Margaasih</option>
            <option>SD Negeri 3 Cangkuang</option>
            <option>SD Swasta Bina Bangsa</option>
            <option>PAUD Melati Putih</option>
          </select>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Nama</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">NIK</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">NIP</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">NUPTK</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Jabatan</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Unit Kerja</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Sertifikasi</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e, i) => (
                  <tr key={i} className="border-b border-zinc-100 hover:bg-zinc-50">
                    <td className="px-4 py-3 font-medium text-zinc-900">{e.nama}</td>
                    <td className="px-4 py-3">{e.nik}</td>
                    <td className="px-4 py-3">{e.nip || '-'}</td>
                    <td className="px-4 py-3">{e.nuptk}</td>
                    <td className="px-4 py-3">{e.jabatan}</td>
                    <td className="px-4 py-3">{e.unit}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${e.status === 'PNS' ? 'bg-green-100 text-green-700' : e.status === 'PPPK' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{e.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${e.sertifikasi === 'Sudah' ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-600'}`}>{e.sertifikasi}</span>
                    </td>
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

        {activeTab === 10 && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
            <h3 className="font-semibold text-zinc-900 mb-4">BUP / Pensiun</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-amber-700">3</p>
                <p className="text-sm text-amber-600">Pensiun Tahun Ini</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-700">5</p>
                <p className="text-sm text-blue-600">BUP 1-3 Tahun Lagi</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-700">12</p>
                <p className="text-sm text-green-600">PNS Aktif</p>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Nama</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">NIP</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">TMT Kerja</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Tanggal BUP</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { nama: 'Dr. H. Ahmad Fauzi, M.Pd.', nip: '197001011998031002', tmt: '01-03-1998', bup: '01-01-2027', ket: 'BUP 6 bulan lagi' },
                  { nama: 'Asep Saepuloh, S.Pd., M.M.', nip: '197812102006041005', tmt: '10-04-2006', bup: '10-12-2033', ket: 'BUP 7 tahun lagi' },
                  { nama: 'Siti Nurhaliza, S.Pd.', nip: '197505102005012003', tmt: '12-01-2005', bup: '10-05-2030', ket: 'BUP 4 tahun lagi' },
                ].map((d, i) => (
                  <tr key={i} className="border-b border-zinc-100">
                    <td className="px-4 py-3 font-medium">{d.nama}</td>
                    <td className="px-4 py-3">{d.nip}</td>
                    <td className="px-4 py-3">{d.tmt}</td>
                    <td className="px-4 py-3">{d.bup}</td>
                    <td className="px-4 py-3">{d.ket}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 11 && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
            <h3 className="font-semibold text-zinc-900 mb-4">Absensi Pegawai - Juni 2026</h3>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-700">98%</p>
                <p className="text-sm text-green-600">Kehadiran</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-red-700">1%</p>
                <p className="text-sm text-red-600">Tanpa Keterangan</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-700">0.5%</p>
                <p className="text-sm text-blue-600">Izin</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-amber-700">0.5%</p>
                <p className="text-sm text-amber-600">Sakit</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShellTopbar>
  )
}
