'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Search,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Settings,
  GraduationCap,
} from 'lucide-react'
import Link from 'next/link'

interface TopbarUser {
  name: string
  email: string
  role: string
  avatar_url?: string | null
}

interface TopbarProps {
  user?: TopbarUser | null
}

const roleLabels: Record<string, string> = {
  admin_kecamatan: 'Admin Kecamatan',
  operator_sekolah: 'Operator Sekolah',
  pegawai: 'Pegawai',
}

export default function Topbar({ user }: TopbarProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setShowProfile(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const searchResults: string[] = []

  const initials = user
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??'

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between gap-4 border-b border-zinc-200 bg-white px-4 shadow-sm sm:px-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-white">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="hidden text-sm font-semibold text-zinc-900 sm:block md:text-base">
            Aplikasi Laporan Pendidikan Kecamatan
          </span>
          <span className="text-sm font-semibold text-zinc-900 sm:hidden">
            ALPK
          </span>
        </div>
        <span className="hidden rounded bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700 sm:inline-block">
          SD & PAUD
        </span>
      </div>

      <div className="relative hidden max-w-md flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Cari menu, data, atau dokumen..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setShowDropdown(e.target.value.length > 0)
          }}
          onFocus={() => {
            if (searchQuery.length > 0) setShowDropdown(true)
          }}
          className="w-full rounded-lg border border-zinc-300 bg-zinc-50 py-2 pl-10 pr-4 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-colors focus:border-teal-500 focus:bg-white focus:ring-1 focus:ring-teal-500"
        />
        {showDropdown && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-1 max-h-64 overflow-auto rounded-lg border border-zinc-200 bg-white shadow-lg"
          >
            {searchResults.length > 0 ? (
              searchResults.map((result, i) => (
                <div
                  key={i}
                  className="cursor-pointer px-4 py-2 text-sm text-zinc-700 hover:bg-teal-50"
                >
                  {result}
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-zinc-400">
                {searchQuery
                  ? 'Tidak ada hasil ditemukan'
                  : 'Ketik untuk mencari...'}
              </div>
            )}
          </div>
        )}
      </div>

      <button
        className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 sm:hidden"
        onClick={() => setSearchOpen(!searchOpen)}
        aria-label="Cari"
      >
        <Search className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-2">
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100"
          aria-label="Notifikasi"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            3
          </span>
        </button>

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-zinc-100"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-xs font-semibold text-white">
              {initials}
            </div>
            <div className="hidden text-left md:block">
              <p className="text-sm font-medium leading-tight text-zinc-900">
                {user?.name || 'Pengguna'}
              </p>
              <p className="text-[11px] leading-tight text-zinc-400">
                {user?.role
                  ? roleLabels[user.role] || user.role
                  : 'Belum login'}
              </p>
            </div>
            <ChevronDown
              className={`hidden h-4 w-4 text-zinc-400 transition-transform md:block ${showProfile ? 'rotate-180' : ''}`}
            />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg">
              <div className="border-b border-zinc-100 px-4 py-3">
                <p className="text-sm font-medium text-zinc-900">
                  {user?.name || 'Pengguna'}
                </p>
                <p className="text-xs text-zinc-500">{user?.email || ''}</p>
                {user?.role && (
                  <span className="mt-1 inline-block rounded bg-teal-100 px-2 py-0.5 text-[10px] font-medium text-teal-700">
                    {roleLabels[user.role] || user.role}
                  </span>
                )}
              </div>
              <Link
                href="/pengaturan"
                onClick={() => setShowProfile(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                <Settings className="h-4 w-4" />
                Pengaturan
              </Link>
              <Link
                href="/pengaturan"
                onClick={() => setShowProfile(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                <LogOut className="h-4 w-4" />
                Keluar
              </Link>
            </div>
          )}
        </div>
      </div>

      {searchOpen && (
        <div className="fixed inset-0 top-16 z-40 bg-white px-4 pb-4 sm:hidden">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari menu, data, atau dokumen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-zinc-50 py-2.5 pl-10 pr-4 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-teal-500 focus:bg-white focus:ring-1 focus:ring-teal-500"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  )
}
