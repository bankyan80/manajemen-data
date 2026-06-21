'use client'

import { useState } from 'react'
import AppShellTopbar from '@/components/layout/AppShellTopbar'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const TABS = ['Manajemen User', 'Role & Hak Akses', 'Master Sekolah/Lembaga', 'Data Kecamatan', 'Tahun Pelajaran', 'Periode Laporan', 'Template Laporan', 'Koneksi Google Drive', 'Koneksi Google Spreadsheet', 'Backup Data', 'Log Aktivitas']

const USERS = [
  { nama: 'Admin Kecamatan', email: 'admin@kecamatan.go.id', role: 'Admin Kecamatan', sekolah: '-', status: 'Aktif' },
  { nama: 'Operator SDN 1', email: 'operator1@sekolah.id', role: 'Operator Sekolah', sekolah: 'SD Negeri 1 Margaasih', status: 'Aktif' },
  { nama: 'Operator SDN 2', email: 'operator2@sekolah.id', role: 'Operator Sekolah', sekolah: 'SD Negeri 2 Margaasih', status: 'Aktif' },
  { nama: 'Operator PAUD', email: 'operatorpaud@sekolah.id', role: 'Operator Sekolah', sekolah: 'PAUD Melati Putih', status: 'Aktif' },
  { nama: 'Pegawai SDN 1', email: 'pegawai1@sekolah.id', role: 'Pegawai', sekolah: 'SD Negeri 1 Margaasih', status: 'Nonaktif' },
  { nama: 'Pegawai SDN 3', email: 'pegawai3@sekolah.id', role: 'Pegawai', sekolah: 'SD Negeri 3 Cangkuang', status: 'Aktif' },
]

const SEKOLAH_MASTER = [
  { nama: 'SD Negeri 1 Margaasih', npsn: '20245678', jenjang: 'SD', status: 'NEGERI', desa: 'Margaasih', kecamatan: 'Margaasih' },
  { nama: 'SD Negeri 2 Margaasih', npsn: '20245679', jenjang: 'SD', status: 'NEGERI', desa: 'Margaasih', kecamatan: 'Margaasih' },
  { nama: 'SD Negeri 3 Cangkuang', npsn: '20245681', jenjang: 'SD', status: 'NEGERI', desa: 'Cangkuang', kecamatan: 'Cangkuang' },
  { nama: 'SD Swasta Bina Bangsa', npsn: '20245680', jenjang: 'SD', status: 'SWASTA', desa: 'Margaasih', kecamatan: 'Margaasih' },
  { nama: 'SD Swasta Al-Ikhlas', npsn: '20245682', jenjang: 'SD', status: 'SWASTA', desa: 'Cibeureum', kecamatan: 'Cangkuang' },
  { nama: 'PAUD Melati Putih', npsn: '69987654', jenjang: 'PAUD', status: 'SWASTA', desa: 'Margaasih', kecamatan: 'Margaasih' },
  { nama: 'PAUD Bintang Kecil', npsn: '69987655', jenjang: 'PAUD', status: 'SWASTA', desa: 'Cangkuang', kecamatan: 'Cangkuang' },
  { nama: 'KB Ceria', npsn: '69987656', jenjang: 'PAUD', status: 'SWASTA', desa: 'Margaasih', kecamatan: 'Margaasih' },
]

const LOGS = [
  { user: 'Admin Kecamatan', aksi: 'Login', tabel: '-', deskripsi: 'Admin login ke sistem', waktu: '21-06-2026 08:00:00' },
  { user: 'Operator SDN 1', aksi: 'Create', tabel: 'StudentRecap', deskripsi: 'Menambah data kesiswaan SD Negeri 1 Margaasih', waktu: '20-06-2026 09:15:00' },
  { user: 'Admin Kecamatan', aksi: 'Update', tabel: 'Report', deskripsi: 'Verifikasi laporan SD Negeri 1 Margaasih Januari 2026', waktu: '20-06-2026 10:30:00' },
  { user: 'Admin Kecamatan', aksi: 'Update', tabel: 'EmployeeDocument', deskripsi: 'Verifikasi dokumen KTP Ahmad Fauzi', waktu: '19-06-2026 11:00:00' },
  { user: 'Operator SDN 2', aksi: 'Create', tabel: 'Student', deskripsi: 'Menambah data siswa baru', waktu: '19-06-2026 13:45:00' },
  { user: 'Operator PAUD', aksi: 'Create', tabel: 'School', deskripsi: 'Menambah data sekolah PAUD Bintang Kecil', waktu: '18-06-2026 08:20:00' },
  { user: 'Pegawai SDN 1', aksi: 'Login', tabel: '-', deskripsi: 'Pegawai login ke sistem', waktu: '18-06-2026 07:55:00' },
  { user: 'Admin Kecamatan', aksi: 'Delete', tabel: 'Student', deskripsi: 'Menghapus data siswa tidak valid', waktu: '17-06-2026 14:00:00' },
  { user: 'Pegawai SDN 3', aksi: 'Upload', tabel: 'EmployeeDocument', deskripsi: 'Upload dokumen Ijazah S1', waktu: '17-06-2026 09:10:00' },
  { user: 'Admin Kecamatan', aksi: 'Update', tabel: 'Setting', deskripsi: 'Mengubah periode laporan', waktu: '16-06-2026 15:30:00' },
  { user: 'Operator SDN 1', aksi: 'Export', tabel: 'Report', deskripsi: 'Export laporan PDF SD Negeri 1 Margaasih', waktu: '15-06-2026 11:20:00' },
  { user: 'Admin Kecamatan', aksi: 'Backup', tabel: 'System', deskripsi: 'Melakukan backup database', waktu: '15-06-2026 02:00:00' },
]

