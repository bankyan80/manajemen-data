'use client'

export default function PageError({
  error,
  reset,
  title = 'Terjadi Kesalahan',
}: {
  error: Error & { digest?: string }
  reset: () => void
  title?: string
}) {
  return (
    <div className="flex items-center justify-center min-h-[50vh] p-8">
      <div className="max-w-lg w-full text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-zinc-900 mb-2">{title}</h2>
        <p className="text-sm text-zinc-500 mb-6">{error.message || 'Silakan coba lagi.'}</p>
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          Coba Lagi
        </button>
      </div>
    </div>
  )
}
