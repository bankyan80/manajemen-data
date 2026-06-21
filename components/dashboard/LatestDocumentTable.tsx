'use client'

import { Eye } from 'lucide-react'

export default function LatestDocumentTable({ docs, loading }: { docs?: any[]; loading?: boolean }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
        <h3 className="text-base font-semibold text-zinc-900">Dokumen Terbaru</h3>
        <span className="text-xs text-zinc-400">{docs?.length || 0} entri</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50">
            <tr>
              <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Nama Pegawai</th>
              <th className="hidden whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 md:table-cell">Unit Kerja</th>
              <th className="hidden whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 sm:table-cell">Jenis Dokumen</th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Status</th>
              <th className="hidden whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 lg:table-cell">Kelengkapan</th>
              <th className="hidden whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 lg:table-cell">Verifikasi</th>
              <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-zinc-400">Memuat...</td></tr>
            ) : docs?.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-zinc-400">Belum ada dokumen</td></tr>
            ) : docs?.map((row, i) => (
              <tr key={i} className="transition-colors hover:bg-zinc-50">
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-zinc-900">{row.employee_nama || '-'}</td>
                <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-zinc-500 md:table-cell">{row.school_nama || '-'}</td>
                <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-zinc-500 sm:table-cell">{row.jenis_dokumen}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${row.status_upload === 'sudah_diupload' ? 'text-blue-700 bg-blue-100' : 'text-gray-500 bg-gray-100'}`}>{row.status_upload === 'sudah_diupload' ? 'Sudah Upload' : 'Belum Upload'}</span>
                </td>
                <td className="hidden whitespace-nowrap px-4 py-3 lg:table-cell">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${row.status_kelengkapan === 'lengkap' ? 'text-green-700 bg-green-100' : 'text-yellow-700 bg-yellow-100'}`}>{row.status_kelengkapan === 'lengkap' ? 'Lengkap' : row.status_kelengkapan === 'belum_lengkap' ? 'Menunggu' : row.status_kelengkapan}</span>
                </td>
                <td className="hidden whitespace-nowrap px-4 py-3 lg:table-cell">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${row.status_verifikasi === 'sudah_diverifikasi' ? 'text-green-700 bg-green-100' : 'text-yellow-700 bg-yellow-100'}`}>{row.status_verifikasi === 'sudah_diverifikasi' ? 'Diverifikasi' : 'Belum Diverifikasi'}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <button className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-teal-700 transition-colors hover:bg-teal-50">
                    <Eye className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Lihat</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
