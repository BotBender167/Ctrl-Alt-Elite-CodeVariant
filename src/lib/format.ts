const DAY_MS = 86_400_000

export function daysBetween(fromIso: string, toMs: number = Date.now()): number {
  return Math.max(0, Math.floor((toMs - new Date(fromIso).getTime()) / DAY_MS))
}

export function daysBetweenDates(aIso: string, bIso: string): number {
  return Math.max(0, Math.round((new Date(bIso).getTime() - new Date(aIso).getTime()) / DAY_MS))
}

export function fmtDays(days: number): string {
  if (days < 1) return 'less than a day'
  if (days < 60) return `${days} day${days === 1 ? '' : 's'}`
  if (days < 730) return `${Math.round(days / 30)} months`
  return `${(days / 365).toFixed(1).replace(/\.0$/, '')} years`
}

export function fmtMonth(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function fmtTime(ms: number): string {
  return new Date(ms).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function fmtStars(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(n)
}
