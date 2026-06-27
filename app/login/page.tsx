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
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8" style={{background: 'radial-gradient(ellipse 80% 60% at 0% 0%, rgba(30,58,138,0.1), transparent 60%), radial-gradient(ellipse 60% 50% at 100% 100%, rgba(20,184,166,0.08), transparent 50%), linear-gradient(180deg, #f8fafc 0%, #eef6ff 100%)'}}>
      <div className="w-full max-w-md">
        <div className="card px-8 py-10 sm:px-12">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary p-3 shadow-lg shadow-primary/20">
              <Image src="/tutwuri.png" alt="Tut Wuri" width={48} height={48} className="h-full w-full object-contain" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-text-main sm:text-2xl">
              Manajemen Satu Data
            </h1>
            <p className="mt-2 text-sm text-text-muted">
              Sistem Terpadu Laporan Pendidikan Dasar Tingkat Kecamatan Lemahabang
            </p>
          </div>

          {(displayError) && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-danger-soft bg-danger-soft/50 p-4 text-sm text-danger">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{displayError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="form-label">
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
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="password" className="form-label">
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
                  className="w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold shadow-lg shadow-primary/20"
            >
              {loading ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-text-muted">
            Gunakan akun yang telah terdaftar oleh admin kecamatan
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-text-muted">
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
