export function formatDate(date: Date | string | number): string {
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

export function formatDateTime(date: Date | string | number): string {
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${year} ${hours}:${minutes}`
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getDocumentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    belum_upload: 'text-gray-500 bg-gray-100',
    sudah_upload: 'text-blue-700 bg-blue-100',
  }
  return colors[status] || 'text-gray-500 bg-gray-100'
}

export function getVerificationStatusColor(status: string): string {
  const colors: Record<string, string> = {
    belum_diverifikasi: 'text-yellow-700 bg-yellow-100',
    diverifikasi: 'text-green-700 bg-green-100',
    ditolak: 'text-red-700 bg-red-100',
  }
  return colors[status] || 'text-yellow-700 bg-yellow-100'
}

export function getCompletionStatusColor(status: string): string {
  const colors: Record<string, string> = {
    belum_lengkap: 'text-yellow-700 bg-yellow-100',
    lengkap: 'text-green-700 bg-green-100',
    tidak_lengkap: 'text-red-700 bg-red-100',
  }
  return colors[status] || 'text-yellow-700 bg-yellow-100'
}
