'use client'

import { useState } from 'react'
import AppShellTopbar from '@/components/layout/AppShellTopbar'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useData, fetchJson } from '@/lib/useData'

const TABS = ['Rekap Sekolah/Lembaga', 'Rekap Peserta Didik', 'Rekap GTK', 'Rekap Sarpras', 'Rekap Dokumen Pegawai']

export default function RekapKecamatanPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(0)
  const [filterJenjang, setFilterJenjang] = useState('')
  const { data: stats } = useData<any>('dashboard-stats', () => fetchJson('/api/dashboard-stats'))
  const { data: schools } = useData<any[]>('schools-all', () => fetchJson('/api/schools'))
  const { data: docData } = useData<any>('employee-documents', () => fetchJson('/api/employee-documents'))

  if (status === 'loading') return <div className="p-8 text-center text-zinc-500">Memuat...</div>
  if (!session) { router.push('/login'); return null }

  const role = (session?.user as any)?.role
  if (role === 'operator_sekolah') { router.push('/dashboard'); return null }

  const sdSchools = (schools || []).filter((s: any) => s.jenjang === 'sd')
  const kbSchools = (schools || []).filter((s: any) => s.jenjang === 'kb')
  const sdNegeri = sdSchools.filter((s: any) => s.status === 'negeri').length
  const sdSwasta = sdSchools.filter((s: any) => s.status === 'swasta').length
  const kbNegeri = kbSchools.filter((s: any) => s.status === 'negeri').length
  const kbSwasta = kbSchools.filter((s: any) => s.status === 'swasta').length

  const docs = docData?.data || []
  const verifiedDocs = docs.filter((d: any) => d.status_verifikasi === 'sudah_diverifikasi').length

  return (
    <AppShellTopbar>
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-zinc-900">Rekap Kecamatan</h1>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{sdSchools.length}</p><p className="text-xs text-zinc-500">Total SD</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4 text-center">
            <p className="text-2xl font-bold text-purple-700">{kbSchools.length}</p><p className="text-xs text-zinc-500">Total KB</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{stats?.totalGTK || 0}</p><p className="text-xs text-zinc-500">Total GTK</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{docs.length}</p><p className="text-xs text-zinc-500">Total Dokumen</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4 text-center">
            <p className="text-2xl font-bold text-red-700">{stats?.reportsSubmitted || 0}</p><p className="text-xs text-zinc-500">Total Laporan</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4 text-center">
            <p className="text-2xl font-bold text-cyan-700">{stats?.totalStudents || 0}</p><p className="text-xs text-zinc-500">Total Peserta Didik</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 bg-zinc-100 p-1 rounded-lg">
          {TABS.map((tab, i) => (
            <button key={i} onClick={() => setActiveTab(i)} className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${activeTab === i ? 'bg-white text-blue-700 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}>{tab}</button>
          ))}
        </div>

        <div className="flex gap-4 items-center flex-wrap">
          <select value={filterJenjang} onChange={e => setFilterJenjang(e.target.value)} className="px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
            <option value="">Semua Jenjang</option>
            <option value="sd">SD</option>
            <option value="kb">KB</option>
          </select>
        </div>

        {activeTab === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-200 font-semibold text-zinc-900">Rekap Sekolah / Lembaga</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200">
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Jenjang</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Negeri</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Swasta</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(!filterJenjang || filterJenjang === 'sd') && (
                    <tr className="border-b border-zinc-100">
                      <td className="px-4 py-3 font-medium">SD</td>
                      <td className="px-4 py-3">{sdNegeri}</td>
                      <td className="px-4 py-3">{sdSwasta}</td>
                      <td className="px-4 py-3 font-bold">{sdSchools.length}</td>
                    </tr>
                  )}
                  {(!filterJenjang || filterJenjang === 'kb') && (
                    <tr className="border-b border-zinc-100">
                      <td className="px-4 py-3 font-medium">KB</td>
                      <td className="px-4 py-3">{kbNegeri}</td>
                      <td className="px-4 py-3">{kbSwasta}</td>
                      <td className="px-4 py-3 font-bold">{kbSchools.length}</td>
                    </tr>
                  )}
                  {!filterJenjang && (
                    <tr className="bg-blue-50 font-bold">
                      <td className="px-4 py-3">Total</td>
                      <td className="px-4 py-3">{sdNegeri + kbNegeri}</td>
                      <td className="px-4 py-3">{sdSwasta + kbSwasta}</td>
                      <td className="px-4 py-3">{schools?.length || 0}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 2 && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-200 font-semibold text-zinc-900">Rekap GTK</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200">
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Total GTK</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">{stats?.totalGTK || 0}</th>
                  </tr>
                </thead>
              </table>
            </div>
          </div>
        )}

        {activeTab === 4 && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-200 font-semibold text-zinc-900">Rekap Dokumen Pegawai</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200">
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Total Dokumen</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Terverifikasi</th>
                    <th className="text-left px-4 py-3 font-semibold text-zinc-700">Belum Verifikasi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-zinc-100">
                    <td className="px-4 py-3 font-medium">{docs.length}</td>
                    <td className="px-4 py-3 text-green-700">{verifiedDocs}</td>
                    <td className="px-4 py-3 text-red-700">{docs.length - verifiedDocs}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {[1, 3].includes(activeTab) && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-8 text-center">
            <p className="text-zinc-500">Data {TABS[activeTab]} belum tersedia.</p>
          </div>
        )}
      </div>
    </AppShellTopbar>
  )
}
