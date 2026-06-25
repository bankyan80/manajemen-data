'use client'

import { useState } from 'react'
import AppShellTopbar from '@/components/layout/AppShellTopbar'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useData, fetchJson } from '@/lib/useData'

const TABS = ['Rekap Sekolah/Lembaga', 'Rekap Peserta Didik', 'Rekap GTK', 'Rekap Sarpras', 'Rekap Dokumen Pegawai']
const KELAS_SD = ['Kelas I', 'Kelas II', 'Kelas III', 'Kelas IV', 'Kelas V', 'Kelas VI']
const KELAS_KB = ['Kelompok A', 'Kelompok B']

type SchoolRow = {
  id: string
  npsn: string
  nama: string
  desa: string
  status: string
  jenjang: string
  alamat: string
  kelasData: Record<string, number>
  totalL: number
  totalP: number
  total: number
  rombel: number
}

export default function RekapKecamatanPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(0)
  const [filterJenjang, setFilterJenjang] = useState('')
  const { data: stats } = useData<any>('dashboard-stats', () => fetchJson('/api/dashboard-stats'))
  const { data: schools } = useData<any[]>('schools-all', () => fetchJson('/api/schools'))
  const { data: docData } = useData<any>('employee-documents', () => fetchJson('/api/employee-documents'))

  // Rekap Peserta Didik state
  const [pdFilterTA, setPdFilterTA] = useState('')
  const [pdFilterJenjang, setPdFilterJenjang] = useState('')
  const [pdFilterStatus, setPdFilterStatus] = useState('')
  const [pdFilterDesa, setPdFilterDesa] = useState('')
  const [pdSearch, setPdSearch] = useState('')
  const [pdPage, setPdPage] = useState(1)
  const [pdSortCol, setPdSortCol] = useState<string>('nama')
  const [pdSortDir, setPdSortDir] = useState<'asc' | 'desc'>('asc')
  const [selectedSchool, setSelectedSchool] = useState<SchoolRow | null>(null)
  const [showChart, setShowChart] = useState(true)
  const pdLimit = 20

  const buildPdParams = () => {
    const p = new URLSearchParams()
    if (pdFilterTA) p.set('tahun_pelajaran', pdFilterTA)
    if (pdFilterJenjang) p.set('jenjang', pdFilterJenjang)
    if (pdFilterStatus) p.set('status', pdFilterStatus)
    if (pdFilterDesa) p.set('desa', pdFilterDesa)
    if (pdSearch) p.set('q', pdSearch)
    p.set('page', String(pdPage))
    p.set('limit', String(pdLimit))
    return p.toString()
  }
  const pdParams = buildPdParams()

  const pdFetchKey = pdParams || 'pd-default'
  const { data: pdData, loading: pdLoading, error: pdError, mutate: pdMutate } = useData<any>(pdFetchKey, () =>
    fetchJson(`/api/rekap-peserta-didik?${pdParams}`)
  )

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

  // Sorting — computed on every render (small dataset, negligible cost)
  const sortedSchools = (() => {
    if (!pdData?.schools) return []
    const list = [...pdData.schools] as SchoolRow[]
    list.sort((a, b) => {
      let va: any, vb: any
      if (pdSortCol === 'nama') { va = a.nama; vb = b.nama }
      else if (pdSortCol === 'npsn') { va = a.npsn; vb = b.npsn }
      else if (pdSortCol === 'desa') { va = a.desa; vb = b.desa }
      else if (pdSortCol === 'status') { va = a.status; vb = b.status }
      else if (pdSortCol === 'jenjang') { va = a.jenjang; vb = b.jenjang }
      else if (pdSortCol === 'total') { va = a.total; vb = b.total }
      else if (pdSortCol === 'totalL') { va = a.totalL; vb = b.totalL }
      else if (pdSortCol === 'totalP') { va = a.totalP; vb = b.totalP }
      else if (pdSortCol === 'rombel') { va = a.rombel; vb = b.rombel }
      else if (pdSortCol?.startsWith('Kelas ') || pdSortCol?.startsWith('Kelompok ')) { va = a.kelasData[pdSortCol] || 0; vb = b.kelasData[pdSortCol] || 0 }
      else { va = a.nama; vb = b.nama }
      if (typeof va === 'string') return pdSortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
      return pdSortDir === 'asc' ? (va - vb) : (vb - va)
    })
    return list
  })()

  const toggleSort = (col: string) => {
    if (pdSortCol === col) setPdSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setPdSortCol(col); setPdSortDir('asc') }
  }

  const sdList = sortedSchools.filter(s => s.jenjang === 'sd')
  const kbList = sortedSchools.filter(s => s.jenjang === 'kb')

  const renderSchoolTable = (schools: SchoolRow[], title?: string) => {
    const isSd = title === 'sd' || (title !== 'kb' && schools[0]?.jenjang === 'sd')
    const kelasKeys = isSd ? KELAS_SD : KELAS_KB
    const colCount = 9 + kelasKeys.length
    const noFilterActive = !pdSearch && !pdFilterTA && !pdFilterJenjang && !pdFilterStatus && !pdFilterDesa

    return (
      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
        {title && <div className="px-4 py-3 border-b border-zinc-200 font-semibold text-zinc-900">{title}</div>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 sticky top-0 z-10">
                <th className="px-3 py-3 text-left font-semibold text-zinc-700 cursor-pointer select-none hover:bg-zinc-100 w-10" onClick={() => toggleSort('nama')}>No <SortIcon col="nama" /></th>
                <th className="px-3 py-3 text-left font-semibold text-zinc-700 cursor-pointer select-none hover:bg-zinc-100" onClick={() => toggleSort('npsn')}>NPSN <SortIcon col="npsn" /></th>
                <th className="px-3 py-3 text-left font-semibold text-zinc-700 cursor-pointer select-none hover:bg-zinc-100 min-w-[180px]" onClick={() => toggleSort('nama')}>Nama Sekolah <SortIcon col="nama" /></th>
                <th className="px-3 py-3 text-left font-semibold text-zinc-700 cursor-pointer select-none hover:bg-zinc-100" onClick={() => toggleSort('desa')}>Desa <SortIcon col="desa" /></th>
                <th className="px-3 py-3 text-left font-semibold text-zinc-700 cursor-pointer select-none hover:bg-zinc-100" onClick={() => toggleSort('status')}>Status <SortIcon col="status" /></th>
                {kelasKeys.map(k => (
                  <th key={k} className="px-2 py-3 text-center font-semibold text-zinc-700 cursor-pointer select-none hover:bg-zinc-100" onClick={() => toggleSort(k)}>
                    {isSd ? k.replace('Kelas ', 'Kls ') : k} <SortIcon col={k} />
                  </th>
                ))}
                <th className="px-3 py-3 text-center font-semibold text-zinc-700 cursor-pointer select-none hover:bg-zinc-100" onClick={() => toggleSort('totalL')}>L <SortIcon col="totalL" /></th>
                <th className="px-3 py-3 text-center font-semibold text-zinc-700 cursor-pointer select-none hover:bg-zinc-100" onClick={() => toggleSort('totalP')}>P <SortIcon col="totalP" /></th>
                <th className="px-3 py-3 text-center font-semibold text-zinc-700 cursor-pointer select-none hover:bg-zinc-100" onClick={() => toggleSort('total')}>Total <SortIcon col="total" /></th>
                <th className="px-3 py-3 text-center font-semibold text-zinc-700 cursor-pointer select-none hover:bg-zinc-100" onClick={() => toggleSort('rombel')}>Rombel <SortIcon col="rombel" /></th>
              </tr>
            </thead>
            <tbody>
              {schools.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="px-4 py-8 text-center text-zinc-400">
                    {noFilterActive ? 'Belum ada data peserta didik' : 'Tidak ada data yang cocok dengan filter'}
                  </td>
                </tr>
              ) : schools.map((school, idx) => (
                <tr key={school.id} onClick={() => setSelectedSchool(school)} className="border-b border-zinc-100 hover:bg-blue-50 cursor-pointer transition-colors">
                  <td className="px-3 py-2.5 text-zinc-500">{(pdPage - 1) * pdLimit + idx + 1}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">{school.npsn}</td>
                  <td className="px-3 py-2.5 font-medium text-zinc-900 min-w-[180px]">{school.nama}</td>
                  <td className="px-3 py-2.5 text-zinc-600">{school.desa}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${school.status === 'negeri' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                      {school.status === 'negeri' ? 'Negeri' : 'Swasta'}
                    </span>
                  </td>
                  {kelasKeys.map(k => (
                    <td key={k} className="px-2 py-2.5 text-center text-zinc-700">{school.kelasData[k] || 0}</td>
                  ))}
                  <td className="px-3 py-2.5 text-center font-medium text-indigo-700">{school.totalL}</td>
                  <td className="px-3 py-2.5 text-center font-medium text-pink-700">{school.totalP}</td>
                  <td className="px-3 py-2.5 text-center font-bold text-zinc-900">{school.total}</td>
                  <td className="px-3 py-2.5 text-center text-zinc-600">{school.rombel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pdData?.pagination && pdData.pagination.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200 bg-zinc-50">
            <p className="text-xs text-zinc-500">
              Menampilkan {(pdPage - 1) * pdLimit + 1}-{Math.min(pdPage * pdLimit, pdData.pagination.total)} dari {pdData.pagination.total}
            </p>
            <div className="flex gap-1">
              <button disabled={pdPage <= 1} onClick={() => setPdPage(p => p - 1)} className="px-3 py-1.5 border border-zinc-300 rounded text-xs bg-white disabled:opacity-40 hover:bg-zinc-50">Prev</button>
              {Array.from({ length: Math.min(pdData.pagination.total_pages, 5) }).map((_, i) => {
                let pageNum: number
                const total = pdData.pagination.total_pages
                if (total <= 5) pageNum = i + 1
                else if (pdPage <= 3) pageNum = i + 1
                else if (pdPage >= total - 2) pageNum = total - 4 + i
                else pageNum = pdPage - 2 + i
                return (
                  <button key={pageNum} onClick={() => setPdPage(pageNum)} className={`px-3 py-1.5 border border-zinc-300 rounded text-xs ${pageNum === pdPage ? 'bg-blue-600 text-white' : 'bg-white hover:bg-zinc-50'}`}>{pageNum}</button>
                )
              })}
              <button disabled={pdPage >= pdData.pagination.total_pages} onClick={() => setPdPage(p => p + 1)} className="px-3 py-1.5 border border-zinc-300 rounded text-xs bg-white disabled:opacity-40 hover:bg-zinc-50">Next</button>
            </div>
          </div>
        )}
      </div>
    )
  }

  const resetFilters = () => {
    setPdFilterTA('')
    setPdFilterJenjang('')
    setPdFilterStatus('')
    setPdFilterDesa('')
    setPdSearch('')
    setPdPage(1)
  }

  const exportExcel = () => {
    const params = new URLSearchParams()
    if (pdFilterTA) params.set('tahun_pelajaran', pdFilterTA)
    if (pdFilterJenjang) params.set('jenjang', pdFilterJenjang)
    if (pdFilterStatus) params.set('status', pdFilterStatus)
    if (pdFilterDesa) params.set('desa', pdFilterDesa)
    if (pdSearch) params.set('q', pdSearch)
    params.set('format', 'excel')
    params.set('limit', '1000')
    window.open(`/api/rekap-peserta-didik?${params.toString()}`, '_blank')
  }

  const printPDF = () => {
    window.print()
  }

  const pdStats = pdData?.stats

  const SortIcon = ({ col }: { col: string }) => (
    <span className="inline-block ml-1 text-zinc-400 text-xs">
      {pdSortCol === col ? (pdSortDir === 'asc' ? '▲' : '▼') : '⇅'}
    </span>
  )

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

        {activeTab === 1 && (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Total Sekolah', value: pdStats?.totalSekolah ?? '-', color: 'text-blue-700' },
                { label: 'Total PD', value: pdStats?.totalPD ?? '-', color: 'text-cyan-700' },
                { label: 'Laki-laki', value: pdStats?.totalL ?? '-', color: 'text-indigo-700' },
                { label: 'Perempuan', value: pdStats?.totalP ?? '-', color: 'text-pink-700' },
                { label: 'Total Rombel', value: pdStats?.totalRombel ?? '-', color: 'text-amber-700' },
                { label: 'Rata-rata/Sekolah', value: pdStats?.rataRata ?? '-', color: 'text-green-700' },
              ].map(card => (
                <div key={card.label} className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4 text-center">
                  <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                  <p className="text-xs text-zinc-500 mt-1">{card.label}</p>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4">
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[140px]">
                  <label className="text-xs text-zinc-500 mb-1 block">Tahun Ajaran</label>
                  <select value={pdFilterTA} onChange={e => { setPdFilterTA(e.target.value); setPdPage(1) }} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
                    <option value="">Semua TA</option>
                    {(pdData?.filters?.tahunPelajaran || []).map((ta: string) => (
                      <option key={ta} value={ta}>{ta}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-w-[100px]">
                  <label className="text-xs text-zinc-500 mb-1 block">Jenjang</label>
                  <select value={pdFilterJenjang} onChange={e => { setPdFilterJenjang(e.target.value); setPdPage(1) }} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
                    <option value="">Semua</option>
                    <option value="sd">SD</option>
                    <option value="kb">KB</option>
                  </select>
                </div>
                <div className="flex-1 min-w-[100px]">
                  <label className="text-xs text-zinc-500 mb-1 block">Status</label>
                  <select value={pdFilterStatus} onChange={e => { setPdFilterStatus(e.target.value); setPdPage(1) }} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
                    <option value="">Semua</option>
                    <option value="negeri">Negeri</option>
                    <option value="swasta">Swasta</option>
                  </select>
                </div>
                <div className="flex-1 min-w-[120px]">
                  <label className="text-xs text-zinc-500 mb-1 block">Desa</label>
                  <select value={pdFilterDesa} onChange={e => { setPdFilterDesa(e.target.value); setPdPage(1) }} className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white">
                    <option value="">Semua Desa</option>
                    {(pdData?.filters?.desa || []).map((d: string) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-[2] min-w-[180px]">
                  <label className="text-xs text-zinc-500 mb-1 block">Cari Nama / NPSN</label>
                  <input value={pdSearch} onChange={e => { setPdSearch(e.target.value); setPdPage(1) }} placeholder="Ketik nama atau NPSN..." className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm" />
                </div>
                <button onClick={resetFilters} className="px-3 py-2 border border-zinc-300 rounded-lg text-sm text-zinc-600 hover:bg-zinc-50">Reset</button>
                <button onClick={exportExcel} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Excel</button>
                <button onClick={printPDF} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">PDF</button>
              </div>
            </div>

            {/* Charts Toggle */}
            <button onClick={() => setShowChart(v => !v)} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
              {showChart ? '▼' : '▶'} {showChart ? 'Sembunyikan' : 'Tampilkan'} Visualisasi
            </button>

            {/* Charts */}
            {showChart && pdData?.chartData && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Bar Chart - Per Kelas */}
                <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4">
                  <h3 className="text-sm font-semibold text-zinc-700 mb-3">Jumlah Siswa per Kelas</h3>
                  {Object.keys(pdData.chartData.kelas).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(pdData.chartData.kelas as Record<string, number>).map(([kelas, count]) => {
                        const maxVal = Math.max(...Object.values(pdData.chartData.kelas as Record<string, number>), 1)
                        const pct = (count as number) / maxVal * 100
                        return (
                          <div key={kelas}>
                            <div className="flex justify-between text-xs text-zinc-600 mb-1">
                              <span>{kelas}</span>
                              <span className="font-semibold">{count}</span>
                            </div>
                            <div className="w-full bg-zinc-100 rounded-full h-4">
                              <div className="bg-blue-500 h-4 rounded-full transition-all" style={{ width: `${Math.max(pct, 4)}%` }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400">Belum ada data</p>
                  )}
                </div>

                {/* Pie Chart - Gender */}
                <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4">
                  <h3 className="text-sm font-semibold text-zinc-700 mb-3">Distribusi Gender</h3>
                  {pdStats?.totalPD > 0 ? (
                    <div className="flex items-center justify-center gap-6">
                      <div className="relative w-32 h-32">
                        <svg viewBox="0 0 36 36" className="w-full h-full">
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#818cf8" strokeWidth="3" strokeDasharray={`${pdStats.totalL / pdStats.totalPD * 100} ${100 - pdStats.totalL / pdStats.totalPD * 100}`} strokeDashoffset="25" />
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f472b6" strokeWidth="3" strokeDasharray={`${100 - pdStats.totalL / pdStats.totalPD * 100} ${pdStats.totalL / pdStats.totalPD * 100}`} strokeDashoffset={25 + (100 - pdStats.totalL / pdStats.totalPD * 100)} />
                        </svg>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-indigo-400 inline-block" />
                          <span className="text-zinc-600">L: <strong>{pdStats.totalL}</strong> ({Math.round(pdStats.totalL / pdStats.totalPD * 100)}%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-pink-400 inline-block" />
                          <span className="text-zinc-600">P: <strong>{pdStats.totalP}</strong> ({Math.round(pdStats.totalP / pdStats.totalPD * 100)}%)</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400 text-center">Belum ada data</p>
                  )}
                </div>

                {/* Distribusi per Desa */}
                <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4">
                  <h3 className="text-sm font-semibold text-zinc-700 mb-3">Distribusi per Desa</h3>
                  {Object.keys(pdData.chartData.desa || {}).length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {Object.entries(pdData.chartData.desa as Record<string, number>)
                        .sort((a, b) => b[1] - a[1])
                        .map(([desa, count]) => {
                          const maxVal = Math.max(...Object.values(pdData.chartData.desa as Record<string, number>), 1)
                          const pct = count / maxVal * 100
                          return (
                            <div key={desa}>
                              <div className="flex justify-between text-xs text-zinc-600 mb-1">
                                <span>{desa}</span>
                                <span className="font-semibold">{count}</span>
                              </div>
                              <div className="w-full bg-zinc-100 rounded-full h-3">
                                <div className="bg-emerald-400 h-3 rounded-full transition-all" style={{ width: `${Math.max(pct, 3)}%` }} />
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400">Belum ada data</p>
                  )}
                </div>
              </div>
            )}

            {/* Loading Skeleton */}
            {pdLoading && (
              <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                <div className="p-6 space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-4 animate-pulse">
                      <div className="h-4 bg-zinc-200 rounded w-8" />
                      <div className="h-4 bg-zinc-200 rounded w-20" />
                      <div className="h-4 bg-zinc-200 rounded flex-1" />
                      <div className="h-4 bg-zinc-200 rounded w-16" />
                      <div className="h-4 bg-zinc-200 rounded w-12" />
                      {Array.from({ length: 8 }).map((_, j) => (
                        <div key={j} className="h-4 bg-zinc-200 rounded w-10" />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error State */}
            {pdError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <p className="text-red-600 font-medium">Gagal memuat data</p>
                <p className="text-red-500 text-sm mt-1">{pdError}</p>
                <button onClick={pdMutate} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Coba Lagi</button>
              </div>
            )}

            {/* Table */}
            {!pdLoading && !pdError && (
              pdFilterJenjang ? (
                renderSchoolTable(sortedSchools)
              ) : (
                <div className="space-y-6">
                  {renderSchoolTable(sdList, 'Sekolah Dasar (SD)')}
                  {renderSchoolTable(kbList, 'Kelompok Belajar (KB)')}
                </div>
              )
            )}
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

        {activeTab === 3 && (
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-8 text-center">
            <p className="text-zinc-500">Data Rekap Sarpras belum tersedia.</p>
          </div>
        )}

        {/* Detail School Modal */}
        {selectedSchool && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedSchool(null)}>
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-lg font-bold text-zinc-900">Detail Sekolah</h2>
                <button onClick={() => setSelectedSchool(null)} className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500">&times;</button>
              </div>
              <div className="p-6 space-y-6">
                {/* School Profile */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-zinc-500">NPSN:</span> <span className="font-medium">{selectedSchool.npsn}</span></div>
                  <div><span className="text-zinc-500">Jenjang:</span> <span className="font-medium uppercase">{selectedSchool.jenjang}</span></div>
                  <div className="col-span-2"><span className="text-zinc-500">Nama:</span> <span className="font-medium">{selectedSchool.nama}</span></div>
                  <div><span className="text-zinc-500">Desa:</span> <span className="font-medium">{selectedSchool.desa}</span></div>
                  <div>
                    <span className="text-zinc-500">Status:</span>
                    <span className={`ml-1 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${selectedSchool.status === 'negeri' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                      {selectedSchool.status === 'negeri' ? 'Negeri' : 'Swasta'}
                    </span>
                  </div>
                  <div className="col-span-2"><span className="text-zinc-500">Alamat:</span> <span className="font-medium">{selectedSchool.alamat}</span></div>
                </div>

                {/* Per-class Table */}
                <div>
                  <h3 className="text-sm font-semibold text-zinc-700 mb-3">Rekap per Kelas</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-200">
                          <th className="px-3 py-2 text-left font-semibold text-zinc-700">Kelas</th>
                          <th className="px-3 py-2 text-center font-semibold text-zinc-700">L</th>
                          <th className="px-3 py-2 text-center font-semibold text-zinc-700">P</th>
                          <th className="px-3 py-2 text-center font-semibold text-zinc-700">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedSchool.jenjang === 'sd' ? KELAS_SD : KELAS_KB).map(k => {
                          const total = selectedSchool.kelasData[k as keyof typeof selectedSchool.kelasData] || 0
                          if (total === 0) return null
                          return (
                            <tr key={k} className="border-b border-zinc-100">
                              <td className="px-3 py-2">{k}</td>
                              <td className="px-3 py-2 text-center text-indigo-700">-</td>
                              <td className="px-3 py-2 text-center text-pink-700">-</td>
                              <td className="px-3 py-2 text-center font-bold">{total}</td>
                            </tr>
                          )
                        })}
                        <tr className="bg-blue-50 font-bold">
                          <td className="px-3 py-2">Jumlah</td>
                          <td className="px-3 py-2 text-center text-indigo-700">{selectedSchool.totalL}</td>
                          <td className="px-3 py-2 text-center text-pink-700">{selectedSchool.totalP}</td>
                          <td className="px-3 py-2 text-center">{selectedSchool.total}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mini Gender Chart */}
                <div>
                  <h3 className="text-sm font-semibold text-zinc-700 mb-3">Distribusi Gender</h3>
                  {selectedSchool.total > 0 ? (
                    <div className="flex items-center gap-6">
                      <div className="flex gap-0 h-8 w-full max-w-xs rounded-full overflow-hidden">
                        <div className="bg-indigo-400 flex items-center justify-center text-white text-xs font-medium" style={{ width: `${selectedSchool.totalL / selectedSchool.total * 100}%` }}>
                          {selectedSchool.totalL > 0 ? `${selectedSchool.totalL}` : ''}
                        </div>
                        <div className="bg-pink-400 flex items-center justify-center text-white text-xs font-medium" style={{ width: `${selectedSchool.totalP / selectedSchool.total * 100}%` }}>
                          {selectedSchool.totalP > 0 ? `${selectedSchool.totalP}` : ''}
                        </div>
                      </div>
                      <div className="text-xs space-y-1">
                        <div><span className="w-2 h-2 inline-block bg-indigo-400 rounded-full mr-1" /> L: {selectedSchool.totalL} ({Math.round(selectedSchool.totalL / selectedSchool.total * 100)}%)</div>
                        <div><span className="w-2 h-2 inline-block bg-pink-400 rounded-full mr-1" /> P: {selectedSchool.totalP} ({Math.round(selectedSchool.totalP / selectedSchool.total * 100)}%)</div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400">Belum ada data</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShellTopbar>
  )
}
