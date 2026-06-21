'use client'

import { useState } from 'react'
import AppShellTopbar from '@/components/layout/AppShellTopbar'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const TABS = ['Kegiatan SD', 'Kegiatan PAUD', 'OSN', 'O2SN', 'FLS2N', 'Gebyar PAUD', 'Parenting', 'Prestasi', 'Galeri Foto', 'Berita Kegiatan']

const ACTIVITIES = [
  { judul: 'Peringatan Hari Pendidikan Nasional', tgl: '2 Mei 2026', sekolah: 'SD Negeri 1 Margaasih', peserta: 180, deskripsi: 'Upacara bendera dan lomba antar kelas memperingati Hardiknas', kategori: 'SD' },
  { judul: 'Karya Wisata ke Museum Geologi', tgl: '15 Mei 2026', sekolah: 'SD Negeri 2 Margaasih', peserta: 60, deskripsi: 'Kunjungan edukatif siswa kelas V ke Museum Geologi Bandung', kategori: 'SD' },
  { judul: 'Lomba Mewarnai Tingkat PAUD', tgl: '20 Mei 2026', sekolah: 'PAUD Melati Putih', peserta: 22, deskripsi: 'Lomba mewarnai dalam rangka HUT Kecamatan', kategori: 'PAUD' },
  { judul: 'Bazar dan Pentas Seni', tgl: '25 Mei 2026', sekolah: 'SD Swasta Bina Bangsa', peserta: 120, deskripsi: 'Kegiatan P5 dengan tema kearifan lokal', kategori: 'SD' },
  { judul: 'Senam Sehat Anak PAUD', tgl: '28 Mei 2026', sekolah: 'PAUD Bintang Kecil', peserta: 18, deskripsi: 'Senam pagi bersama orang tua dan guru PAUD', kategori: 'PAUD' },
  { judul: 'Sosialisasi Anti Bullying', tgl: '1 Juni 2026', sekolah: 'SD Negeri 3 Cangkuang', peserta: 156, deskripsi: 'Sosialisasi pencegahan bullying di lingkungan sekolah', kategori: 'SD' },
]

const PRESTASI = [
  { siswa: 'Ahmad Fauzi Jr.', sekolah: 'SD Negeri 1 Margaasih', prestasi: 'Juara 1 OSN Matematika Tingkat Kecamatan', tingkat: 'Kecamatan', tahun: 2026, medali: 'Emas' },
  { siswa: 'Siti Aisyah', sekolah: 'SD Negeri 1 Margaasih', prestasi: 'Juara 2 O2SN Senam', tingkat: 'Kabupaten', tahun: 2026, medali: 'Perak' },
  { siswa: 'Budi Santoso', sekolah: 'SD Swasta Bina Bangsa', prestasi: 'Juara 1 FLS2N Gambar Bercerita', tingkat: 'Kecamatan', tahun: 2026, medali: 'Emas' },
  { siswa: 'Nia Kurnia', sekolah: 'SD Negeri 2 Margaasih', prestasi: 'Juara 3 OSN IPA', tingkat: 'Kecamatan', tahun: 2025, medali: 'Perunggu' },
  { siswa: 'Dewi Lestari', sekolah: 'PAUD Melati Putih', prestasi: 'Harapan 1 Lomba Mewarnai', tingkat: 'Kecamatan', tahun: 2026, medali: 'Harapan' },
]

