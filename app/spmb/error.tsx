'use client'

export default function SpmbError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-red-600 mb-4">Error pada Halaman SPMB</h2>
      <pre className="bg-zinc-100 p-4 rounded-lg overflow-auto text-sm">
        {error.message}
        {'\n\n'}
        {error.stack}
      </pre>
      <button onClick={reset} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg">
        Coba Lagi
      </button>
    </div>
  )
}
