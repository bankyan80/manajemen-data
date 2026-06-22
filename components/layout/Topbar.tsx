'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Search,
  Bell,
  ChevronDown,
  LogOut,
  Settings,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { signOut } from 'next-auth/react'

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
    <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between gap-4 border-b border-border bg-surface px-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)] sm:px-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="logo-icon">
            <Image src="/tutwuri.png" alt="Tut Wuri" width={24} height={24} />
          </div>
          <span className="hidden text-sm font-semibold text-text-main sm:block md:text-base">
            Manajemen Satu Data
          </span>
          <span className="text-sm font-semibold text-text-main sm:hidden">
            MSD
          </span>
        </Link>
        <span className="hidden rounded-full bg-secondary-soft px-2.5 py-0.5 text-[11px] font-semibold text-secondary-dark sm:inline-block">
          SD & KB
        </span>
      </div>

      <div className="relative hidden max-w-md flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
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
          className="w-full rounded-[10px] border border-border bg-zinc-50 py-2 pl-10 pr-4 text-sm text-text-main placeholder-text-muted outline-none transition-colors focus:border-primary-light focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,130,246,0.15)]"
        />
        {showDropdown && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-1.5 max-h-64 overflow-auto rounded-xl border border-border bg-surface shadow-dropdown"
          >
            {searchResults.length > 0 ? (
              searchResults.map((result, i) => (
                <div
                  key={i}
                  className="cursor-pointer px-4 py-2.5 text-sm text-text-main hover:bg-primary-soft"
                >
                  {result}
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-text-muted">
                {searchQuery
                  ? 'Tidak ada hasil ditemukan'
                  : 'Ketik untuk mencari...'}
              </div>
            )}
          </div>
        )}
      </div>

      <button
        className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted hover:bg-zinc-100 sm:hidden"
        onClick={() => setSearchOpen(!searchOpen)}
        aria-label="Cari"
      >
        <Search className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-2">
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-text-muted hover:bg-zinc-100"
          aria-label="Notifikasi"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
            3
          </span>
        </button>

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 rounded-[10px] px-2 py-1.5 hover:bg-zinc-100"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
              {initials}
            </div>
            <div className="hidden text-left md:block">
              <p className="text-sm font-medium leading-tight text-text-main">
                {user?.name || 'Pengguna'}
              </p>
              <p className="text-[11px] leading-tight text-text-muted">
                {user?.role
                  ? roleLabels[user.role] || user.role
                  : 'Belum login'}
              </p>
            </div>
            <ChevronDown
              className={`hidden h-4 w-4 text-text-muted transition-transform md:block ${showProfile ? 'rotate-180' : ''}`}
            />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-full mt-1.5 w-56 rounded-xl border border-border bg-surface py-1 shadow-dropdown">
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-medium text-text-main">
                  {user?.name || 'Pengguna'}
                </p>
                <p className="text-xs text-text-muted">{user?.email || ''}</p>
                {user?.role && (
                  <span className="mt-1.5 inline-block rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {roleLabels[user.role] || user.role}
                  </span>
                )}
              </div>
              <Link
                href="/pengaturan"
                onClick={() => setShowProfile(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-main hover:bg-zinc-50"
              >
                <Settings className="h-4 w-4 text-text-muted" />
                Pengaturan
              </Link>
              <button
                onClick={() => { setShowProfile(false); signOut({ callbackUrl: '/login' }); }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>

      {searchOpen && (
        <div className="fixed inset-0 top-16 z-40 border-b border-border bg-surface px-4 pb-4 sm:hidden">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Cari menu, data, atau dokumen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-[10px] border border-border bg-zinc-50 py-2.5 pl-10 pr-4 text-sm text-text-main placeholder-text-muted outline-none focus:border-primary-light focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,130,246,0.15)]"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  )
}
