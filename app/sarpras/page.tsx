'use client'

import { useState } from 'react'
import AppShellTopbar from '@/components/layout/AppShellTopbar'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { PackageOpen } from 'lucide-react'

const TABS = ['Ruang Kelas', 'Perpustakaan', 'UKS', 'Toilet/WC', 'Meja Kursi', 'APE PAUD', 'Sanitasi', 'Rumah Dinas', 'Usulan Rehab']

export default function SarprasPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(0)

  if (status === 'loading') return <div className="p-8 text-center text-zinc-500">Memuat...</div>
  if (!session) { router.push('/login'); return null }

  return (
    <AppShellTopbar>
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-zinc-900">Sarana Prasarana</h1>

        <div className="flex flex-wrap gap-1 bg-zinc-100 p-1 rounded-lg">
          <button onClick={() => setActiveTab(0)} className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${activeTab === 0 ? 'bg-white text-blue-700 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}>Semua</button>
          {TABS.map((tab, i) => (
            <button key={i} onClick={() => setActiveTab(i + 1)} className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${activeTab === i + 1 ? 'bg-white text-blue-700 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}>{tab}</button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-12 text-center">
          <PackageOpen className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <h3 className="font-semibold text-zinc-900 mb-2">Belum Ada Data Sarpras</h3>
          <p className="text-sm text-zinc-500 max-w-md mx-auto">
            Data sarana dan prasarana sekolah/lembaga belum diinput. Operator sekolah dapat menambahkan data melalui form input yang akan tersedia di halaman ini.
          </p>
          <button className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            + Tambah Data Sarpras
          </button>
        </div>
      </div>
    </AppShellTopbar>
  )
}
