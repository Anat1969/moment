import { useEffect, useMemo, useState } from 'react'
import { useCaptures } from './lib/store'
import { MEMBERS, type Member } from './lib/types'
import { allTripDays, dayKey, hebDate, legOf, tripDay } from './lib/trip'
import { configured } from './lib/supabase'
import Postcard from './components/Postcard'
import CaptureSheet from './components/CaptureSheet'
import MapView from './components/MapView'

type Tab = 'ציר' | 'מפה'

function useHashDay(): [string | null, (d: string | null) => void] {
  const read = () => {
    const m = location.hash.match(/^#\/share\/(\d{4}-\d{2}-\d{2})/)
    return m ? m[1] : null
  }
  const [v, setV] = useState<string | null>(read)
  useEffect(() => {
    const h = () => setV(read())
    window.addEventListener('hashchange', h)
    return () => window.removeEventListener('hashchange', h)
  }, [])
  return [v, d => { location.hash = d ? `/share/${d}` : '' }]
}

export default function App() {
  const { all, online, pending, add, update, remove } = useCaptures()
  const [me, setMe] = useState<Member | null>(() => localStorage.getItem('moment.me') as Member | null)
  const [day, setDay] = useState<string>(() => dayKey(new Date()))
  const [tab, setTab] = useState<Tab>('ציר')
  const [open, setOpen] = useState(false)
  const [shareDay] = useHashDay()

  const byDay = useMemo(() => {
    const m = new Map<string, typeof all>()
    all.forEach(c => {
      const k = dayKey(c.taken_at)
      m.set(k, [...(m.get(k) || []), c])
    })
    return m
  }, [all])

  // תצוגת שיתוף — לקריאה בלבד, בלי כניסה
  if (shareDay) {
    const items = byDay.get(shareDay) || []
    return (
      <div className="app">
        <div className="share-head">
          <div className="kicker">יומן הטיול · {legOf(shareDay + 'T12:00:00')}</div>
          <h1>{tripDay(shareDay + 'T12:00:00')} — {hebDate(shareDay)}</h1>
        </div>
        {items.length === 0
          ? <div className="empty"><h2>אין עדיין רגעים ביום הזה</h2></div>
          : items.map(c => <Postcard key={c.id} c={c} readOnly />)}
      </div>
    )
  }

  if (!me) {
    return (
      <div className="app">
        <div className="gate">
          <h1>רגע</h1>
          <p>יומן הטיול המשותף. מי מתעד?</p>
          <div className="who">
            {MEMBERS.map(m => (
              <button key={m} onClick={() => { localStorage.setItem('moment.me', m); setMe(m) }}>{m}</button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const days = allTripDays()
  const items = byDay.get(day) || []

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(all.map(({ _imageBlob, _audioBlob, _localUrl, ...r }) => r), null, 2)],
      { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `moment-${dayKey(new Date())}.json`
    a.click()
  }

  const share = async () => {
    const url = `${location.origin}/#/share/${day}`
    const title = `${tripDay(day + 'T12:00:00')} — ${hebDate(day)}`
    if (navigator.share) { try { await navigator.share({ title, url }) } catch {} }
    else { await navigator.clipboard.writeText(url); alert('הקישור הועתק') }
  }

  return (
    <div className="app">
      {!online && <div className="offline-flag">אין רשת — הרגעים נשמרים במכשיר ויעלו אוטומטית</div>}
      {!configured && <div className="offline-flag">חסרים פרטי Supabase בקובץ ‎.env‎</div>}

      <header className="top">
        <button className="home-btn" onClick={() => { localStorage.removeItem('moment.me'); setMe(null) }} aria-label="חזרה לדף הראשי">←</button>
        <h1>רגע</h1>
        <div className="meta">
          {me} · {legOf(day + 'T12:00:00')}{pending > 0 ? ` · ${pending} ממתינים` : ''}
        </div>
        <ai-menu />
      </header>

      <nav className="days">
        {days.map(d => (
          <button
            key={d}
            className="day-chip"
            data-on={d === day ? '1' : '0'}
            data-has={byDay.has(d) ? '1' : '0'}
            onClick={() => setDay(d)}
          >
            {tripDay(d + 'T12:00:00')}
          </button>
        ))}
      </nav>

      {tab === 'ציר' ? (
        items.length === 0 ? (
          <div className="empty">
            <h2>היום הזה עוד ריק</h2>
            <p>תמונה אחת, משפט אחד — וזה נשמר לכולם.</p>
          </div>
        ) : (
          <>
            {items.map(c => (
              <Postcard
                key={c.id}
                c={c}
                onEdit={(id, text) => update(id, { transcript: text })}
                onDelete={remove}
              />
            ))}
            <div className="card-actions" style={{ margin: '0 18px 24px' }}>
              <button className="mini" onClick={share}>שיתוף היום</button>
              <button className="mini" onClick={exportJson}>ייצוא לקובץ</button>
            </div>
          </>
        )
      ) : (
        <MapView items={all} />
      )}

      <div className="bar">
        <button className="bar__tab" data-on={tab === 'ציר' ? '1' : '0'} onClick={() => setTab('ציר')}>ציר</button>
        <button className="bar__tab" data-on={tab === 'מפה' ? '1' : '0'} onClick={() => setTab('מפה')}>מפה</button>
        <button className="bar__cta" onClick={() => setOpen(true)}>רגע חדש</button>
      </div>

      {open && <CaptureSheet author={me} onClose={() => setOpen(false)} onSave={add} />}
    </div>
  )
}
