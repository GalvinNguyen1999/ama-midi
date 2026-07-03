import type { PresenceUser } from '~/types/midi'

export function readUser(): PresenceUser | null {
  try {
    const info = JSON.parse(localStorage.getItem('userInfo') ?? '{}') as Partial<PresenceUser>
    if (info.id && info.email) return { id: info.id, email: info.email }
    return null
  } catch {
    return null
  }
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}
