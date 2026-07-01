'use client'

import { useState, useEffect, useCallback } from 'react'
import { safeFetch } from '@/lib/safe-fetch'
import { GraduationCap, Save, Loader2 } from 'lucide-react'

interface Summary {
  jumlah_lulusan: number
  smp_negeri_l: number; smp_negeri_p: number
  smp_swasta_l: number; smp_swasta_p: number
  pondok_l: number; pondok_p: number
  tidak_melanjutkan_l: number; tidak_melanjutkan_p: number
}

const EMPTY: Summary = {
  jumlah_lulusan: 0,
  smp_negeri_l: 0, smp_negeri_p: 0,
  smp_swasta_l: 0, smp_swasta_p: 0,
  pondok_l: 0, pondok_p: 0,
  tidak_melanjutkan_l: 0, tidak_melanjutkan_p: 0,
}

export default function AlumniClient() {
  const [items, setItems] = useState<{ school_id: string; school_nama: string; summary: Summary }[]>([])
  const [loading, setLoading] = useState(true)
  const [tahunFilter, setTahunFilter] = useState('')
  const [tahunList, setTahunList] = useState<string[]>([])
  const [editData, setEditData] = useState<Record<string, Summary>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [userRole, setUserRole] = useState('')

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(s => {
      const u = s?.user as any
      setUserRole(u?.role || '')
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (userRole === 'operator_sekolah' && tahunList.length === 0 && !tahunFilter) {
      setTahunFilter('2025/2026')
    }
  }, [userRole, tahunList, tahunFilter])

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (tahunFilter) params.set('tahun_lulus', tahunFilter)
      const result = await safeFetch<any>(`/api/v2/alumni?${params}`)
      setItems(result.data || [])
      if (result.tahun_list) setTahunList(result.tahun_list)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [tahunFilter])

  useEffect(() => { fetchItems() }, [fetchItems])

  const handleSave = async (schoolId: string) => {
    const data = editData[schoolId]
    if (!data || !tahunFilter) return
    setSaving(schoolId)
    try {
      await safeFetch('/api/v2/alumni/tujuan', {
        method: 'PUT',
        body: JSON.stringify({ school_id: schoolId, tahun_lulus: tahunFilter, ...data }),
      })
      setEditData(prev => { const n = { ...prev }; delete n[schoolId]; return n })
      fetchItems()
    } catch (err: unknown) { alert(err instanceof Error ? err.message : 'Gagal menyimpan') }
    finally { setSaving(null) }
  }

  const setVal = (schoolId: string, field: keyof Summary, val: number) => {
    setEditData(prev => {
      const cur = prev[schoolId] || { ...EMPTY }
      return { ...prev, [schoolId]: { ...cur, [field]: val } }
    })
  }

  const getVal = (schoolId: string, field: keyof Summary): number => {
    if (editData[schoolId]) return editData[schoolId][field]
    const item = items.find(i => i.school_id === schoolId)
    return item?.summary?.[field] ?? 0
  }

  const CatInput = ({ schoolId, fieldL, fieldP }: { schoolId: string; fieldL: keyof Summary; fieldP: keyof Summary }) => (
    <div className="flex items-center justify-center gap-1">
      <div className="flex flex-col items-center">
        <span className="text-[10px] text-slate-400 leading-tight">L</span>
        <input type="number" min="0" className="input text-xs py-1 px-1 w-14 text-center" value={getVal(schoolId, fieldL)} onChange={e => setVal(schoolId, fieldL, Math.max(0, Number(e.target.value)))} />
      </div>
      <div className="flex flex-col items-center">
        <span className="text-[10px] text-slate-400 leading-tight">P</span>
        <input type="number" min="0" className="input text-xs py-1 px-1 w-14 text-center" value={getVal(schoolId, fieldP)} onChange={e => setVal(schoolId, fieldP, Math.max(0, Number(e.target.value)))} />
      </div>
    </div>
  )

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Rekap Kelanjutan Lulusan</h1>
          <p className="page-subtitle">Data siswa melanjutkan dan tidak melanjutkan per sekolah</p>
        </div>
      </div>

      <div className="card mb-6">
        <div className="p-4">
          <div className="relative w-full sm:w-64">
            <input type="text" value={tahunFilter} onChange={e => setTahunFilter(e.target.value)} className="input text-sm" placeholder="Tahun lulus (cth: 2025/2026)" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-12 skeleton w-full" />)}</div>
      ) : !tahunFilter ? (
        <div className="card p-12 text-center text-slate-400 text-sm">
          <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-50" />
          Masukkan tahun lulus untuk melihat/mengisi data
        </div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center text-slate-400 text-sm">
          <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-50" />
          Tidak ada sekolah untuk tahun {tahunFilter}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th className="w-10">No</th>
                  <th>Nama Sekolah</th>
                  <th className="text-center">Jml Lulusan</th>
                  <th className="text-center">SMP Negeri</th>
                  <th className="text-center">SMP Swasta</th>
                  <th className="text-center">Pondok Pesantren</th>
                  <th className="text-center">Tidak Melanjutkan</th>
                  <th className="w-20">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => {
                  const s = editData[item.school_id] || item.summary || EMPTY
                  const totalL = s.smp_negeri_l + s.smp_swasta_l + s.pondok_l + s.tidak_melanjutkan_l
                  const totalP = s.smp_negeri_p + s.smp_swasta_p + s.pondok_p + s.tidak_melanjutkan_p
                  const total = totalL + totalP
                  const isDirty = editData[item.school_id] !== undefined
                  return (
                    <tr key={item.school_id}>
                      <td className="text-center text-sm text-slate-500">{i + 1}</td>
                      <td className="font-medium text-slate-800 text-sm">{item.school_nama}</td>
                      <td className="text-center">
                        <input type="number" min="0" className="input text-xs py-1 px-1 w-16 text-center" value={s.jumlah_lulusan} onChange={e => setVal(item.school_id, 'jumlah_lulusan', Math.max(0, Number(e.target.value)))} />
                        <div className="text-[10px] text-slate-400 mt-0.5">({total} L+P)</div>
                      </td>
                      <td className="text-center whitespace-nowrap"><CatInput schoolId={item.school_id} fieldL="smp_negeri_l" fieldP="smp_negeri_p" /></td>
                      <td className="text-center whitespace-nowrap"><CatInput schoolId={item.school_id} fieldL="smp_swasta_l" fieldP="smp_swasta_p" /></td>
                      <td className="text-center whitespace-nowrap"><CatInput schoolId={item.school_id} fieldL="pondok_l" fieldP="pondok_p" /></td>
                      <td className="text-center whitespace-nowrap"><CatInput schoolId={item.school_id} fieldL="tidak_melanjutkan_l" fieldP="tidak_melanjutkan_p" /></td>
                      <td>
                        <button onClick={() => handleSave(item.school_id)} disabled={saving === item.school_id || !isDirty} className={`p-1.5 rounded-lg text-xs flex items-center gap-1 ${isDirty ? 'hover:bg-green-50 text-green-600' : 'text-slate-300 cursor-not-allowed'}`}>
                          {saving === item.school_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
