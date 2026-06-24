'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useData, fetchJson } from '@/lib/useData'
import {
  Pencil, Plus, Trash2, Loader2, Search, Download, FileText, X,
  BarChart3, Users, BookOpen, AlertTriangle,
  CheckCircle, Eye,
} from 'lucide-react'

const TAHUN_PELAJARAN = Array.from({ length: 10 }, (_, i) => {
  const a = 2026 + i; return `${a}/${a + 1}`
})

const ADMIN_TABS = [
  { key: 'daya_tampung', label: 'Daya Tampung', icon: BookOpen },
  { key: 'data_pendaftar', label: 'Data Pendaftar', icon: Users },
  { key: 'rekap_jalur', label: 'Rekap Jalur', icon: BarChart3 },
  { key: 'rekap_usia', label: 'Rekap Usia', icon: BarChart3 },
  { key: 'monitoring', label: 'Monitoring Kuota', icon: AlertTriangle },
]

const OPERATOR_TABS = [
  { key: 'op_pendaftar', label: 'Data Pendaftar', icon: Users },
  { key: 'op_rekap', label: 'Rekap Data', icon: BarChart3 },
]

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-yellow-700 bg-yellow-100',
  diterima: 'text-green-700 bg-green-100',
  cadangan: 'text-blue-700 bg-blue-100',
  ditolak: 'text-red-700 bg-red-100',
}

const JALUR_LIST = [
  { value: '', label: 'Semua Jalur' },
  { value: 'domisili', label: 'Domisili' },
  { value: 'afirmasi', label: 'Afirmasi' },
  { value: 'mutasi', label: 'Mutasi' },
]

const DESA_LIST = ['', 'Lemahabang', 'Lemahabang Wetan', 'Lemahabang Kulon', 'Sigong', 'Kedawung', 'Tuk', 'Puloledang', 'Karangegel', 'Cilangkap', 'Picungpugur', 'Wangunreja', 'Sindanghayu', 'Bawang', 'Lemahabang Indah']

export default function SpmbPage() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()

  if (authStatus === 'loading') return <div className="p-8 text-center text-text-muted">Memuat...</div>
  if (!session) { router.push('/login'); return null }

  const isAdmin = session?.user?.role === 'admin_kecamatan'
  return <SpmbContent isAdmin={isAdmin} sekolahId={session?.user?.sekolah_id ?? undefined} />
}

