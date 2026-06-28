export default function PageLoading({ message = 'Memuat data...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-zinc-500">{message}</p>
      </div>
    </div>
  )
}
