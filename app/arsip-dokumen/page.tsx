'use client'

import { useState } from 'react'
import AppShellTopbar from '@/components/layout/AppShellTopbar'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { DOKUMEN_KATEGORI, StatusKelengkapan, StatusUpload, StatusVerifikasi } from '@/types'

const KATEGORI_KEYS = Object.keys(DOKUMEN_KATEGORI) as Array<keyof typeof DOKUMEN_KATEGORI>

const RECENT_UPLOADS = [
  { pegawai: 'Dr. H. Ahmad Fauzi, M.Pd.', dokumen: 'KTP', tgl: '20-06-2026', status: 'Sudah Upload', verifikasi: 'Diverifikasi' },
  { pegawai: 'Dr. H. Ahmad Fauzi, M.Pd.', dokumen: 'SK PNS', tgl: '20-06-2026', status: 'Sudah Upload', verifikasi: 'Diverifikasi' },
  { pegawai: 'Siti Nurhaliza, S.Pd.', dokumen: 'Ijazah S1', tgl: '18-06-2026', status: 'Sudah Upload', verifikasi: 'Belum Diverifikasi' },
  { pegawai: 'Siti Nurhaliza, S.Pd.', dokumen: 'Sertifikat Pendidik', tgl: '18-06-2026', status: 'Sudah Upload', verifikasi: 'Belum Diverifikasi' },
  { pegawai: 'Rudi Hermawan, S.Pd.I.', dokumen: 'KTP', tgl: '15-06-2026', status: 'Belum Upload', verifikasi: '-' },
  { pegawai: 'Dewi Sartika, S.Pd.', dokumen: 'SK PPPK', tgl: '12-06-2026', status: 'Sudah Upload', verifikasi: 'Ditolak' },
  { pegawai: 'Asep Saepuloh, S.Pd., M.M.', dokumen: 'SK Jabatan', tgl: '10-06-2026', status: 'Sudah Upload', verifikasi: 'Diverifikasi' },
  { pegawai: 'Yuni Rahmawati, S.Pd.AUD.', dokumen: 'Ijazah S1', tgl: '08-06-2026', status: 'Sudah Upload', verifikasi: 'Diverifikasi' },
  { pegawai: 'Indra Gunawan, S.Pd.', dokumen: 'Sertifikat Pelatihan', tgl: '05-06-2026', status: 'Belum Upload', verifikasi: '-' },
  { pegawai: 'Fitri Handayani, S.Pd.', dokumen: 'NPWP', tgl: '03-06-2026', status: 'Sudah Upload', verifikasi: 'Diverifikasi' },
  { pegawai: 'Dr. H. Ahmad Fauzi, M.Pd.', dokumen: 'BPJS Kesehatan', tgl: '01-06-2026', status: 'Sudah Upload', verifikasi: 'Diverifikasi' },
  { pegawai: 'Rudi Hermawan, S.Pd.I.', dokumen: 'Ijazah S1', tgl: '28-05-2026', status: 'Sudah Upload', verifikasi: 'Diverifikasi' },
]

export default function ArsipDokumenPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [search, setSearch] = useState('')

  if (status === 'loading') return <div className="p-8 text-center text-zinc-500">Memuat...</div>
  if (!session) { router.push('/login'); return null }

  return (
    <AppShellTopbar>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">Arsip Dokumen Pegawai</h1>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">Upload Dokumen</button>
        </div>

        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari pegawai..." className="w-full max-w-md px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {KATEGORI_KEYS.map(key => (
            <div key={key} className="bg-white rounded-xl shadow-sm border border-zinc-200 p-5 hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-zinc-900 mb-1">{DOKUMEN_KATEGORI[key].label}</h3>
              <p className="text-sm text-zinc-500 mb-3">{DOKUMEN_KATEGORI[key].jenis.length} jenis dokumen</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-blue-700">{Math.floor(Math.random() * 20 + 5)}</span>
                <span className="text-xs text-zinc-500">dokumen</span>
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs text-zinc-500">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                {Math.floor(Math.random() * 10 + 3)} terverifikasi
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <p className="text-2xl font-bold text-green-700">8</p>
            <p className="text-sm text-green-700">Lengkap</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <p className="text-2xl font-bold text-amber-700">4</p>
            <p className="text-sm text-amber-700">Belum Lengkap</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-5">
            <p className="text-2xl font-bold text-red-700">1</p>
            <p className="text-sm text-red-700">Tidak Lengkap</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-200 font-semibold text-zinc-900">Upload Terbaru</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Pegawai</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Dokumen</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Tanggal</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Status Upload</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Verifikasi</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_UPLOADS.map((d, i) => (
                  <tr key={i} className="border-b border-zinc-100 hover:bg-zinc-50">
                    <td className="px-4 py-3 font-medium text-zinc-900">{d.pegawai}</td>
                    <td className="px-4 py-3">{d.dokumen}</td>
                    <td className="px-4 py-3">{d.tgl}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.status === 'Sudah Upload' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{d.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.verifikasi === 'Diverifikasi' ? 'bg-green-100 text-green-700' : d.verifikasi === 'Belum Diverifikasi' ? 'bg-yellow-100 text-yellow-700' : d.verifikasi === 'Ditolak' ? 'bg-red-100 text-red-700' : 'bg-zinc-100 text-zinc-500'}`}>{d.verifikasi}</span>
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
