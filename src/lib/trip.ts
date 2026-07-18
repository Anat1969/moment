export const PRE_TRIP = '2026-07-18'
export const TRIP_START = '2026-07-23'
export const TRIP_END = '2026-08-19'

const LEGS: { from: string; to: string; label: string }[] = [
  { from: '2026-07-23', to: '2026-08-02', label: 'קנסאי' },
  { from: '2026-08-02', to: '2026-08-13', label: 'הוקאידו' },
  { from: '2026-08-13', to: '2026-08-20', label: 'טוקיו' },
]

export function dayKey(d: Date | string): string {
  const dt = typeof d === 'string' ? new Date(d) : d
  const p = (n: number) => String(n).padStart(2, '0')
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`
}

export function tripDayNum(dateISO: string): number {
  const a = new Date(TRIP_START + 'T00:00:00')
  const b = new Date(dayKey(dateISO) + 'T00:00:00')
  return Math.floor((b.getTime() - a.getTime()) / 86400000) + 1
}

export function tripDay(dateISO: string): string {
  const n = tripDayNum(dateISO)
  if (n <= 0) return hebDate(dayKey(dateISO))
  return `יום ${n}`
}

export function legOf(dateISO: string): string {
  const k = dayKey(dateISO)
  if (k < TRIP_START) return 'לפני הטיול'
  const leg = LEGS.find(l => k >= l.from && k < l.to)
  return leg ? leg.label : 'הטיול'
}

export function allTripDays(): string[] {
  const out: string[] = []
  const a = new Date(PRE_TRIP + 'T00:00:00')
  const b = new Date(TRIP_END + 'T00:00:00')
  for (let d = new Date(a); d <= b; d.setDate(d.getDate() + 1)) out.push(dayKey(d))
  return out
}

export function hebDate(key: string): string {
  const [, m, d] = key.split('-')
  return `${Number(d)}.${Number(m)}`
}

export function hhmm(iso: string): string {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}`
}
