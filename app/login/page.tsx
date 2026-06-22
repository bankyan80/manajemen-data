'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { AlertCircle, Eye, EyeOff, LogIn } from 'lucide-react'
import { Suspense } from 'react'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errMsg, setErrMsg] = useState('')

  const errorMessages: Record<string, string> = {
    CredentialsSignin: 'Username atau password salah.',
    'Akun belum terdaftar': 'Akun belum terdaftar. Silakan hubungi Admin Kecamatan.',
    'Akun dinonaktifkan': 'Akun Anda dinonaktifkan. Hubungi Admin Kecamatan.',
  }

  const displayError = error ? errorMessages[error] || 'Terjadi kesalahan. Silakan coba lagi.' : errMsg

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrMsg('')
    setLoading(true)

    const result = await signIn('credentials', {
      username,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setErrMsg(errorMessages[result.error] || 'Username atau password salah.')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-900 via-teal-700 to-blue-800 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="rounded-xl bg-white px-8 py-10 shadow-2xl sm:px-12">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 p-2">
              <Image src="/tutwuri.png" alt="Tut Wuri" width={40} height={40} className="h-full w-full object-contain" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
              Manajemen Satu Data
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              Sistem Terpadu Laporan SD & PAUD Tingkat Kecamatan
            </p>
          </div>

          {(displayError) && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
              <span>{displayError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-zinc-700 mb-1">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                required
                autoFocus
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-colors focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                  className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 pr-10 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-colors focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-zinc-400">
            Gunakan akun yang telah terdaftar oleh admin kecamatan
          </p>

          <div className="mt-6 rounded-lg bg-zinc-50 p-4">
            <p className="text-xs font-medium text-zinc-500 mb-2">Akun Demo:</p>
            <div className="space-y-1 text-xs text-zinc-400">
              <p><span className="font-medium text-zinc-600">Admin:</span> admin_Tim / admin456</p>
              <p><span className="font-medium text-zinc-600">Operator:</span> NPSN / spNPSN (contoh: 20210001 / sp20210001)</p>
              <p><span className="font-medium text-zinc-600">Pegawai:</span> NIP / 6 digit terakhir NIP</p>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-white/70">
          Dinas Pendidikan Kabupaten Cirebon – Tim Kerja Kecamatan Lemahabang
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
