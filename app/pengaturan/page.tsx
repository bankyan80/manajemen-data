'use client'

import { useState, useEffect } from 'react'
import AppShellTopbar from '@/components/layout/AppShellTopbar'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useData, fetchJson } from '@/lib/useData'
import { X, Loader2, Check, Lock } from 'lucide-react'

const TABS = ['Manajemen User', 'Role & Hak Akses', 'Master Sekolah/Lembaga', 'Data Kecamatan', 'Tahun Pelajaran', 'Periode Laporan', 'Template Laporan', 'Koneksi Google Drive', 'Koneksi Google Spreadsheet', 'Backup Data', 'Log Aktivitas']

type UserRow = {
  id: string; name: string; username: string; email: string | null
  role: string; is_active: number; sekolah_id: string | null; pegawai_id: string | null
  school_nama: string | null; school_npsn: string | null; employee_nama: string | null
}

type SchoolRow = {
  id: string; nama: string; npsn: string; jenjang: string
  status: string; desa: string; kecamatan: string
}

type ActivityLogRow = {
  id: string; action: string; table_name: string; description: string | null
  created_at: number; user_name: string | null; user_role: string | null
}

export default function PengaturanPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(0)

  const { data: usersData, loading: usersLoading } = useData<UserRow[]>('pengaturan-users', () => fetchJson('/api/users'))
  const { data: schoolsData, loading: schoolsLoading } = useData<SchoolRow[]>('pengaturan-sekolah', () => fetchJson('/api/schools'))
  const { data: logsData, loading: logsLoading } = useData<ActivityLogRow[]>('pengaturan-logs', () => fetchJson('/api/activity-logs'))
  const { data: settingsData, loading: settingsLoading } = useData<Record<string, string>>('pengaturan-settings', () => fetchJson('/api/settings'))

  const [izinModal, setIzinModal] = useState<string | null>(null)
  const [izinData, setIzinData] = useState<Record<string, string[]>>({})
  const [izinSaving, setIzinSaving] = useState(false)

  useEffect(() => {
    if (settingsData?.role_permissions) {
      try { setIzinData(JSON.parse(settingsData.role_permissions)) } catch {}
    }
  }, [settingsData])

  const FEATURES: { key: string; label: string }[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'kesiswaan', label: 'Kesiswaan' },
    { key: 'gtk', label: 'GTK / Kepegawaian' },
    { key: 'sarpras', label: 'Sarpras' },
    { key: 'kelembagaan', label: 'Kelembagaan' },
    { key: 'spmb', label: 'SPMB / PPDB' },
    { key: 'transisi', label: 'Transisi SD-SMP' },
    { key: 'rekap_kecamatan', label: 'Rekap Kecamatan' },
    { key: 'cetak_export', label: 'Cetak & Export' },
    { key: 'pengaturan', label: 'Pengaturan' },
    { key: 'arsip_dokumen', label: 'Arsip Dokumen' },
    { key: 'monitoring', label: 'Monitoring' },
  ]

  const ROLES = [
    { key: 'admin_kecamatan', label: 'Admin Kecamatan' },
    { key: 'operator_sekolah', label: 'Operator Sekolah' },
    { key: 'pegawai', label: 'Pegawai' },
  ]

  const getRoleFeatures = (role: string): string[] => izinData[role] || FEATURES.map(f => f.key)

  const toggleFeature = (role: string, feature: string) => {
    setIzinData(prev => {
      const current = prev[role] || FEATURES.map(f => f.key)
      const next = current.includes(feature) ? current.filter(f => f !== feature) : [...current, feature]
      return { ...prev, [role]: next }
    })
  }

  const savePermissions = async () => {
    setIzinSaving(true)
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'role_permissions', value: JSON.stringify(izinData) }),
      })
      setIzinModal(null)
    } catch { alert('Gagal menyimpan') }
    finally { setIzinSaving(false) }
  }

  const hasFeature = (role: string, feature: string): boolean => {
    const features = izinData[role]
    if (!features) return true
    return features.includes(feature)
  }

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
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Username</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Role</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Sekolah</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Status</th>
                      <th className="text-left px-4 py-3 font-semibold text-zinc-700">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersLoading ? (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-500">Memuat data user...</td></tr>
                    ) : !usersData || usersData.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-500">Belum ada data user</td></tr>
                    ) : usersData.map((u) => (
                      <tr key={u.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                        <td className="px-4 py-3 font-medium text-zinc-900">{u.name}</td>
                        <td className="px-4 py-3 text-zinc-600">{u.username}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.role === 'admin_kecamatan' ? 'bg-purple-100 text-purple-700' : u.role === 'operator_sekolah' ? 'bg-blue-100 text-blue-700' : 'bg-zinc-100 text-zinc-700'}`}>{u.role === 'admin_kecamatan' ? 'Admin Kecamatan' : u.role === 'operator_sekolah' ? 'Operator Sekolah' : 'Pegawai'}</span>
                        </td>
                        <td className="px-4 py-3">{u.school_nama || u.employee_nama || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{u.is_active ? 'Aktif' : 'Nonaktif'}</span>
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
              {ROLES.map((r) => (
                <div key={r.key} className="border border-zinc-200 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-zinc-900">{r.label}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {getRoleFeatures(r.key).length} / {FEATURES.length} fitur aktif
                    </p>
                  </div>
                  <button onClick={() => { setIzinData(prev => ({ ...prev, [r.key]: getRoleFeatures(r.key) })); setIzinModal(r.key) }} className="text-blue-600 hover:underline text-xs">Edit Izin</button>
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
                  {schoolsLoading ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-zinc-500">Memuat data sekolah...</td></tr>
                  ) : !schoolsData || schoolsData.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-zinc-500">Belum ada data sekolah</td></tr>
                  ) : schoolsData.map((s) => (
                    <tr key={s.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                      <td className="px-4 py-3 font-medium text-zinc-900">{s.nama}</td>
                      <td className="px-4 py-3">{s.npsn}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.jenjang === 'sd' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{s.jenjang.toUpperCase()}</span>
                      </td>
                      <td className="px-4 py-3 uppercase">{s.status}</td>
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
                { nama: 'Template Laporan Bulanan KB', format: 'DOCX', ukuran: '42 KB' },
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
                  {logsLoading ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-zinc-500">Memuat log aktivitas...</td></tr>
                  ) : !logsData || logsData.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-zinc-500">Belum ada aktivitas</td></tr>
                  ) : logsData.map((l) => (
                    <tr key={l.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                      <td className="px-4 py-3 font-medium text-zinc-900">{l.user_name || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${l.action === 'login' ? 'bg-blue-100 text-blue-700' : l.action === 'create' ? 'bg-green-100 text-green-700' : l.action === 'update' ? 'bg-yellow-100 text-yellow-700' : l.action === 'delete' ? 'bg-red-100 text-red-700' : l.action === 'backup' ? 'bg-purple-100 text-purple-700' : 'bg-zinc-100 text-zinc-700'}`}>{l.action.charAt(0).toUpperCase() + l.action.slice(1)}</span>
                      </td>
                      <td className="px-4 py-3">{l.table_name}</td>
                      <td className="px-4 py-3 max-w-[300px] truncate" title={l.description || ''}>{l.description || '-'}</td>
                      <td className="px-4 py-3 text-xs text-zinc-500">{new Date(l.created_at).toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {izinModal && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setIzinModal(null)}>
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
                <h3 className="font-semibold text-zinc-900">Edit Izin — {ROLES.find(r => r.key === izinModal)?.label}</h3>
                <button onClick={() => setIzinModal(null)} className="text-zinc-400 hover:text-zinc-600"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
                {FEATURES.map(f => {
                  const on = (izinData[izinModal] || FEATURES.map(x => x.key)).includes(f.key)
                  return (
                    <label key={f.key} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-50 cursor-pointer">
                      <div onClick={() => toggleFeature(izinModal!, f.key)} className={`w-10 h-5 rounded-full relative transition-colors ${on ? 'bg-blue-600' : 'bg-zinc-300'} cursor-pointer`}>
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </div>
                      <span className="text-sm font-medium text-zinc-900 select-none">{f.label}</span>
                    </label>
                  )
                })}
              </div>
              <div className="px-6 py-4 border-t border-zinc-200 flex justify-end gap-2">
                <button onClick={() => setIzinModal(null)} className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900">Batal</button>
                <button onClick={savePermissions} disabled={izinSaving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2 disabled:opacity-50">
                  {izinSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Simpan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShellTopbar>
  )
}