export default function PengaturanPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(0)

  if (status === 'loading') return <div className="p-8 text-center text-zinc-500">Memuat...</div>
  if (!session) { router.push('/login'); return null }

  return (
    <AppShellTopbar>
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-zinc-900">Pengaturan</h1>

        <div className="flex flex-wrap gap-1 bg-zinc-100 p-1 rounded-lg">
          {TABS.map((tab, i) => (
            <button key={i} onClick={() => setActiveTab(i)} className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${activeTab === i ? 'bg-white text-blue-700 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}>{tab}</button>
          ))}
        </div>

        {activeTab === 0 && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">+ Tambah User</button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200">
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Nama</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Email</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Role</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Sekolah</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Status</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {USERS.map((u, i) => (
                      <tr key={i} className="border-b border-zinc-100 hover:bg-zinc-50">
                        <td className="px-4 py-3 font-medium text-zinc-900">{u.nama}</td>
                        <td className="px-4 py-3">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.role === 'Admin Kecamatan' ? 'bg-purple-100 text-purple-700' : u.role === 'Operator Sekolah' ? 'bg-blue-100 text-blue-700' : 'bg-zinc-100 text-zinc-700'}`}>{u.role}</span>
                        </td>
                        <td className="px-4 py-3">{u.sekolah}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.status === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{u.status}</span>
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
          </div>
        )}

        {activeTab === 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
            <h3 className="font-semibold text-zinc-900 mb-4">Role &amp; Hak Akses</h3>
            <div className="space-y-3">
              {[
                { role: 'Admin Kecamatan', desc: 'Akses penuh ke semua fitur dan data seluruh kecamatan' },
                { role: 'Operator Sekolah', desc: 'Akses data sekolah sendiri, input laporan, upload dokumen' },
                { role: 'Pegawai', desc: 'Akses data diri sendiri, upload dokumen pribadi' },
              ].map((r, i) => (
                <div key={i} className="border border-zinc-200 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-zinc-900">{r.role}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{r.desc}</p>
                  </div>
                  <button className="text-blue-600 hover:underline text-xs">Edit Izin</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 2 && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-200 flex items-center justify-between">
              <span className="font-semibold text-zinc-900">Master Sekolah / Lembaga</span>
              <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium">+ Tambah</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200">
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Nama</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">NPSN</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Jenjang</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Desa</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Kecamatan</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {SEKOLAH_MASTER.map((s, i) => (
                    <tr key={i} className="border-b border-zinc-100 hover:bg-zinc-50">
                      <td className="px-4 py-3 font-medium text-zinc-900">{s.nama}</td>
                      <td className="px-4 py-3">{s.npsn}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.jenjang === 'SD' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{s.jenjang}</span>
                      </td>
                      <td className="px-4 py-3">{s.status}</td>
                      <td className="px-4 py-3">{s.desa}</td>
                      <td className="px-4 py-3">{s.kecamatan}</td>
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
        )}

        {activeTab === 3 && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
            <h3 className="font-semibold text-zinc-900 mb-4">Data Kecamatan</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-zinc-500">Nama Kecamatan</label>
                <input type="text" defaultValue="Margaasih" className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm mt-1 bg-white" />
              </div>
              <div>
                <label className="text-sm text-zinc-500">Kabupaten</label>
                <input type="text" defaultValue="Bandung" className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm mt-1 bg-white" />
              </div>
              <div>
                <label className="text-sm text-zinc-500">Provinsi</label>
                <input type="text" defaultValue="Jawa Barat" className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm mt-1 bg-white" />
              </div>
              <div>
                <label className="text-sm text-zinc-500">Kode Pos</label>
                <input type="text" defaultValue="40218" className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm mt-1 bg-white" />
              </div>
            </div>
            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">Simpan</button>
          </div>
        )}

        {activeTab === 4 && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
            <h3 className="font-semibold text-zinc-900 mb-4">Tahun Pelajaran</h3>
            <div className="flex items-center gap-4 mb-4">
              <div>
                <label className="text-sm text-zinc-500">Tahun Pelajaran Aktif</label>
                <select className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm mt-1 bg-white">
                  <option>2025/2026</option>
                  <option>2024/2025</option>
                </select>
              </div>
              <button className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">Simpan</button>
            </div>
            <div className="border-t border-zinc-200 pt-4">
              <p className="text-sm text-zinc-500 mb-2">Daftar Tahun Pelajaran</p>
              <div className="flex flex-wrap gap-2">
                {['2025/2026', '2024/2025', '2023/2024'].map(t => (
                  <span key={t} className="px-3 py-1 border border-zinc-200 rounded-full text-sm">{t}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 5 && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
            <h3 className="font-semibold text-zinc-900 mb-4">Periode Laporan</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-zinc-500">Periode Awal</label>
                <input type="text" defaultValue="Januari 2026" className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm mt-1 bg-white" />
              </div>
              <div>
                <label className="text-sm text-zinc-500">Periode Akhir</label>
                <input type="text" defaultValue="Desember 2026" className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm mt-1 bg-white" />
              </div>
              <div>
                <label className="text-sm text-zinc-500">Batas Submit Laporan</label>
                <input type="text" defaultValue="Tanggal 5 setiap bulan" className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm mt-1 bg-white" />
              </div>
              <div>
                <label className="text-sm text-zinc-500">Semester Aktif</label>
                <select className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm mt-1 bg-white">
                  <option>Ganjil</option>
                  <option>Genap</option>
                </select>
              </div>
            </div>
            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">Simpan</button>
          </div>
        )}

        {activeTab === 6 && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
            <h3 className="font-semibold text-zinc-900 mb-4">Template Laporan</h3>
            <div className="space-y-3">
              {[
                { nama: 'Template Laporan Bulanan SD', format: 'DOCX', ukuran: '45 KB' },
                { nama: 'Template Laporan Bulanan PAUD', format: 'DOCX', ukuran: '42 KB' },
                { nama: 'Template Rekap Kecamatan', format: 'XLSX', ukuran: '68 KB' },
              ].map((t, i) => (
                <div key={i} className="border border-zinc-200 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700">{t.format}</span>
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{t.nama}</p>
                      <p className="text-xs text-zinc-500">{t.ukuran}</p>
                    </div>
                  </div>
                  <button className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-xs font-medium">Download</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 7 && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
            <h3 className="font-semibold text-zinc-900 mb-4">Koneksi Google Drive</h3>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm text-green-700">Terhubung</span>
              <span className="text-xs text-zinc-400">(admin@kecamatan.go.id)</span>
            </div>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">Putuskan Koneksi</button>
          </div>
        )}

        {activeTab === 8 && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
            <h3 className="font-semibold text-zinc-900 mb-4">Koneksi Google Spreadsheet</h3>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm text-green-700">Terhubung</span>
              <span className="text-xs text-zinc-400">(Spreadsheet: Rekap Kecamatan Margaasih)</span>
            </div>
            <div className="space-y-2 mb-4">
              <div className="border border-zinc-200 rounded-lg p-3 text-sm">
                <span className="text-zinc-500">Spreadsheet ID: </span>
                <span className="text-zinc-900">1ABCxyz123DEF456GHI789JKL</span>
              </div>
            </div>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">Putuskan Koneksi</button>
          </div>
        )}

        {activeTab === 9 && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
            <h3 className="font-semibold text-zinc-900 mb-4">Backup Data</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="border border-zinc-200 rounded-lg p-4">
                <p className="text-sm text-zinc-500">Backup Terakhir</p>
                <p className="font-semibold text-zinc-900 mt-1">15 Juni 2026, 02:00 AM</p>
                <p className="text-xs text-zinc-500">Ukuran: 156 MB</p>
              </div>
              <div className="border border-zinc-200 rounded-lg p-4">
                <p className="text-sm text-zinc-500">Jadwal Backup</p>
                <p className="font-semibold text-zinc-900 mt-1">Setiap Hari Minggu, 02:00 AM</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">Backup Sekarang</button>
          </div>
        )}

        {activeTab === 10 && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-200 flex items-center justify-between">
              <span className="font-semibold text-zinc-900">Log Aktivitas</span>
              <div className="flex gap-2">
                <input type="text" placeholder="Cari aktivitas..." className="px-3 py-1.5 border border-zinc-300 rounded-lg text-xs bg-white" />
                <button className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-xs font-medium">Filter</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200">
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">User</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Aksi</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Tabel</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Deskripsi</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  {LOGS.map((l, i) => (
                    <tr key={i} className="border-b border-zinc-100 hover:bg-zinc-50">
                      <td className="px-4 py-3 font-medium text-zinc-900">{l.user}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${l.aksi === 'Login' ? 'bg-blue-100 text-blue-700' : l.aksi === 'Create' ? 'bg-green-100 text-green-700' : l.aksi === 'Update' ? 'bg-yellow-100 text-yellow-700' : l.aksi === 'Delete' ? 'bg-red-100 text-red-700' : l.aksi === 'Backup' ? 'bg-purple-100 text-purple-700' : 'bg-zinc-100 text-zinc-700'}`}>{l.aksi}</span>
                      </td>
                      <td className="px-4 py-3">{l.tabel}</td>
                      <td className="px-4 py-3 max-w-[300px] truncate" title={l.deskripsi}>{l.deskripsi}</td>
                      <td className="px-4 py-3 text-xs text-zinc-500">{l.waktu}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShellTopbar>
  )
}
