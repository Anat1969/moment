import { useEffect, useRef, useState } from 'react'
import { startRecording, canTranscribe, type Recorder } from '../lib/speech'
import { locate, placeName } from '../lib/geo'
import { TAGS, type Member } from '../lib/types'
import type { NewCapture } from '../lib/store'

interface Props {
  author: Member
  onClose: () => void
  onSave: (c: NewCapture) => Promise<void>
}

export default function CaptureSheet({ author, onClose, onSave }: Props) {
  const [image, setImage] = useState<Blob | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [audio, setAudio] = useState<Blob | null>(null)
  const [text, setText] = useState('')
  const [live, setLive] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [fix, setFix] = useState<{ lat: number; lng: number } | null>(null)
  const [place, setPlace] = useState<string | null>(null)
  const [geoMsg, setGeoMsg] = useState('מאתר מיקום…')
  const [busy, setBusy] = useState(false)
  const rec = useRef<Recorder | null>(null)
  const takenAt = useRef(new Date().toISOString())

  useEffect(() => {
    locate()
      .then(async f => {
        setFix(f)
        setGeoMsg('')
        const n = await placeName(f.lat, f.lng)
        if (n) setPlace(n)
      })
      .catch(() => setGeoMsg('אין מיקום — אפשר להוסיף שם מקום בטקסט'))
  }, [])

  const pickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setImage(f)
    setImageUrl(URL.createObjectURL(f))
  }

  const toggleRec = async () => {
    if (live) {
      const r = await rec.current!.stop()
      rec.current = null
      setLive(false)
      setAudio(r.blob)
      if (r.transcript) setText(t => (t ? t + ' ' : '') + r.transcript)
      return
    }
    try {
      const r = await startRecording()
      r.onText(t => setText(t))
      rec.current = r
      setLive(true)
    } catch {
      alert('אין גישה למיקרופון. צריך לאשר בהגדרות הדפדפן.')
    }
  }

  const save = async () => {
    if (live) await toggleRec()
    setBusy(true)
    await onSave({
      author,
      taken_at: takenAt.current,
      transcript: text.trim(),
      note: '',
      lat: fix?.lat ?? null,
      lng: fix?.lng ?? null,
      place_name: place,
      tags,
      imageBlob: image,
      audioBlob: audio
    })
    setBusy(false)
    onClose()
  }

  const canSave = Boolean(image || audio || text.trim())

  return (
    <div className="sheet" role="dialog" aria-label="רגע חדש">
      <div className="sheet__head">
        <h2>רגע חדש</h2>
        <button className="mini" onClick={onClose}>סגירה</button>
      </div>

      <div className="field">
        <span className="label">תמונה</span>
        {imageUrl ? (
          <img className="preview" src={imageUrl} alt="" />
        ) : (
          <label className="drop">
            צילום או בחירה מהגלריה
            <input type="file" accept="image/*" capture="environment" onChange={pickImage} hidden />
          </label>
        )}
        {imageUrl && (
          <div className="card-actions">
            <button className="mini" onClick={() => { setImage(null); setImageUrl(null) }}>החלפת תמונה</button>
          </div>
        )}
      </div>

      <div className="field">
        <span className="label">קול</span>
        <button className="rec" data-live={live ? '1' : '0'} onClick={toggleRec}>
          {live ? 'עצירת הקלטה' : audio ? 'הקלטה נוספת' : 'הקלטה ותמלול'}
        </button>
        <p className="hint">
          {canTranscribe
            ? 'התמלול מופיע בזמן הדיבור. הקול עצמו נשמר תמיד — גם אם התמלול טועה.'
            : 'הדפדפן הזה לא מתמלל אוטומטית. הקול נשמר, והטקסט נכתב בשדה שלמטה.'}
        </p>
      </div>

      <div className="field">
        <span className="label">מה קרה כאן</span>
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="משפט אחד שיזכיר לך את הרגע" />
      </div>

      <div className="field">
        <span className="label">סוג</span>
        <div className="who">
          {TAGS.map(t => (
            <button
              key={t}
              data-on={tags.includes(t) ? '1' : '0'}
              onClick={() => setTags(s => s.includes(t) ? s.filter(x => x !== t) : [...s, t])}
            >{t}</button>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="label">מיקום</span>
        <div className="geo">
          {geoMsg && <div>{geoMsg}</div>}
          {place && <div>{place}</div>}
          {fix && <div>{fix.lat.toFixed(5)}, {fix.lng.toFixed(5)}</div>}
        </div>
      </div>

      <button className="save" disabled={!canSave || busy} onClick={save}>
        {busy ? 'שומר…' : 'שמירת הרגע'}
      </button>
    </div>
  )
}
