import { useEffect, useMemo, useState } from 'react'
import type { Capture } from '../lib/types'
import { publicUrl } from '../lib/supabase'
import { hhmm, tripDay, legOf } from '../lib/trip'

interface Props {
  c: Capture
  readOnly?: boolean
  onEdit?: (id: string, text: string) => void
  onDelete?: (id: string) => void
}

export default function Postcard({ c, readOnly, onEdit, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(c.transcript || c.note || '')

  const img = c._localUrl || publicUrl(c.image_path)
  const audio = useMemo(() => {
    if (c._audioBlob) return URL.createObjectURL(c._audioBlob)
    return publicUrl(c.audio_path)
  }, [c._audioBlob, c.audio_path])

  useEffect(() => { setDraft(c.transcript || c.note || '') }, [c.transcript, c.note])

  const save = () => { onEdit?.(c.id, draft); setEditing(false) }

  return (
    <article className="postcard">
      {img && <img className="postcard__img" src={img} alt="" loading="lazy" />}
      <div className="stamp">
        {legOf(c.taken_at)}
        <b>{hhmm(c.taken_at)}</b>
        <span>יום {tripDay(c.taken_at)}</span>
      </div>
      {c._pending && <div className="pending">ממתין לרשת</div>}

      <div className="postcard__body">
        {editing ? (
          <>
            <textarea value={draft} onChange={e => setDraft(e.target.value)} />
            <div className="card-actions">
              <button className="mini" onClick={save}>שמירה</button>
              <button className="mini" onClick={() => setEditing(false)}>ביטול</button>
            </div>
          </>
        ) : (
          <p className="transcript">{c.transcript || c.note}</p>
        )}

        {audio && <audio controls src={audio} preload="none" />}

        <div className="place">
          <span className="author">{c.author}</span>
          {c.place_name && <span>{c.place_name}</span>}
          {c.lat != null && c.lng != null && (
            <a
              className="en"
              href={`https://www.google.com/maps/search/?api=1&query=${c.lat},${c.lng}`}
              target="_blank"
              rel="noreferrer"
            >
              {c.lat.toFixed(4)}, {c.lng.toFixed(4)}
            </a>
          )}
          {c.tags?.map(t => <span key={t}>#{t}</span>)}
        </div>

        {!readOnly && !editing && (
          <div className="card-actions">
            <button className="mini" onClick={() => setEditing(true)}>עריכת טקסט</button>
            <button className="mini" data-danger="1" onClick={() => {
              if (confirm('למחוק את הרגע הזה?')) onDelete?.(c.id)
            }}>מחיקה</button>
          </div>
        )}
      </div>
    </article>
  )
}