function SpmbContent({ isAdmin, sekolahId }: { isAdmin: boolean; sekolahId?: string }) {

  const [tahun, setTahun] = useState('2026/2027')
  const [adminTab, setAdminTab] = useState(0)
  const [opTab, setOpTab] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const bump = () => setRefreshKey(k => k + 1)

  const [search, setSearch] = useState('')
  const [filterSekolah, setFilterSekolah] = useState('')
  const [filterJalur, setFilterJalur] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDesa, setFilterDesa] = useState('')

  const [modal, setModal] = useState<{ type: string; data?: any } | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null)

  const showToast = (ok: boolean, msg: string) => {
    setToast({ ok, msg })
    setTimeout(() => setToast(null), 3000)
  }

  const dtKey = `spmb-dt-${tahun}-${search}-${filterDesa}-${refreshKey}`
  const { data: dtData, loading: dtLoading } = useData<{ data: any[] }>(dtKey, () => fetchJson(`/api/spmb/daya-tampung?tahun_pelajaran=${encodeURIComponent(tahun)}&search=${encodeURIComponent(search)}&desa=${encodeURIComponent(filterDesa)}`))

  const pfKey = `spmb-pf-${tahun}-${search}-${filterSekolah}-${filterJalur}-${filterStatus}-${refreshKey}`
  const { data: pfData, loading: pfLoading } = useData<{ data: any[] }>(pfKey, () => fetchJson(`/api/spmb/pendaftar?tahun_pelajaran=${encodeURIComponent(tahun)}&search=${encodeURIComponent(search)}&sekolah_id=${filterSekolah}&jalur=${filterJalur}&status=${filterStatus}`))

  const rjKey = `spmb-rj-${tahun}-${filterJalur}-${filterDesa}-${refreshKey}`
  const { data: rjData, loading: rjLoading } = useData<{ data: any[]; stats: any }>(rjKey, () => fetchJson(`/api/spmb/rekap?type=jalur&tahun_pelajaran=${encodeURIComponent(tahun)}&jalur=${filterJalur}&desa=${encodeURIComponent(filterDesa)}`))

  const ruKey = `spmb-ru-${tahun}-${filterSekolah}-${filterDesa}-${refreshKey}`
  const { data: ruData, loading: ruLoading } = useData<{ data: any[]; summary: any }>(ruKey, () => fetchJson(`/api/spmb/rekap?type=usia&tahun_pelajaran=${encodeURIComponent(tahun)}&sekolah_id=${filterSekolah}&desa=${encodeURIComponent(filterDesa)}`))

  const moKey = `spmb-mo-${tahun}-${refreshKey}`
  const { data: moData, loading: moLoading } = useData<{ data: any[] }>(moKey, () => fetchJson(`/api/spmb/rekap?type=monitoring&tahun_pelajaran=${encodeURIComponent(tahun)}`))

  const { data: schoolsData } = useData<{ data: any[] }>('schools-all', () => fetchJson('/api/schools'))

  const schools = schoolsData?.data || []

  const doExport = async (type: string, format: string) => {
    try {
      const res = await fetch('/api/spmb/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, format, tahunPelajaran: tahun, sekolahId: filterSekolah || undefined, jalur: filterJalur || undefined }),
      })
      if (!res.ok) { showToast(false, 'Gagal export'); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url
      a.download = `${type}_${tahun}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
      a.click(); URL.revokeObjectURL(url)
      showToast(true, `Export ${format.toUpperCase()} berhasil`)
    } catch { showToast(false, 'Gagal export') }
  }

  // ---- CRUD helpers ----
  const addDayaTampung = async () => {
    // Find schools without daya tampung
    const existingIds = new Set((dtData?.data || []).map((r: any) => r.school_id))
    const missing = schools.filter((s: any) => !existingIds.has(s.id))
    if (missing.length === 0) { showToast(false, 'Semua sekolah sudah memiliki daya tampung'); return }
    const sekolah = missing[0]
    try {
      await fetch('/api/spmb/daya-tampung', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ school_id: sekolah.id, tahun_pelajaran: tahun, jumlah_rombel: 1, kuota_per_rombel: 28 }),
      })
      bump()
      if (missing.length > 1) await addDayaTampung()
      else showToast(true, 'Daya tampung ditambahkan')
    } catch { showToast(false, 'Gagal') }
  }

  const editDayaTampung = async (id: string, jumlah_rombel: number, kuota_per_rombel: number) => {
    try {
      await fetch('/api/spmb/daya-tampung', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, jumlah_rombel, kuota_per_rombel }),
      })
      bump()
      setModal(null)
      showToast(true, 'Daya tampung diperbarui')
    } catch { showToast(false, 'Gagal menyimpan') }
  }

  const deletePendaftar = async (id: string) => {
    if (!confirm('Hapus data pendaftar ini?')) return
    try {
      await fetch(`/api/spmb/pendaftar/${id}`, { method: 'DELETE' })
      bump()
      showToast(true, 'Data pendaftar dihapus')
    } catch { showToast(false, 'Gagal menghapus') }
  }

  const updateStatus = async (id: string, field: string, value: string) => {
    try {
      await fetch(`/api/spmb/pendaftar/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
      bump()
      showToast(true, 'Status diperbarui')
    } catch { showToast(false, 'Gagal memperbarui') }
  }

  // ---- Form state for pendaftar ----
  const emptyForm = () => ({
    nik: '', nama_lengkap: '', jenis_kelamin: 'laki-laki', tempat_lahir: '',
    tanggal_lahir: '', alamat: '', desa: '', asal_tk_paud: '',
    nama_orang_tua: '', no_hp: '', jalur: 'domisili',
  })

  const [form, setForm] = useState<any>(emptyForm())
  const [formError, setFormError] = useState('')

  const savePendaftar = async () => {
    setFormError('')
    if (!form.nik || !form.nama_lengkap || !form.tanggal_lahir) {
      setFormError('NIK, Nama, dan Tanggal Lahir wajib diisi'); return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/spmb/pendaftar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tahun_pelajaran: tahun }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Gagal') }
      setForm(emptyForm())
      setModal(null)
      bump()
      showToast(true, 'Pendaftar berhasil ditambahkan')
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container-page space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-main">SPMB / PPDB</h1>
        <select value={tahun} onChange={e => { setTahun(e.target.value); setRefreshKey(k => k + 1) }}
          className="px-3 py-2 rounded-[10px] border border-border bg-white text-sm font-medium">
          {TAHUN_PELAJARAN.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Submenu */}
      <div className="flex flex-wrap gap-2">
        {(isAdmin ? ADMIN_TABS : OPERATOR_TABS).map((t, i) => {
          const act = isAdmin ? adminTab : opTab
          const setAct = isAdmin ? setAdminTab : setOpTab
          const Icon = t.icon
          return (
            <button key={t.key} onClick={() => setAct(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${act === i ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text-main hover:bg-zinc-100'}`}>
              <Icon className="w-3.5 h-3.5" />{t.label}
            </button>
          )
        })}
      </div>

        {/* ==================== DAYA TAMPUNG (Admin) ==================== */}
        {isAdmin && adminTab === 0 && (
          <div className="card">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="font-semibold text-text-main">Daya Tampung</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setModal({ type: 'export_dt' })} className="btn-ghost btn-sm flex items-center gap-1"><Download className="w-3.5 h-3.5" />Export</button>
                <button onClick={addDayaTampung} className="btn-primary btn-sm flex items-center gap-1"><Plus className="w-3.5 h-3.5" />Tambah Otomatis</button>
              </div>
            </div>
            <div className="p-3 flex flex-wrap items-center gap-3 border-b border-border">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari sekolah..." className="w-full pl-9 pr-3 py-1.5 border border-border rounded-lg text-sm" />
              </div>
              <select value={filterDesa} onChange={e => setFilterDesa(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-sm">
                <option value="">Semua Desa</option>
                {DESA_LIST.filter(Boolean).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {dtLoading ? <Skeleton rows={5} cols={7} /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-zinc-50 border-b border-border">
                    <th className="text-left px-4 py-3 font-semibold text-text-muted">NPSN</th>
                    <th className="text-left px-4 py-3 font-semibold text-text-muted">Nama Sekolah</th>
                    <th className="text-center px-4 py-3 font-semibold text-text-muted">Jumlah Rombel</th>
                    <th className="text-center px-4 py-3 font-semibold text-text-muted">Kuota/Rombel</th>
                    <th className="text-center px-4 py-3 font-semibold text-text-muted">Total Daya Tampung</th>
                    <th className="text-center px-4 py-3 font-semibold text-text-muted">Terisi</th>
                    <th className="text-center px-4 py-3 font-semibold text-text-muted">Sisa</th>
                    <th className="text-center px-4 py-3 font-semibold text-text-muted">Aksi</th>
                  </tr></thead>
                  <tbody>
                    {(dtData?.data || []).length === 0 ? (
                      <tr><td colSpan={8} className="px-4 py-8 text-center text-text-muted">Belum ada data daya tampung</td></tr>
                    ) : (dtData?.data || []).map((r: any) => (
                      <tr key={r.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                        <td className="px-4 py-3 font-mono text-xs">{r.npsn}</td>
                        <td className="px-4 py-3 font-medium">{r.school_nama}</td>
                        <td className="px-4 py-3 text-center">{r.jumlah_rombel}</td>
                        <td className="px-4 py-3 text-center">{r.kuota_per_rombel}</td>
                        <td className="px-4 py-3 text-center font-semibold">{r.total_daya_tampung}</td>
                        <td className="px-4 py-3 text-center">{r.terisi}</td>
                        <td className={`px-4 py-3 text-center font-semibold ${r.sisa < 0 ? 'text-danger' : r.sisa === 0 ? 'text-yellow-600' : 'text-green-600'}`}>{r.sisa}</td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => setModal({ type: 'edit_dt', data: r })} className="text-primary-light hover:text-primary"><Pencil className="w-4 h-4 inline" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {modal?.type === 'edit_dt' && modal.data && (
              <DayaTampungModal row={modal.data} onSave={editDayaTampung} onClose={() => setModal(null)} />
            )}
            {modal?.type === 'export_dt' && (
              <ExportModal onExport={(fmt) => doExport('daya_tampung', fmt)} onClose={() => setModal(null)} />
            )}
          </div>
        )}

        {/* ==================== DATA PENDAFTAR (Admin) ==================== */}
        {isAdmin && adminTab === 1 && (
          <PendaftarAdminSection
            data={pfData?.data || []}
            loading={pfLoading}
            search={search} setSearch={setSearch}
            schools={schools}
            filterSekolah={filterSekolah} setFilterSekolah={setFilterSekolah}
            filterJalur={filterJalur} setFilterJalur={setFilterJalur}
            filterStatus={filterStatus} setFilterStatus={setFilterStatus}
            doExport={doExport}
            modal={modal} setModal={setModal}
            updateStatus={updateStatus}
            deletePendaftar={deletePendaftar}
            tahun={tahun}
          />
        )}

        {/* ==================== REKAP JALUR (Admin) ==================== */}
        {isAdmin && adminTab === 2 && (
          <div className="space-y-4">
            <div className="card">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="font-semibold text-text-main">Rekap Jalur</h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => doExport('rekap_jalur', 'excel')} className="btn-ghost btn-sm"><Download className="w-3.5 h-3.5 inline mr-1" />Excel</button>
                  <button onClick={() => doExport('rekap_jalur', 'pdf')} className="btn-ghost btn-sm"><FileText className="w-3.5 h-3.5 inline mr-1" />PDF</button>
                </div>
              </div>
              <div className="p-3 flex flex-wrap items-center gap-3 border-b border-border">
                <select value={filterJalur} onChange={e => setFilterJalur(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-sm">
                  {JALUR_LIST.map(j => <option key={j.value} value={j.value}>{j.label}</option>)}
                </select>
                <select value={filterDesa} onChange={e => setFilterDesa(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-sm">
                  <option value="">Semua Desa</option>
                  {DESA_LIST.filter(Boolean).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 p-4">
                {['domisili', 'afirmasi', 'mutasi'].map(j => (
                  <div key={j} className="bg-zinc-50 rounded-lg p-3 text-center">
                    <div className="text-xs text-text-muted uppercase">{j}</div>
                    <div className="text-2xl font-bold text-primary">{(rjData?.stats as any)?.[j] || 0}</div>
                  </div>
                ))}
              </div>
            </div>

            {rjLoading ? <Skeleton rows={4} cols={4} /> : (
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-zinc-50 border-b border-border">
                      <th className="text-left px-4 py-3 font-semibold text-text-muted">Nama Siswa</th>
                      <th className="text-left px-4 py-3 font-semibold text-text-muted">Jalur</th>
                      <th className="text-left px-4 py-3 font-semibold text-text-muted">Sekolah</th>
                      <th className="text-left px-4 py-3 font-semibold text-text-muted">Status</th>
                    </tr></thead>
                    <tbody>
                      {(rjData?.data || []).length === 0 ? (
                        <tr><td colSpan={4} className="px-4 py-8 text-center text-text-muted">Tidak ada data</td></tr>
                      ) : (rjData?.data || []).map((r: any) => (
                        <tr key={r.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                          <td className="px-4 py-3 font-medium">{r.nama_lengkap}</td>
                          <td className="px-4 py-3"><Badge status={r.jalur} colorMap={{ domisili: 'text-blue-700 bg-blue-100', afirmasi: 'text-purple-700 bg-purple-100', mutasi: 'text-orange-700 bg-orange-100' }} /></td>
                          <td className="px-4 py-3">{r.sekolah_nama}</td>
                          <td className="px-4 py-3"><Badge status={r.status_seleksi} colorMap={STATUS_COLORS} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== REKAP USIA (Admin) ==================== */}
        {isAdmin && adminTab === 3 && (
          <div className="space-y-4">
            <div className="card">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="font-semibold text-text-main">Rekap Usia</h3>
                <button onClick={() => doExport('daya_tampung', 'excel')} className="btn-ghost btn-sm"><Download className="w-3.5 h-3.5 inline mr-1" />Export</button>
              </div>
              <div className="p-3 flex flex-wrap items-center gap-3 border-b border-border">
                <select value={filterSekolah} onChange={e => setFilterSekolah(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-sm">
                  <option value="">Semua Sekolah</option>
                  {schools.map((s: any) => <option key={s.id} value={s.id}>{s.nama}</option>)}
                </select>
                <select value={filterDesa} onChange={e => setFilterDesa(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-sm">
                  <option value="">Semua Desa</option>
                  {DESA_LIST.filter(Boolean).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Summary */}
              {ruData?.summary && (
                <div className="grid grid-cols-3 gap-3 p-4">
                  {[
                    { key: 'lt6', label: '< 6 Tahun', color: 'text-blue-700' },
                    { key: '_6_7', label: '6–7 Tahun', color: 'text-green-700' },
                    { key: 'gt7', label: '> 7 Tahun', color: 'text-orange-700' },
                  ].map(cat => (
                    <div key={cat.key} className="bg-zinc-50 rounded-lg p-3 text-center">
                      <div className="text-xs text-text-muted">{cat.label}</div>
                      <div className={`text-2xl font-bold ${cat.color}`}>{(ruData.summary as any)[cat.key] || 0}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Chart */}
              {(ruData?.data || []).length > 0 && (
                <div className="px-4 pb-4">
                  <div className="h-48 flex items-end gap-2">
                    {(ruData?.data || []).slice(0, 20).map((r: any) => {
                      const max = Math.max(...(ruData?.data || []).map((d: any) => d.total), 1)
                      return (
                        <div key={r.school_id} className="flex-1 flex flex-col items-center gap-1 group relative">
                          <div className="w-full flex flex-col-reverse" style={{ height: `${(r.total / max) * 100}%` }}>
                            <div className="w-full bg-blue-500 rounded-t" style={{ height: `${(r.lt6 / Math.max(r.total, 1)) * 100}%` }} />
                            <div className="w-full bg-green-500" style={{ height: `${(r._6_7 / Math.max(r.total, 1)) * 100}%` }} />
                            <div className="w-full bg-orange-500 rounded-b" style={{ height: `${(r.gt7 / Math.max(r.total, 1)) * 100}%` }} />
                          </div>
                          <span className="text-[8px] text-text-muted truncate w-full text-center">{r.sekolah_nama?.slice(0, 10)}</span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-2 text-xs text-text-muted">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500 inline-block" />&lt;6</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block" />6-7</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-500 inline-block" />&gt;7</span>
                  </div>
                </div>
              )}
            </div>

            {ruLoading ? <Skeleton rows={5} cols={6} /> : (
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-zinc-50 border-b border-border">
                      <th className="text-left px-4 py-3 font-semibold text-text-muted">NPSN</th>
                      <th className="text-left px-4 py-3 font-semibold text-text-muted">Nama Sekolah</th>
                      <th className="text-center px-4 py-3 font-semibold text-text-muted">&lt; 6 Thn</th>
                      <th className="text-center px-4 py-3 font-semibold text-text-muted">6–7 Thn</th>
                      <th className="text-center px-4 py-3 font-semibold text-text-muted">&gt; 7 Thn</th>
                      <th className="text-center px-4 py-3 font-semibold text-text-muted">L</th>
                      <th className="text-center px-4 py-3 font-semibold text-text-muted">P</th>
                      <th className="text-center px-4 py-3 font-semibold text-text-muted">Total</th>
                    </tr></thead>
                    <tbody>
                      {(ruData?.data || []).length === 0 ? (
                        <tr><td colSpan={8} className="px-4 py-8 text-center text-text-muted">Tidak ada data</td></tr>
                      ) : (ruData?.data || []).map((r: any) => (
                        <tr key={r.school_id} className="border-b border-zinc-100 hover:bg-zinc-50">
                          <td className="px-4 py-3 font-mono text-xs">{r.npsn}</td>
                          <td className="px-4 py-3 font-medium">{r.sekolah_nama}</td>
                          <td className="px-4 py-3 text-center text-blue-600 font-medium">{r.lt6}</td>
                          <td className="px-4 py-3 text-center text-green-600 font-medium">{r._6_7}</td>
                          <td className="px-4 py-3 text-center text-orange-600 font-medium">{r.gt7}</td>
                          <td className="px-4 py-3 text-center">{r.l}</td>
                          <td className="px-4 py-3 text-center">{r.p}</td>
                          <td className="px-4 py-3 text-center font-semibold">{r.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== MONITORING KUOTA (Admin) ==================== */}
        {isAdmin && adminTab === 4 && (
          <div className="card">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="font-semibold text-text-main">Monitoring Kuota</h3>
              <button onClick={() => doExport('monitoring', 'excel')} className="btn-ghost btn-sm flex items-center gap-1"><Download className="w-3.5 h-3.5" />Export</button>
            </div>

            {moLoading ? <Skeleton rows={5} cols={5} /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-zinc-50 border-b border-border">
                    <th className="text-left px-4 py-3 font-semibold text-text-muted">Sekolah</th>
                    <th className="text-center px-4 py-3 font-semibold text-text-muted">Daya Tampung</th>
                    <th className="text-center px-4 py-3 font-semibold text-text-muted">Pendaftar</th>
                    <th className="text-center px-4 py-3 font-semibold text-text-muted">Selisih</th>
                    <th className="text-center px-4 py-3 font-semibold text-text-muted">Status</th>
                  </tr></thead>
                  <tbody>
                    {(moData?.data || []).length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-text-muted">Tidak ada data</td></tr>
                    ) : (moData?.data || []).map((r: any) => {
                      const bg = r.status === 'over' ? 'bg-red-50' : r.status === 'under' ? 'bg-yellow-50' : 'bg-green-50'
                      const txtColor = r.status === 'over' ? 'text-red-700' : r.status === 'under' ? 'text-yellow-700' : 'text-green-700'
                      const statusLabel = r.status === 'over' ? 'Over Kuota' : r.status === 'under' ? 'Under Kuota' : 'Normal'
                      return (
                        <tr key={r.school_id} className={`border-b border-zinc-100 hover:bg-zinc-50 ${bg}`}>
                          <td className="px-4 py-3 font-medium">{r.sekolah_nama}</td>
                          <td className="px-4 py-3 text-center">{r.daya_tampung}</td>
                          <td className="px-4 py-3 text-center">{r.pendaftar}</td>
                          <td className={`px-4 py-3 text-center font-semibold ${txtColor}`}>{r.selisih > 0 ? `+${r.selisih}` : r.selisih}</td>
                          <td className="px-4 py-3 text-center"><Badge status={statusLabel} colorMap={{ 'Over Kuota': 'text-red-700 bg-red-100', 'Under Kuota': 'text-yellow-700 bg-yellow-100', Normal: 'text-green-700 bg-green-100' }} /></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ==================== OPERATOR: DATA PENDAFTAR ==================== */}
        {!isAdmin && opTab === 0 && (
          <OperatorPendaftarSection
            data={pfData?.data || []}
            loading={pfLoading}
            search={search} setSearch={setSearch}
            form={form} setForm={setForm}
            formError={formError}
            saving={saving}
            savePendaftar={savePendaftar}
            deletePendaftar={deletePendaftar}
            updateStatus={updateStatus}
            modal={modal} setModal={setModal}
            sekolahId={sekolahId}
            emptyForm={emptyForm}
          />
        )}

        {/* ==================== OPERATOR: REKAP DATA ==================== */}
        {!isAdmin && opTab === 1 && (
          <div className="space-y-4">
            {/* Rekap Jalur */}
            <div className="card">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="font-semibold text-text-main">Rekap Jalur</h3>
              </div>
              {rjLoading ? <Skeleton rows={3} cols={2} /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-zinc-50 border-b border-border">
                      <th className="text-left px-4 py-3 font-semibold text-text-muted">Jalur</th>
                      <th className="text-right px-4 py-3 font-semibold text-text-muted">Jumlah</th>
                    </tr></thead>
                    <tbody>
                      {['domisili', 'afirmasi', 'mutasi'].map(j => (
                        <tr key={j} className="border-b border-zinc-100">
                          <td className="px-4 py-3 capitalize">{j}</td>
                          <td className="px-4 py-3 text-right font-semibold">{(rjData?.stats as any)?.[j] || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Rekap Usia */}
            <div className="card">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="font-semibold text-text-main">Rekap Usia</h3>
              </div>
              {ruLoading ? <Skeleton rows={3} cols={4} /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-zinc-50 border-b border-border">
                      <th className="text-left px-4 py-3 font-semibold text-text-muted">Rentang Usia</th>
                      <th className="text-center px-4 py-3 font-semibold text-text-muted">L</th>
                      <th className="text-center px-4 py-3 font-semibold text-text-muted">P</th>
                      <th className="text-center px-4 py-3 font-semibold text-text-muted">Jumlah</th>
                    </tr></thead>
                    <tbody>
                      {[
                        { key: 'lt6', label: '< 6 Tahun' },
                        { key: '_6_7', label: '6–7 Tahun' },
                        { key: 'gt7', label: '> 7 Tahun' },
                      ].map(cat => {
                        const g = (ruData?.data || []).reduce((acc: any, r: any) => ({ lt6: acc.lt6 + r.lt6, _6_7: acc._6_7 + r._6_7, gt7: acc.gt7 + r.gt7, l: acc.l + r.l, p: acc.p + r.p }), { lt6: 0, _6_7: 0, gt7: 0, l: 0, p: 0 })
                        const l = ruData?.data?.reduce((acc: number, r: any) => acc + (cat.key === 'lt6' ? r.lt6 : cat.key === '_6_7' ? r._6_7 : r.gt7) * (r.l / Math.max(r.total, 1)), 0) || 0
                        const p = ruData?.data?.reduce((acc: number, r: any) => acc + (cat.key === 'lt6' ? r.lt6 : cat.key === '_6_7' ? r._6_7 : r.gt7) * (r.p / Math.max(r.total, 1)), 0) || 0
                        // Simpler: just fetch totals from summary
                        return (
                          <tr key={cat.key} className="border-b border-zinc-100">
                            <td className="px-4 py-3">{cat.label}</td>
                            <td className="px-4 py-3 text-center">-</td>
                            <td className="px-4 py-3 text-center">-</td>
                            <td className="px-4 py-3 text-center font-semibold">{(ruData?.summary as any)?.[cat.key] || 0}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 ${toast.ok ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
            {toast.ok ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {toast.msg}
          </div>
        )}
      </div>
  )
}

// ===================== COMPONENTS =====================

function Badge({ status, colorMap }: { status: string; colorMap: Record<string, string> }) {
  const cls = colorMap[status] || 'text-gray-500 bg-gray-100'
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${cls}`}>{status}</span>
}

function Skeleton({ rows, cols }: { rows: number; cols: number }) {
  return (
    <div className="p-4 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-5 bg-zinc-200 rounded animate-pulse flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

function ExportModal({ onExport, onClose }: { onExport: (fmt: string) => void; onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-semibold text-text-main">Export Data</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-main text-xl leading-none">&times;</button>
        </div>
        <div className="px-6 py-6 flex items-center gap-4">
          <button onClick={() => onExport('excel')} className="btn-primary flex-1 flex items-center justify-center gap-2"><Download className="w-4 h-4" />Excel</button>
          <button onClick={() => onExport('pdf')} className="btn-primary flex-1 flex items-center justify-center gap-2"><FileText className="w-4 h-4" />PDF</button>
        </div>
      </div>
    </div>
  )
}

function DayaTampungModal({ row, onSave, onClose }: { row: any; onSave: (id: string, rombel: number, kuota: number) => void; onClose: () => void }) {
  const [rombel, setRombel] = useState(row.jumlah_rombel)
  const [kuota, setKuota] = useState(row.kuota_per_rombel)
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-semibold text-text-main">Edit Daya Tampung</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-main text-xl leading-none">&times;</button>
        </div>
        <div className="px-6 py-4 space-y-4 text-sm">
          <p className="font-medium">{row.school_nama} ({row.npsn})</p>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-text-muted mb-1">Jumlah Rombel</label>
              <input type="number" value={rombel} onChange={e => setRombel(Number(e.target.value))} className="w-full px-3 py-1.5 border border-border rounded-lg" />
            </div>
            <div className="flex-1">
              <label className="block text-text-muted mb-1">Kuota per Rombel</label>
              <input type="number" value={kuota} onChange={e => setKuota(Number(e.target.value))} className="w-full px-3 py-1.5 border border-border rounded-lg" />
            </div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <span className="text-text-muted">Total Daya Tampung: </span>
            <span className="font-bold text-lg text-primary">{rombel * kuota}</span>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="btn-ghost btn-sm">Batal</button>
          <button onClick={() => onSave(row.id, rombel, kuota)} className="btn-primary btn-sm">Simpan</button>
        </div>
      </div>
    </div>
  )
}

// ===================== ADMIN SECTION: PENDAFTAR =====================

function PendaftarAdminSection({
  data, loading, search, setSearch, schools, filterSekolah, setFilterSekolah,
  filterJalur, setFilterJalur, filterStatus, setFilterStatus, doExport,
  modal, setModal, updateStatus, deletePendaftar, tahun,
}: any) {
  const [detailId, setDetailId] = useState<string | null>(null)
  const { data: detail } = useData<{ data: any }>(detailId ? `spmb-pf-detail-${detailId}` : null, () => fetchJson(`/api/spmb/pendaftar/${detailId!}`))

  return (
    <div className="card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-text-main">Data Pendaftar</h3>
        <button onClick={() => doExport('pendaftar', 'excel')} className="btn-ghost btn-sm flex items-center gap-1"><Download className="w-3.5 h-3.5" />Export</button>
      </div>
      <div className="p-3 flex flex-wrap items-center gap-3 border-b border-border">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama/NIK..." className="w-full pl-9 pr-3 py-1.5 border border-border rounded-lg text-sm" />
        </div>
        <select value={filterSekolah} onChange={e => setFilterSekolah(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-sm min-w-[180px]">
          <option value="">Semua Sekolah</option>
          {schools.map((s: any) => <option key={s.id} value={s.id}>{s.nama}</option>)}
        </select>
        <select value={filterJalur} onChange={e => setFilterJalur(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-sm">
          {JALUR_LIST.map(j => <option key={j.value} value={j.value}>{j.label}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-sm">
          <option value="">Semua Status</option>
          <option value="pending">Pending</option>
          <option value="diterima">Diterima</option>
          <option value="cadangan">Cadangan</option>
          <option value="ditolak">Ditolak</option>
        </select>
      </div>

      {loading ? <Skeleton rows={8} cols={8} /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-zinc-50 border-b border-border">
              <th className="text-left px-4 py-3 font-semibold text-text-muted">No. Pendaftaran</th>
              <th className="text-left px-4 py-3 font-semibold text-text-muted">Nama Siswa</th>
              <th className="text-center px-4 py-3 font-semibold text-text-muted">JK</th>
              <th className="text-center px-4 py-3 font-semibold text-text-muted">Tgl Lahir</th>
              <th className="text-center px-4 py-3 font-semibold text-text-muted">Usia</th>
              <th className="text-center px-4 py-3 font-semibold text-text-muted">Jalur</th>
              <th className="text-left px-4 py-3 font-semibold text-text-muted">Sekolah Tujuan</th>
              <th className="text-center px-4 py-3 font-semibold text-text-muted">Status</th>
              <th className="text-center px-4 py-3 font-semibold text-text-muted">Aksi</th>
            </tr></thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-text-muted">Belum ada pendaftar</td></tr>
              ) : data.map((r: any) => (
                <tr key={r.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                  <td className="px-4 py-3 font-mono text-xs">{r.no_pendaftaran}</td>
                  <td className="px-4 py-3 font-medium">{r.nama_lengkap}</td>
                  <td className="px-4 py-3 text-center">{r.jenis_kelamin === 'laki-laki' ? 'L' : 'P'}</td>
                  <td className="px-4 py-3 text-center text-xs">{r.tanggal_lahir}</td>
                  <td className="px-4 py-3 text-center">{r.usia}</td>
                  <td className="px-4 py-3 text-center"><Badge status={r.jalur} colorMap={{ domisili: 'text-blue-700 bg-blue-100', afirmasi: 'text-purple-700 bg-purple-100', mutasi: 'text-orange-700 bg-orange-100' }} /></td>
                  <td className="px-4 py-3">{r.sekolah_nama}</td>
                  <td className="px-4 py-3 text-center"><Badge status={r.status_seleksi} colorMap={STATUS_COLORS} /></td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => setDetailId(r.id)} className="text-primary-light hover:text-primary"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => updateStatus(r.id, 'status_seleksi', r.status_seleksi === 'diterima' ? 'pending' : 'diterima')} className="text-green-600 hover:text-green-700"><CheckCircle className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {detailId && detail && (
        <div className="modal-overlay" onClick={() => setDetailId(null)}>
          <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-semibold text-text-main">Detail Pendaftar</h3>
              <button onClick={() => setDetailId(null)} className="text-text-muted hover:text-text-main text-xl leading-none">&times;</button>
            </div>
            <div className="px-6 py-4 space-y-3 text-sm max-h-[70vh] overflow-y-auto">
              <Row label="No. Pendaftaran" value={detail.data.no_pendaftaran} />
              <Row label="NIK" value={detail.data.nik} />
              <Row label="Nama Lengkap" value={detail.data.nama_lengkap} />
              <Row label="Jenis Kelamin" value={detail.data.jenis_kelamin} />
              <Row label="Tempat/Tgl Lahir" value={`${detail.data.tempat_lahir || '-'} / ${detail.data.tanggal_lahir}`} />
              <Row label="Usia" value={`${detail.data.usia} Tahun`} />
              <Row label="Alamat" value={detail.data.alamat} />
              <Row label="Desa" value={detail.data.desa} />
              <Row label="Asal TK/PAUD" value={detail.data.asal_tk_paud} />
              <Row label="Nama Orang Tua" value={detail.data.nama_orang_tua} />
              <Row label="No. HP" value={detail.data.no_hp} />
              <Row label="Jalur" value={detail.data.jalur} />
              <Row label="Status Seleksi" value={detail.data.status_seleksi} />
              <Row label="Sekolah Tujuan" value={detail.data.sekolah_nama} />
               <div className="border-t border-border pt-3">
                  <p className="font-semibold mb-2">Status Berkas</p>
                  <Row label="KK" value={detail.data.status_kk} />
                  <Row label="Akta" value={detail.data.status_akta} />
                  <Row label="Dok. Afirmasi" value={detail.data.status_dokumen_afirmasi || detail.data.status_dokumen_tambahan} />
                  <Row label="Dok. Mutasi" value={detail.data.status_dokumen_mutasi || detail.data.status_dokumen_tambahan} />
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-start gap-4">
      <span className="w-36 shrink-0 text-text-muted">{label}</span>
      <span className="font-medium">{value || '-'}</span>
    </div>
  )
}

// ===================== OPERATOR SECTION: PENDAFTAR =====================

function OperatorPendaftarSection({
  data, loading, search, setSearch, form, setForm, formError, saving,
  savePendaftar, deletePendaftar, updateStatus, modal, setModal, sekolahId, emptyForm,
}: any) {
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-text-main">Data Pendaftar</h3>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary btn-sm flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" />{showForm ? 'Tutup' : 'Tambah Pendaftar'}
          </button>
        </div>

        {showForm && (
          <div className="p-4 border-b border-border bg-zinc-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {[
                { key: 'nik', label: 'NIK', type: 'text' },
                { key: 'nama_lengkap', label: 'Nama Lengkap', type: 'text' },
                { key: 'jenis_kelamin', label: 'Jenis Kelamin', type: 'select', options: ['laki-laki', 'perempuan'] },
                { key: 'tempat_lahir', label: 'Tempat Lahir', type: 'text' },
                { key: 'tanggal_lahir', label: 'Tanggal Lahir', type: 'date' },
                { key: 'alamat', label: 'Alamat', type: 'text' },
                { key: 'desa', label: 'Desa', type: 'select', options: DESA_LIST.filter(Boolean) },
                { key: 'asal_tk_paud', label: 'Asal TK/PAUD', type: 'text' },
                { key: 'nama_orang_tua', label: 'Nama Orang Tua/Wali', type: 'text' },
                { key: 'no_hp', label: 'Nomor HP', type: 'text' },
                { key: 'jalur', label: 'Jalur Pendaftaran', type: 'select', options: ['domisili', 'afirmasi', 'mutasi'] },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-text-muted mb-1">{f.label}</label>
                  {f.type === 'select' ? (
                    <select value={form[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                      className="w-full px-3 py-1.5 border border-border rounded-lg bg-white">
                      {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input type={f.type} value={form[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                      className="w-full px-3 py-1.5 border border-border rounded-lg" />
                  )}
                </div>
              ))}
            </div>
            {formError && <p className="text-danger text-sm mt-2">{formError}</p>}
            <div className="flex items-center justify-end gap-3 mt-4">
              <button onClick={() => { setShowForm(false); setForm(emptyForm()) }} className="btn-ghost btn-sm">Batal</button>
              <button onClick={savePendaftar} disabled={saving} className="btn-primary btn-sm flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}{saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        )}

        <div className="p-3 border-b border-border">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari siswa..." className="w-full pl-9 pr-3 py-1.5 border border-border rounded-lg text-sm" />
          </div>
        </div>

        {loading ? <Skeleton rows={5} cols={7} /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-zinc-50 border-b border-border">
                <th className="text-left px-4 py-3 font-semibold text-text-muted">No</th>
                <th className="text-left px-4 py-3 font-semibold text-text-muted">Nama Siswa</th>
                <th className="text-center px-4 py-3 font-semibold text-text-muted">JK</th>
                <th className="text-center px-4 py-3 font-semibold text-text-muted">Usia</th>
                <th className="text-center px-4 py-3 font-semibold text-text-muted">Jalur</th>
                <th className="text-center px-4 py-3 font-semibold text-text-muted">Status</th>
                <th className="text-center px-4 py-3 font-semibold text-text-muted">Aksi</th>
              </tr></thead>
              <tbody>
                {data.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-text-muted">Belum ada pendaftar</td></tr>
                ) : data.map((r: any, i: number) => (
                  <tr key={r.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                    <td className="px-4 py-3">{i + 1}</td>
                    <td className="px-4 py-3 font-medium">{r.nama_lengkap}</td>
                    <td className="px-4 py-3 text-center">{r.jenis_kelamin === 'laki-laki' ? 'L' : 'P'}</td>
                    <td className="px-4 py-3 text-center">{r.usia}</td>
                    <td className="px-4 py-3 text-center capitalize">{r.jalur}</td>
                    <td className="px-4 py-3 text-center"><Badge status={r.status_seleksi} colorMap={STATUS_COLORS} /></td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setModal({ type: 'upload', data: r })} className="text-primary-light hover:text-primary" title="Upload Dokumen">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                        </button>
                        <button onClick={() => deletePendaftar(r.id)} className="text-danger hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {modal?.type === 'upload' && (
        <UploadModal row={modal.data} onClose={() => setModal(null)} onUpload={() => { setModal(null); window.location.reload() }} />
      )}
    </div>
  )
}

function UploadModal({ row, onClose, onUpload }: { row: any; onClose: () => void; onUpload: () => void }) {
  const [uploading, setUploading] = useState(false)
  const [files, setFiles] = useState<Record<string, File | null>>({ kk: null, akta: null, afirmasi: null, mutasi: null })

  const doUpload = async (jenis: string) => {
    const file = files[jenis]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('pendaftar_id', row.id)
      fd.append('jenis', jenis)
      const res = await fetch('/api/spmb/berkas', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Gagal upload')
      setFiles(f => ({ ...f, [jenis]: null }))
      onUpload()
    } catch { alert('Gagal upload') }
    finally { setUploading(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-semibold text-text-main">Upload Dokumen — {row.nama_lengkap}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-main text-xl leading-none">&times;</button>
        </div>
        <div className="px-6 py-4 space-y-4 text-sm">
          {[
            { jenis: 'kk', label: 'Kartu Keluarga' },
            { jenis: 'akta', label: 'Akta Kelahiran' },
            { jenis: 'afirmasi', label: 'Dokumen Afirmasi (opsional)' },
            { jenis: 'mutasi', label: 'Dokumen Mutasi (opsional)' },
          ].map(doc => (
            <div key={doc.jenis} className="p-3 bg-zinc-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{doc.label}</span>
                {row[`file_${doc.jenis}_url`] && (
                  <a href={row[`file_${doc.jenis}_url`]} target="_blank" className="text-xs text-primary-light hover:text-primary">Lihat</a>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input type="file" onChange={e => setFiles(f => ({ ...f, [doc.jenis]: e.target.files?.[0] || null }))} className="flex-1 text-xs" />
                <button onClick={() => doUpload(doc.jenis)} disabled={!files[doc.jenis] || uploading}
                  className="btn-primary btn-xs">Upload</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
