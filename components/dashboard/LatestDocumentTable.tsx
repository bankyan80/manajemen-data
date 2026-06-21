'use client'

import { Eye } from 'lucide-react'

const data = [
  {
    nama: 'Siti Nurhalizah, S.Pd.',
    unit: 'SDN 1 Lemahabang',
    jenis: 'Ijazah S1',
    status: 'Sudah Upload',
    kelengkapan: 'Lengkap',
    verifikasi: 'Diverifikasi',
    waktu: '12 Jun 2026, 09:30',
    statusColor: 'text-blue-700 bg-blue-100',
    kelengkapanColor: 'text-green-700 bg-green-100',
    verifikasiColor: 'text-green-700 bg-green-100',
  },
  {
    nama: 'Ahmad Fauzi, S.Pd.I.',
    unit: 'SDN 2 Lemahabang',
    jenis: 'Sertifikat Pendidik',
    status: 'Sudah Upload',
    kelengkapan: 'Lengkap',
    verifikasi: 'Diverifikasi',
    waktu: '12 Jun 2026, 08:45',
    statusColor: 'text-blue-700 bg-blue-100',
    kelengkapanColor: 'text-green-700 bg-green-100',
    verifikasiColor: 'text-green-700 bg-green-100',
  },
  {
    nama: 'Dewi Sartika, S.Pd.AUD.',
    unit: 'TK Pertiwi Lemahabang',
    jenis: 'KTP',
    status: 'Sudah Upload',
    kelengkapan: 'Lengkap',
    verifikasi: 'Diverifikasi',
    waktu: '11 Jun 2026, 14:20',
    statusColor: 'text-blue-700 bg-blue-100',
    kelengkapanColor: 'text-green-700 bg-green-100',
    verifikasiColor: 'text-green-700 bg-green-100',
  },
  {
    nama: 'Rudi Hermawan, S.Pd.',
    unit: 'SDN 3 Lemahabang',
    jenis: 'SK CPNS',
    status: 'Sudah Upload',
    kelengkapan: 'Menunggu',
    verifikasi: 'Belum Diverifikasi',
    waktu: '11 Jun 2026, 11:15',
    statusColor: 'text-blue-700 bg-blue-100',
    kelengkapanColor: 'text-yellow-700 bg-yellow-100',
    verifikasiColor: 'text-yellow-700 bg-yellow-100',
  },
  {
    nama: 'Nursidah, S.Pd.',
    unit: 'SDN 4 Lemahabang',
    jenis: 'SK Pangkat',
    status: 'Belum Upload',
    kelengkapan: 'Tidak Lengkap',
    verifikasi: 'Belum Diverifikasi',
    waktu: '-',
    statusColor: 'text-gray-500 bg-gray-100',
    kelengkapanColor: 'text-red-700 bg-red-100',
    verifikasiColor: 'text-yellow-700 bg-yellow-100',
  },
  {
    nama: 'Hj. Istianah, S.Pd.',
    unit: 'SDN 1 Lemahabang',
    jenis: 'NPWP',
    status: 'Sudah Upload',
    kelengkapan: 'Lengkap',
    verifikasi: 'Diverifikasi',
    waktu: '10 Jun 2026, 16:00',
    statusColor: 'text-blue-700 bg-blue-100',
    kelengkapanColor: 'text-green-700 bg-green-100',
    verifikasiColor: 'text-green-700 bg-green-100',
  },
]

export default function LatestDocumentTable() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
        <h3 className="text-base font-semibold text-zinc-900">
          Dokumen Terbaru
        </h3>
        <span className="text-xs text-zinc-400">{data.length} entri</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50">
            <tr>
              <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Nama Pegawai
              </th>
              <th className="hidden whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 md:table-cell">
                Unit Kerja
              </th>
              <th className="hidden whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 sm:table-cell">
                Jenis Dokumen
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Status
              </th>
              <th className="hidden whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 lg:table-cell">
                Kelengkapan
              </th>
              <th className="hidden whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 lg:table-cell">
                Verifikasi
              </th>
              <th className="hidden whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 xl:table-cell">
                Waktu
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {data.map((row, i) => (
              <tr key={i} className="transition-colors hover:bg-zinc-50">
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-zinc-900">
                  {row.nama}
                </td>
                <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-zinc-500 md:table-cell">
                  {row.unit}
                </td>
                <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-zinc-500 sm:table-cell">
                  {row.jenis}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${row.statusColor}`}>
                    {row.status}
                  </span>
                </td>
                <td className="hidden whitespace-nowrap px-4 py-3 lg:table-cell">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${row.kelengkapanColor}`}>
                    {row.kelengkapan}
                  </span>
                </td>
                <td className="hidden whitespace-nowrap px-4 py-3 lg:table-cell">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${row.verifikasiColor}`}>
                    {row.verifikasi}
                  </span>
                </td>
                <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-zinc-400 xl:table-cell">
                  {row.waktu}
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
