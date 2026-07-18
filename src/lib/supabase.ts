import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const configured = Boolean(url && key)

export const supabase = configured
  ? createClient(url, key, { realtime: { params: { eventsPerSecond: 4 } } })
  : (null as any)

export const BUCKET = 'moments'

export function publicUrl(path: string | null): string | null {
  if (!path || !configured) return null
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}
