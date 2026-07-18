import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase, configured, BUCKET } from './supabase'
import { qAll, qDel, qPut } from './idb'
import type { Capture } from './types'
import { tripDayNum } from './trip'

export interface NewCapture {
  author: Capture['author']
  taken_at: string
  transcript: string
  note: string
  lat: number | null
  lng: number | null
  place_name: string | null
  tags: string[]
  imageBlob: Blob | null
  audioBlob: Blob | null
}

function uid() {
  return (crypto as any).randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2)
}

async function upload(path: string, blob: Blob) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type || 'application/octet-stream',
    upsert: true
  })
  if (error) throw error
  return path
}

async function pushOne(item: any): Promise<void> {
  let image_path: string | null = null
  let audio_path: string | null = null
  if (item.imageBlob) {
    const ext = (item.imageBlob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg')
    image_path = await upload(`img/${item.id}.${ext}`, item.imageBlob)
  }
  if (item.audioBlob) {
    const ext = (item.audioBlob.type.split('/')[1] || 'webm').split(';')[0]
    audio_path = await upload(`aud/${item.id}.${ext}`, item.audioBlob)
  }
  const row = {
    id: item.id,
    taken_at: item.taken_at,
    author: item.author,
    transcript: item.transcript,
    note: item.note,
    lat: item.lat,
    lng: item.lng,
    place_name: item.place_name,
    tags: item.tags,
    trip_day: tripDayNum(item.taken_at),
    image_path,
    audio_path
  }
  const { error } = await supabase.from('captures').upsert(row)
  if (error) throw error
}

export function useCaptures() {
  const [rows, setRows] = useState<Capture[]>([])
  const [queue, setQueue] = useState<Capture[]>([])
  const [online, setOnline] = useState(navigator.onLine)
  const [loading, setLoading] = useState(true)
  const syncing = useRef(false)

  const refreshQueue = useCallback(async () => {
    const items = await qAll<any>()
    setQueue(items.map(i => ({
      ...i,
      image_path: null,
      audio_path: null,
      _pending: true,
      _localUrl: i.imageBlob ? URL.createObjectURL(i.imageBlob) : undefined,
      _audioBlob: i.audioBlob
    })))
  }, [])

  const load = useCallback(async () => {
    if (!configured) { setLoading(false); return }
    const { data, error } = await supabase.from('captures').select('*').order('taken_at', { ascending: true })
    if (!error && data) setRows(data as Capture[])
    setLoading(false)
  }, [])

  const sync = useCallback(async () => {
    if (!configured || syncing.current || !navigator.onLine) return
    syncing.current = true
    try {
      const items = await qAll<any>()
      for (const it of items) {
        try { await pushOne(it); await qDel(it.id) } catch { /* נשאר בתור */ }
      }
      await refreshQueue()
      await load()
    } finally { syncing.current = false }
  }, [load, refreshQueue])

  useEffect(() => {
    load(); refreshQueue()
    const on = () => { setOnline(true); sync() }
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    const t = setInterval(sync, 30000)
    sync()
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); clearInterval(t) }
  }, [load, refreshQueue, sync])

  // סנכרון חי בין כל בני המשפחה
  useEffect(() => {
    if (!configured) return
    const ch = supabase.channel('captures-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'captures' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [load])

  const add = useCallback(async (c: NewCapture) => {
    const item = { id: uid(), ...c }
    await qPut(item)
    await refreshQueue()
    sync()
  }, [refreshQueue, sync])

  const update = useCallback(async (id: string, patch: Partial<Capture>) => {
    setRows(r => r.map(x => x.id === id ? { ...x, ...patch } : x))
    if (configured) await supabase.from('captures').update(patch).eq('id', id)
  }, [])

  const remove = useCallback(async (id: string) => {
    await qDel(id)
    await refreshQueue()
    setRows(r => r.filter(x => x.id !== id))
    if (configured) await supabase.from('captures').delete().eq('id', id)
  }, [refreshQueue])

  const all = [...rows, ...queue].sort((a, b) => a.taken_at.localeCompare(b.taken_at))
  return { all, loading, online, pending: queue.length, add, update, remove, sync }
}