export default function KegiatanPrestasiPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(0)

  if (status === 'loading') return <div className="p-8 text-center text-zinc-500">Memuat...</div>
  if (!session) { router.push('/login'); return null }

  const filtered = activeTab === 0 ? ACTIVITIES.filter(a => a.kategori === 'SD') : activeTab === 1 ? ACTIVITIES.filter(a => a.kategori === 'PAUD') : ACTIVITIES

  return (
    <AppShellTopbar>
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-zinc-900">Kegiatan &amp; Prestasi</h1>

        <div className="flex flex-wrap gap-1 bg-zinc-100 p-1 rounded-lg">
          {TABS.map((tab, i) => (
            <button key={i} onClick={() => setActiveTab(i)} className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${activeTab === i ? 'bg-white text-blue-700 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}>{tab}</button>
          ))}
        </div>

        {activeTab <= 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((a, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-zinc-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-zinc-400">{a.tgl}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${a.kategori === 'SD' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{a.kategori}</span>
                </div>
                <h3 className="font-semibold text-zinc-900 mb-1">{a.judul}</h3>
                <p className="text-sm text-zinc-600 mb-3">{a.deskripsi}</p>
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>{a.sekolah}</span>
                  <span>{a.peserta} peserta</span>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-3 text-center py-8 text-zinc-500">Belum ada data kegiatan.</div>
            )}
          </div>
        )}

        {activeTab === 7 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: 'Emas', count: 2, color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
                { label: 'Perak', count: 1, color: 'bg-slate-100 text-slate-700 border-slate-200' },
                { label: 'Perunggu', count: 1, color: 'bg-orange-100 text-orange-700 border-orange-200' },
                { label: 'Harapan', count: 1, color: 'bg-blue-100 text-blue-700 border-blue-200' },
                { label: 'Total', count: 5, color: 'bg-green-100 text-green-700 border-green-200' },
              ].map((m, i) => (
                <div key={i} className={`${m.color} border rounded-xl p-5 text-center`}>
                  <p className="text-3xl font-bold">{m.count}</p>
                  <p className="text-sm mt-1">{m.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200">
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Siswa</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Sekolah</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Prestasi</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Tingkat</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Tahun</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Medali</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PRESTASI.map((p, i) => (
                      <tr key={i} className="border-b border-zinc-100 hover:bg-zinc-50">
                        <td className="px-4 py-3 font-medium text-zinc-900">{p.siswa}</td>
                        <td className="px-4 py-3">{p.sekolah}</td>
                        <td className="px-4 py-3">{p.prestasi}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{p.tingkat}</span>
                        </td>
                        <td className="px-4 py-3">{p.tahun}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${p.medali === 'Emas' ? 'bg-yellow-100 text-yellow-700' : p.medali === 'Perak' ? 'bg-slate-100 text-slate-700' : p.medali === 'Perunggu' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{p.medali}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab >= 2 && activeTab <= 6 && activeTab !== 7 && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-8 text-center">
            <p className="text-zinc-500">Data {TABS[activeTab]} belum tersedia. Silakan tambah data kegiatan.</p>
          </div>
        )}

        {activeTab === 8 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { judul: 'Upacara Hardiknas 2026', file: 'hardiknas2026.jpg' },
              { judul: 'Karya Wisata Museum Geologi', file: 'karyawisata.jpg' },
              { judul: 'Lomba Mewarnai PAUD', file: 'lombamewarnai.jpg' },
              { judul: 'Bazar P5 Bina Bangsa', file: 'bazar.jpg' },
              { judul: 'Senam Sehat PAUD', file: 'senam.jpg' },
              { judul: 'Sosialisasi Anti Bullying', file: 'antibullying.jpg' },
            ].map((f, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                <div className="h-40 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                  <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-zinc-900">{f.judul}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{f.file}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 9 && (
          <div className="space-y-4">
            {[
              { judul: 'SD Negeri 1 Margaasih Raih Juara 1 OSN Tingkat Kecamatan', tgl: '15 Mei 2026', isi: 'Ahmad Fauzi Jr., siswa kelas V SD Negeri 1 Margaasih berhasil meraih juara 1 OSN Matematika tingkat Kecamatan Margaasih.' },
              { judul: 'Kegiatan P5 Bazar dan Pentas Seni Sukses Digelar', tgl: '25 Mei 2026', isi: 'SD Swasta Bina Bangsa menyelenggarakan kegiatan P5 dengan tema kearifan lokal yang diikuti oleh seluruh siswa.' },
            ].map((b, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-zinc-200 p-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-zinc-400">{b.tgl}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Berita</span>
                </div>
                <h3 className="font-semibold text-zinc-900 mb-1">{b.judul}</h3>
                <p className="text-sm text-zinc-600">{b.isi}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShellTopbar>
  )
}
