'use client'

import { useState } from 'react'
import AppShellTopbar from '@/components/layout/AppShellTopbar'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const ARCHIVE = [
  { judul: 'Laporan SD Bulanan Januari 2026', format: 'PDF', tgl: '25-01-2026', oleh: 'Admin Kecamatan', ukuran: '2.4 MB' },
  { judul: 'Laporan PAUD Bulanan Januari 2026', format: 'PDF', tgl: '25-01-2026', oleh: 'Admin Kecamatan', ukuran: '1.8 MB' },
  { judul: 'Rekap Kecamatan Semester Ganjil 2025/2026', format: 'PDF', tgl: '20-12-2025', oleh: 'Admin Kecamatan', ukuran: '5.2 MB' },
  { judul: 'Laporan SD Bulanan Februari 2026', format: 'PDF', tgl: '22-02-2026', oleh: 'Admin Kecamatan', ukuran: '2.1 MB' },
  { judul: 'Data GTK Kecamatan 2026', format: 'Excel', tgl: '15-03-2026', oleh: 'Admin Kecamatan', ukuran: '3.6 MB' },
  { judul: 'Rekap SPMB 2025/2026', format: 'Excel', tgl: '10-06-2026', oleh: 'Admin Kecamatan', ukuran: '1.2 MB' },
]

export default function CetakExportPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  if (status === 'loading') return <div className="p-8 text-center text-zinc-500">Memuat...</div>
  if (!session) { router.push('/login'); return null }

  return (
    <AppShellTopbar>
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-zinc-900">Cetak &amp; Export</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            </div>
            <h3 className="font-semibold text-zinc-900 mb-2">Cetak Laporan SD</h3>
            <p className="text-xs text-zinc-500 mb-4">Cetak laporan bulanan SD dalam format PDF</p>
            <div className="flex flex-col gap-2">
              <select className="px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
                <option>Bulan: Januari 2026</option>
                <option>Februari 2026</option>
                <option>Maret 2026</option>
              </select>
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                Cetak PDF
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            </div>
            <h3 className="font-semibold text-zinc-900 mb-2">Cetak Laporan PAUD</h3>
            <p className="text-xs text-zinc-500 mb-4">Cetak laporan bulanan PAUD dalam format PDF</p>
            <div className="flex flex-col gap-2">
              <select className="px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
                <option>Bulan: Januari 2026</option>
                <option>Februari 2026</option>
                <option>Maret 2026</option>
              </select>
              <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                Cetak PDF
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <h3 className="font-semibold text-zinc-900 mb-2">Cetak Rekap Kecamatan</h3>
            <p className="text-xs text-zinc-500 mb-4">Cetak rekap data seluruh kecamatan</p>
            <div className="flex flex-col gap-2">
              <select className="px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
                <option>Semester Ganjil 2025/2026</option>
                <option>Semester Genap 2024/2025</option>
              </select>
              <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Cetak Rekap
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <h3 className="font-semibold text-zinc-900 mb-2">Export Excel</h3>
            <p className="text-xs text-zinc-500 mb-4">Export data ke format spreadsheet</p>
            <div className="flex flex-col gap-2">
              <select className="px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
                <option>Pilih data untuk di-export</option>
                <option>Data Kesiswaan SD</option>
                <option>Data Kesiswaan PAUD</option>
                <option>Data GTK</option>
                <option>Data Sarpras</option>
                <option>Data SPMB</option>
                <option>Rekap Kecamatan</option>
              </select>
              <button className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Download Excel
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            </div>
            <h3 className="font-semibold text-zinc-900 mb-2">Export PDF</h3>
            <p className="text-xs text-zinc-500 mb-4">Export data ke format PDF</p>
            <div className="flex flex-col gap-2">
              <select className="px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
                <option>Pilih data untuk di-export</option>
                <option>Laporan Bulanan SD</option>
                <option>Laporan Bulanan PAUD</option>
                <option>Rekap Kecamatan</option>
                <option>Data GTK</option>
                <option>Data SPMB</option>
              </select>
              <button className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                Download PDF
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
            <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-cyan-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </div>
            <h3 className="font-semibold text-zinc-900 mb-2">Sinkron Spreadsheet</h3>
            <p className="text-xs text-zinc-500 mb-4">Sinkronisasi data ke Google Spreadsheet</p>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm text-green-700">Terhubung</span>
              <span className="text-xs text-zinc-400">Update terakhir: 20-06-2026</span>
            </div>
            <button className="w-full px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 text-sm font-medium flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Sinkron Sekarang
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-200 font-semibold text-zinc-900">Arsip Cetakan</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Judul</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Format</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Tanggal</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Oleh</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Ukuran</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {ARCHIVE.map((a, i) => (
                  <tr key={i} className="border-b border-zinc-100 hover:bg-zinc-50">
                    <td className="px-4 py-3 font-medium text-zinc-900">{a.judul}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${a.format === 'PDF' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{a.format}</span>
                    </td>
                    <td className="px-4 py-3">{a.tgl}</td>
                    <td className="px-4 py-3">{a.oleh}</td>
                    <td className="px-4 py-3">{a.ukuran}</td>
                    <td className="px-4 py-3">
                      <button className="text-blue-600 hover:underline text-xs">Download</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
          <h3 className="font-semibold text-zinc-900 mb-4">Blok Tanda Tangan Cetakan</h3>
          <div className="flex justify-end">
            <div className="text-center w-64">
              <p className="text-sm text-zinc-700 mb-8">Kecamatan Margaasih, 21 Juni 2026</p>
              <p className="font-semibold text-zinc-900">Kepala UPTD Kecamatan Margaasih</p>
              <div className="h-16" />
              <div className="border-t border-zinc-400 pt-1">
                <p className="font-semibold text-zinc-900">Drs. H. Cecep Sutisna, M.Pd.</p>
                <p className="text-xs text-zinc-500">NIP. 196805201994031005</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShellTopbar>
  )
}
