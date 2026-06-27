'use client'

import { useState } from 'react'
import AppShellTopbar from '@/components/layout/AppShellTopbar'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useData, fetchJson } from '@/lib/useData'
import { usePageGuard } from '@/lib/usePermissions'

export default function ArsipDokumenPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<any | null>(null)
  const { data: docData, loading } = useData<any>('employee-documents', () => fetchJson('/api/employee-documents'))
  const closeDetail = () => setSelected(null)

  if (status === 'loading') return <div className="p-8 text-center text-zinc-500">Memuat...</div>

  const allowed = usePageGuard('arsip_dokumen')
  if (!session) { router.push('/login'); return null }
  if (!allowed) return null

  const docs = docData?.data || []
  const byKategori = docData?.byKategori || []
  const statusCount = docData?.statusCount || {}

  const filtered = docs.filter((d: any) =>
    (d.employee_nama || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AppShellTopbar>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">Arsip Dokumen Pegawai</h1>
          <button onClick={() => alert('Fitur upload dokumen akan tersedia dalam versi mendatang')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">Upload Dokumen</button>
        </div>

        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari pegawai..." className="w-full max-w-md px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {byKategori.map((k: any) => (
            <div key={k.kategori} className="bg-white rounded-xl shadow-sm border border-zinc-200 p-5 hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-zinc-900 mb-1 capitalize">{k.kategori.replace(/_/g, ' ')}</h3>
              <p className="text-sm text-zinc-500 mb-3">{k.total} dokumen</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-blue-700">{k.total}</span>
                <span className="text-xs text-zinc-500">dokumen</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <p className="text-2xl font-bold text-green-700">{statusCount.lengkap || 0}</p>
            <p className="text-sm text-green-700">Lengkap</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <p className="text-2xl font-bold text-amber-700">{statusCount.belum_lengkap || 0}</p>
            <p className="text-sm text-amber-700">Belum Lengkap</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <p className="text-2xl font-bold text-blue-700">{statusCount.sudah_diverifikasi || 0}</p>
            <p className="text-sm text-blue-700">Terverifikasi</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-200 font-semibold text-zinc-900">Dokumen Pegawai</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Pegawai</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Dokumen</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Status Upload</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Verifikasi</th>
                  <th className="text-left px-4 py-3 font-semibold text-zinc-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-zinc-400">Memuat...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-zinc-400">{search ? 'Tidak ditemukan' : 'Belum ada dokumen'}</td></tr>
                ) : filtered.map((d: any, i: number) => (
                  <tr key={d.id || i} className="border-b border-zinc-100 hover:bg-zinc-50">
                    <td className="px-4 py-3 font-medium text-zinc-900">{d.employee_nama || '-'}</td>
                    <td className="px-4 py-3">{d.jenis_dokumen}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.status_upload === 'sudah_diupload' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {d.status_upload === 'sudah_diupload' ? 'Sudah Upload' : 'Belum Upload'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.status_verifikasi === 'sudah_diverifikasi' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {d.status_verifikasi === 'sudah_diverifikasi' ? 'Diverifikasi' : 'Belum Diverifikasi'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelected(d)} className="text-blue-600 hover:underline text-xs">Detail</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={closeDetail}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
              <h3 className="font-semibold text-zinc-900">Detail Dokumen</h3>
              <button onClick={closeDetail} className="text-zinc-400 hover:text-zinc-600 text-xl leading-none">&times;</button>
            </div>
            <div className="px-6 py-4 space-y-3 text-sm">
              <Row label="Pegawai" value={selected.employee_nama || '-'} />
              <Row label="Unit Kerja" value={selected.school_nama || '-'} />
              <Row label="Jenis Dokumen" value={selected.jenis_dokumen || '-'} />
              <Row label="Kategori" value={selected.kategori || '-'} />
              <Row label="Status Upload" value={selected.status_upload === 'sudah_diupload' ? 'Sudah Upload' : 'Belum Upload'} />
              <Row label="Status Verifikasi" value={selected.status_verifikasi === 'sudah_diverifikasi' ? 'Diverifikasi' : 'Belum Diverifikasi'} />
              <Row label="Status Kelengkapan" value={selected.status_kelengkapan === 'lengkap' ? 'Lengkap' : 'Belum Lengkap'} />
              <Row label="Nama File" value={selected.nama_file || '-'} />
              <Row label="Catatan Revisi" value={selected.catatan_revisi || '-'} />
              <Row label="Diupload" value={selected.uploaded_at ? new Date(selected.uploaded_at).toLocaleString('id-ID') : '-'} />
              <Row label="Diverifikasi" value={selected.verified_at ? new Date(selected.verified_at).toLocaleString('id-ID') : '-'} />
            </div>
            <div className="flex items-center justify-end px-6 py-4 border-t border-zinc-200">
              <button onClick={closeDetail} className="px-4 py-2 text-sm bg-zinc-100 text-zinc-700 rounded-lg hover:bg-zinc-200">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </AppShellTopbar>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-4">
      <span className="w-36 shrink-0 text-zinc-500">{label}</span>
      <span className="text-zinc-900 font-medium">{value}</span>
    </div>
  )
}
